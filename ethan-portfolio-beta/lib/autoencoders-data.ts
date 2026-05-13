export type Point2D = { x: number; y: number }
export type Point3D = { x: number; y: number; z: number }

export type SwissRollPoint = {
  id: number
  point3d: Point3D
  pca2d: Point2D
  latent2d: Point2D
  hue: number
  t: number
}

export type LatentDigitPoint = {
  id: number
  x: number
  y: number
  label: string
  params: {
    roundness: number
    tilt: number
    thickness: number
    openness: number
    notch: number
  }
}

export type SparseFeature = {
  id: string
  label: string
  weights: number[]
}

export type ConceptFeature = {
  id: string
  label: string
  strength: number
  description: string
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

export function generateSwissRoll(count = 280): SwissRollPoint[] {
  const points: SwissRollPoint[] = []
  for (let i = 0; i < count; i += 1) {
    const u = i / Math.max(1, count - 1)
    const t = 1.5 * Math.PI + u * 3 * Math.PI
    const h = -1 + 2 * ((i * 17) % count) / Math.max(1, count - 1)

    const x = (t * Math.cos(t)) / 8
    const y = h * 1.45
    const z = (t * Math.sin(t)) / 8

    // Deliberately imperfect "PCA-like" flattening.
    const pcaX = x + 0.33 * z
    const pcaY = y + 0.18 * x

    // Nonlinear unrolling using the intrinsic coordinate t.
    const latentX = (t - 1.5 * Math.PI) / (3 * Math.PI) * 2 - 1
    const latentY = h

    points.push({
      id: i,
      point3d: { x, y, z },
      pca2d: { x: pcaX, y: pcaY },
      latent2d: { x: latentX, y: latentY },
      hue: Math.round(210 + 130 * u),
      t,
    })
  }
  return points
}

export function createImageGrid(size: number, fill = 0) {
  return Array.from({ length: size * size }, () => fill)
}

export function drawBlob(
  grid: number[],
  size: number,
  cx: number,
  cy: number,
  radius: number,
  strength = 1,
) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      const value = clamp(1 - d / radius) * strength
      const idx = y * size + x
      grid[idx] = clamp(grid[idx] + value)
    }
  }
  return grid
}

export function drawStroke(
  grid: number[],
  size: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  strength = 1,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const denom = dx * dx + dy * dy || 1
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = clamp(((x - x0) * dx + (y - y0) * dy) / denom)
      const px = x0 + t * dx
      const py = y0 + t * dy
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      const idx = y * size + x
      grid[idx] = clamp(grid[idx] + clamp(1 - dist / width) * strength)
    }
  }
  return grid
}

export function downsampleGrid(source: number[], size: number, factor: number) {
  const bucket = Math.max(1, factor)
  const target = createImageGrid(size, 0)
  for (let by = 0; by < size; by += bucket) {
    for (let bx = 0; bx < size; bx += bucket) {
      let sum = 0
      let count = 0
      for (let y = by; y < Math.min(size, by + bucket); y += 1) {
        for (let x = bx; x < Math.min(size, bx + bucket); x += 1) {
          sum += source[y * size + x]
          count += 1
        }
      }
      const avg = count > 0 ? sum / count : 0
      for (let y = by; y < Math.min(size, by + bucket); y += 1) {
        for (let x = bx; x < Math.min(size, bx + bucket); x += 1) {
          target[y * size + x] = avg
        }
      }
    }
  }
  return target
}

export function addNoise(source: number[], amplitude: number) {
  return source.map((value, index) => {
    const seed = Math.sin(index * 12.9898 + amplitude * 78.233) * 43758.5453
    const noise = (seed - Math.floor(seed)) * 2 - 1
    return clamp(value + amplitude * noise)
  })
}

export function softDenoise(source: number[], size: number, passes = 1) {
  let current = source.slice()
  const next = createImageGrid(size, 0)
  const neighbors = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]

  for (let pass = 0; pass < passes; pass += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let sum = 0
        let weight = 0
        for (const [dx, dy] of neighbors) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
          const idx = ny * size + nx
          sum += current[idx]
          weight += 1
        }
        next[y * size + x] = weight > 0 ? sum / weight : current[y * size + x]
      }
    }
    current = next.slice()
  }

  return current
}

export function makeSourceImage() {
  const size = 16
  const grid = createImageGrid(size, 0)
  drawBlob(grid, size, 8, 8, 6.3, 0.58)
  drawBlob(grid, size, 5, 6, 1.4, 0.95)
  drawBlob(grid, size, 11, 6, 1.4, 0.95)
  drawStroke(grid, size, 4.8, 10.5, 11.4, 10.5, 1.6, 0.72)
  return { size, pixels: grid }
}

export function makeSparseFeatures(size = 12): SparseFeature[] {
  const features: SparseFeature[] = []
  const mk = (id: string, label: string, builder: (grid: number[]) => void) => {
    const grid = createImageGrid(size, 0)
    builder(grid)
    features.push({ id, label, weights: grid })
  }

  mk('vertical-left', 'left edge', (grid) => drawStroke(grid, size, 2, 2, 2, 9, 1.2, 1))
  mk('vertical-right', 'right edge', (grid) => drawStroke(grid, size, 9, 2, 9, 9, 1.2, 1))
  mk('horizontal-mid', 'mid bar', (grid) => drawStroke(grid, size, 2, 5.5, 9, 5.5, 1.2, 1))
  mk('diagonal-rise', 'diagonal rise', (grid) => drawStroke(grid, size, 2, 9, 9, 2, 1.3, 1))
  mk('loop-top', 'top loop', (grid) => drawBlob(grid, size, 6, 4, 2.8, 1))
  mk('loop-bottom', 'bottom loop', (grid) => drawBlob(grid, size, 6, 8, 2.8, 1))
  mk('center-blob', 'center mass', (grid) => drawBlob(grid, size, 6, 6, 2.1, 1))
  mk('curve-left', 'left curve', (grid) => {
    drawBlob(grid, size, 3, 4, 2, 0.9)
    drawBlob(grid, size, 3, 8, 2, 0.9)
  })
  mk('curve-right', 'right curve', (grid) => {
    drawBlob(grid, size, 9, 4, 2, 0.9)
    drawBlob(grid, size, 9, 8, 2, 0.9)
  })
  mk('notch', 'top notch', (grid) => drawStroke(grid, size, 5, 2, 7, 2, 0.8, 1))

  return features
}

export function makeSparseInput(features: SparseFeature[]) {
  const weights = [0.92, 0.8, 0.72, 0.18, 0.65, 0.12, 0.48, 0.44, 0.14, 0.2]
  const size = Math.sqrt(features[0]?.weights.length ?? 144)
  const combined = createImageGrid(size, 0)

  features.forEach((feature, index) => {
    feature.weights.forEach((value, pixel) => {
      combined[pixel] = clamp(combined[pixel] + value * weights[index])
    })
  })

  return { size, pixels: combined, weights }
}

export function makeLatentDigits(): LatentDigitPoint[] {
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const points: LatentDigitPoint[] = []
  labels.forEach((label, labelIndex) => {
    for (let sample = 0; sample < 7; sample += 1) {
      const a = labelIndex / labels.length
      const b = sample / 6
      const angle = a * Math.PI * 2
      const radius = 1.5 + (labelIndex % 3) * 0.4
      const x = Math.cos(angle) * radius + (b - 0.5) * 0.7
      const y = Math.sin(angle) * radius * 0.75 + (sample - 3) * 0.14
      points.push({
        id: labelIndex * 10 + sample,
        x,
        y,
        label,
        params: {
          roundness: clamp(0.15 + (labelIndex === 0 || labelIndex === 8 ? 0.8 : 0.35 + 0.05 * sample)),
          tilt: clamp(0.1 + (labelIndex % 4) * 0.18 + sample * 0.02),
          thickness: clamp(0.2 + (sample % 3) * 0.18),
          openness: clamp(labelIndex === 0 || labelIndex === 6 || labelIndex === 9 ? 0.2 : 0.58 + (sample - 3) * 0.04),
          notch: clamp(labelIndex === 4 || labelIndex === 7 ? 0.85 : 0.2 + (labelIndex % 2) * 0.2),
        },
      })
    }
  })
  return points
}

export function makeConceptFeatures(sentence: string): ConceptFeature[] {
  const lower = sentence.toLowerCase()
  const rule = (needle: string, base: number) => (lower.includes(needle) ? base : base * 0.25)
  return [
    {
      id: 'code',
      label: 'Python code feature',
      strength: clamp(rule('def', 0.88) + rule('python', 0.75) + rule('return', 0.45)),
      description: 'Activates on programming syntax and function structure.',
    },
    {
      id: 'french',
      label: 'French language feature',
      strength: clamp(rule('bonjour', 0.92) + rule('merci', 0.55) + rule('français', 0.65)),
      description: 'Responds to French lexical patterns and accent conventions.',
    },
    {
      id: 'math',
      label: 'Math reasoning feature',
      strength: clamp(rule('integral', 0.9) + rule('proof', 0.6) + rule('theorem', 0.6)),
      description: 'Tracks symbolic reasoning and formal mathematical discourse.',
    },
    {
      id: 'html',
      label: 'HTML syntax feature',
      strength: clamp(rule('<div', 0.92) + rule('</', 0.55) + rule('class=', 0.65)),
      description: 'Sensitive to markup tags, nesting, and DOM-like patterns.',
    },
    {
      id: 'sentiment',
      label: 'Positive sentiment feature',
      strength: clamp(rule('love', 0.9) + rule('great', 0.45) + rule('wonderful', 0.7)),
      description: 'Detects broadly positive affective tone.',
    },
  ]
}

export function makeRateDistortionCurve() {
  return [2, 4, 8, 16, 32, 64, 128].map((dimension) => ({
    dimension,
    error: 0.88 / Math.sqrt(dimension) + 0.03 * Math.log2(dimension),
  }))
}

