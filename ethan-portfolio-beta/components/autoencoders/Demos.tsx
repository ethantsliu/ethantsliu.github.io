'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addNoise,
  createImageGrid,
  downsampleGrid,
  generateSwissRoll,
  makeConceptFeatures,
  makeLatentDigits,
  makeRateDistortionCurve,
  makeSourceImage,
  makeSparseFeatures,
  makeSparseInput,
  softDenoise,
  type LatentDigitPoint,
  type Point2D,
  type Point3D,
  type SparseFeature,
  type SwissRollPoint,
} from '@/lib/autoencoders-data'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function PixelGrid({
  pixels,
  size,
  className,
  palette = 'cyan',
}: {
  pixels: number[]
  size: number
  className?: string
  palette?: 'cyan' | 'rose' | 'amber'
}) {
  const colors = {
    cyan: ['#082f49', '#0891b2', '#67e8f9', '#ecfeff'],
    rose: ['#4c0519', '#e11d48', '#f9a8d4', '#fff1f2'],
    amber: ['#451a03', '#d97706', '#fcd34d', '#fffbeb'],
  }
  const stops = colors[palette]
  const cell = 14

  const fillFor = (value: number) => {
    if (value < 0.15) return stops[0]
    if (value < 0.4) return stops[1]
    if (value < 0.72) return stops[2]
    return stops[3]
  }

  return (
    <svg
      viewBox={`0 0 ${size * cell} ${size * cell}`}
      className={cn('rounded-2xl border border-white/10 bg-slate-950/60', className)}
      role="img"
      aria-label="Pixel visualization"
    >
      {pixels.map((value, index) => {
        const x = (index % size) * cell
        const y = Math.floor(index / size) * cell
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={cell - 1}
            height={cell - 1}
            rx={2}
            fill={fillFor(value)}
          />
        )
      })}
    </svg>
  )
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
    />
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

export function BottleneckSliderDemo() {
  const source = useMemo(() => makeSourceImage(), [])
  const [latentDim, setLatentDim] = useState(4)
  const [showError, setShowError] = useState(false)

  const reconstruction = useMemo(() => {
    const factor = latentDim <= 2 ? 8 : latentDim <= 4 ? 4 : latentDim <= 8 ? 2 : 1
    const base = downsampleGrid(source.pixels, source.size, factor)
    return base.map((value, index) => {
      const x = index % source.size
      const y = Math.floor(index / source.size)
      const detailBoost = latentDim >= 16 ? 0.12 * Math.sin((x + 1) * (y + 2)) : 0
      return Math.max(0, Math.min(1, value + detailBoost))
    })
  }, [latentDim, source])

  const mse = useMemo(() => {
    const sum = reconstruction.reduce((acc, value, index) => acc + (value - source.pixels[index]) ** 2, 0)
    return sum / reconstruction.length
  }, [reconstruction, source])

  const errorPixels = reconstruction.map((value, index) => Math.min(1, Math.abs(value - source.pixels[index]) * 3))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1.2fr_0.9fr]">
        <div>
          <div className="mb-2 text-sm text-slate-300">Original input</div>
          <PixelGrid pixels={source.pixels} size={source.size} className="w-full" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Reconstruction</span>
            <button
              onClick={() => setShowError((current) => !current)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10"
            >
              {showError ? 'Show reconstruction' : 'Show error map'}
            </button>
          </div>
          <PixelGrid pixels={showError ? errorPixels : reconstruction} size={source.size} palette={showError ? 'rose' : 'cyan'} className="w-full" />
        </div>
        <div className="grid gap-3">
          <SmallStat label="Latent dimension" value={`${latentDim}`} />
          <SmallStat label="Reconstruction MSE" value={mse.toFixed(3)} />
          <SmallStat label="Compression ratio" value={`${Math.round((source.pixels.length / latentDim) * 10) / 10}x`} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>Bottleneck size</span>
          <span className="font-medium text-white">{latentDim}</span>
        </div>
        <Slider value={latentDim} min={2} max={32} step={2} onChange={setLatentDim} />
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Small bottlenecks preserve only coarse structure. Larger bottlenecks recover finer detail because the encoder can keep more information alive in the latent code <code>z</code>.
        </p>
      </div>
    </div>
  )
}

function project3D(point: Point3D, yaw: number, pitch: number) {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)

  const x1 = cy * point.x + sy * point.z
  const z1 = -sy * point.x + cy * point.z
  const y2 = cp * point.y - sp * z1
  const z2 = sp * point.y + cp * z1
  const scale = 92 / (z2 + 6)
  return { x: x1 * scale, y: y2 * scale, depth: z2 }
}

function ScatterPlot2D({
  points,
  field,
  hoveredId,
  setHoveredId,
  selectedIds = [],
}: {
  points: SwissRollPoint[]
  field: 'pca2d' | 'latent2d'
  hoveredId: number | null
  setHoveredId: (id: number | null) => void
  selectedIds?: number[]
}) {
  const width = 320
  const height = 280
  const coords = points.map((point) => point[field])
  const xs = coords.map((point) => point.x)
  const ys = coords.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const pad = 22

  const mapPoint = (point: Point2D) => ({
    x: pad + ((point.x - minX) / (maxX - minX || 1)) * (width - pad * 2),
    y: height - pad - ((point.y - minY) / (maxY - minY || 1)) * (height - pad * 2),
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl border border-white/10 bg-slate-950/50">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      {points.map((point) => {
        const mapped = mapPoint(point[field])
        const active = hoveredId === point.id || selectedIds.includes(point.id)
        return (
          <circle
            key={point.id}
            cx={mapped.x}
            cy={mapped.y}
            r={active ? 5.5 : 3.2}
            fill={`hsl(${point.hue} 85% ${active ? '76%' : '62%'})`}
            opacity={active ? 1 : 0.8}
            onMouseEnter={() => setHoveredId(point.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        )
      })}
    </svg>
  )
}

export function SwissRollDemo() {
  const points = useMemo(() => generateSwissRoll(), [])
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [rotation, setRotation] = useState({ yaw: 0.8, pitch: -0.35 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  const projected = useMemo(() => {
    return points
      .map((point) => ({ point, ...project3D(point.point3d, rotation.yaw, rotation.pitch) }))
      .sort((a, b) => a.depth - b.depth)
  }, [points, rotation])

  const hoveredPoint = points.find((point) => point.id === hoveredId) ?? null

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <div
          className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(to_bottom,rgba(15,23,42,.9),rgba(2,6,23,.9))] p-3"
          onMouseDown={(event) => {
            setDragging(true)
            dragRef.current = { x: event.clientX, y: event.clientY }
          }}
          onMouseLeave={() => setDragging(false)}
          onMouseUp={() => setDragging(false)}
          onMouseMove={(event) => {
            if (!dragging || !dragRef.current) return
            const dx = event.clientX - dragRef.current.x
            const dy = event.clientY - dragRef.current.y
            dragRef.current = { x: event.clientX, y: event.clientY }
            setRotation((current) => ({
              yaw: current.yaw + dx * 0.01,
              pitch: Math.max(-1.2, Math.min(1.2, current.pitch + dy * 0.01)),
            }))
          }}
        >
          <svg viewBox="-160 -140 320 280" className="aspect-[1.2/1] w-full">
            {projected.map(({ point, x, y }) => {
              const active = hoveredId === point.id
              return (
                <circle
                  key={point.id}
                  cx={x}
                  cy={y}
                  r={active ? 5.5 : 3.4}
                  fill={`hsl(${point.hue} 85% ${active ? '72%' : '58%'})`}
                  opacity={active ? 1 : 0.82}
                  onMouseEnter={() => setHoveredId(point.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              )
            })}
          </svg>
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-xs text-slate-300 backdrop-blur">
            <span>Drag to rotate the manifold</span>
            <span>Color tracks the intrinsic coordinate along the roll</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm text-slate-300">PCA projection</div>
            <ScatterPlot2D points={points} field="pca2d" hoveredId={hoveredId} setHoveredId={setHoveredId} />
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-300">Autoencoder latent projection</div>
            <ScatterPlot2D points={points} field="latent2d" hoveredId={hoveredId} setHoveredId={setHoveredId} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 self-start">
        <SmallStat label="Points" value={`${points.length}`} />
        <SmallStat label="Hovered point" value={hoveredPoint ? `#${hoveredPoint.id}` : 'None'} />
        <SmallStat label="Intrinsic t" value={hoveredPoint ? hoveredPoint.t.toFixed(2) : '—'} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
          PCA can only flatten the Swiss roll with a single linear projection, so distant turns overlap. The nonlinear latent map uses the manifold coordinate itself, which “unrolls” the surface into a cleaner rectangle.
        </div>
      </div>
    </div>
  )
}

function renderDigitPixels(params: LatentDigitPoint['params'], size = 24) {
  const pixels = createImageGrid(size, 0)
  const centerX = size / 2 + (params.tilt - 0.5) * 2
  const centerY = size / 2
  const a = 5 + params.roundness * 4
  const b = 6 + (1 - params.roundness) * 3
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const xr = x - centerX - (y - centerY) * (params.tilt - 0.5) * 0.25
      const yr = y - centerY
      const outer = (xr * xr) / (a * a) + (yr * yr) / (b * b)
      const inner = (xr * xr) / ((a - 2 - params.thickness * 1.5) ** 2) + (yr * yr) / ((b - 2 - params.thickness * 1.2) ** 2)
      const ring = outer <= 1.06 && inner >= 1 ? 1 : 0
      const gap = params.openness > 0.45 && x > centerX + a * (0.4 + params.openness * 0.2) && Math.abs(yr) < b * 0.6
      const notch = params.notch > 0.55 && y < size * 0.35 && Math.abs(x - centerX) < params.notch * 3 ? 1 : 0
      const idx = y * size + x
      pixels[idx] = Math.max(ring ? 0.95 : 0, notch ? 0.7 : 0)
      if (gap) pixels[idx] *= 0.15
    }
  }
  return pixels
}

function nearestPoint(points: LatentDigitPoint[], target: Point2D) {
  let best = points[0]
  let bestDistance = Infinity
  for (const point of points) {
    const dist = (point.x - target.x) ** 2 + (point.y - target.y) ** 2
    if (dist < bestDistance) {
      best = point
      bestDistance = dist
    }
  }
  return best
}

export function LatentSpaceExplorerDemo() {
  const points = useMemo(() => makeLatentDigits(), [])
  const [hoveredId, setHoveredId] = useState<number | null>(points[0]?.id ?? null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [t, setT] = useState(0.5)
  const selected = selectedIds.map((id) => points.find((point) => point.id === id)).filter(Boolean) as LatentDigitPoint[]
  const hovered = points.find((point) => point.id === hoveredId) ?? points[0]

  const interpolated = useMemo(() => {
    if (selected.length < 2) return hovered.params
    const [a, b] = selected
    return {
      roundness: a.params.roundness * (1 - t) + b.params.roundness * t,
      tilt: a.params.tilt * (1 - t) + b.params.tilt * t,
      thickness: a.params.thickness * (1 - t) + b.params.thickness * t,
      openness: a.params.openness * (1 - t) + b.params.openness * t,
      notch: a.params.notch * (1 - t) + b.params.notch * t,
    }
  }, [hovered.params, selected, t])

  const width = 420
  const height = 320
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const pad = 30
  const map = (point: Point2D) => ({
    x: pad + ((point.x - minX) / (maxX - minX || 1)) * (width - pad * 2),
    y: height - pad - ((point.y - minY) / (maxY - minY || 1)) * (height - pad * 2),
  })

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <rect width={width} height={height} fill="transparent" />
          {selected.length === 2 && (
            <line
              x1={map(selected[0]).x}
              y1={map(selected[0]).y}
              x2={map(selected[1]).x}
              y2={map(selected[1]).y}
              stroke="rgba(103,232,249,0.5)"
              strokeDasharray="6 6"
            />
          )}
          {points.map((point) => {
            const plotted = map(point)
            const active = point.id === hoveredId || selectedIds.includes(point.id)
            return (
              <g
                key={point.id}
                onMouseEnter={() => setHoveredId(point.id)}
                onClick={() => {
                  setSelectedIds((current) => {
                    if (current.includes(point.id)) return current.filter((id) => id !== point.id)
                    if (current.length === 2) return [current[1], point.id]
                    return [...current, point.id]
                  })
                }}
              >
                <circle
                  cx={plotted.x}
                  cy={plotted.y}
                  r={active ? 12 : 9}
                  fill={selectedIds.includes(point.id) ? 'rgba(103,232,249,0.2)' : 'rgba(255,255,255,0.06)'}
                  stroke={selectedIds.includes(point.id) ? 'rgba(103,232,249,0.85)' : 'rgba(255,255,255,0.08)'}
                />
                <text
                  x={plotted.x}
                  y={plotted.y + 4}
                  textAnchor="middle"
                  className="fill-slate-200 text-[11px] font-medium"
                >
                  {point.label}
                </text>
              </g>
            )
          })}
          {selected.length === 2 && (
            <circle
              cx={map({ x: selected[0].x * (1 - t) + selected[1].x * t, y: selected[0].y * (1 - t) + selected[1].y * t }).x}
              cy={map({ x: selected[0].x * (1 - t) + selected[1].x * t, y: selected[0].y * (1 - t) + selected[1].y * t }).y}
              r={8}
              fill="rgba(244,114,182,0.95)"
            />
          )}
        </svg>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-sm text-slate-300">Hovered decode</div>
            <PixelGrid pixels={renderDigitPixels(hovered.params)} size={24} className="w-full" />
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-300">Interpolated decode</div>
            <PixelGrid pixels={renderDigitPixels(interpolated)} size={24} palette="rose" className="w-full" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Interpolation parameter</span>
            <span className="font-medium text-white">{t.toFixed(2)}</span>
          </div>
          <Slider value={t} min={0} max={1} step={0.01} onChange={setT} />
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Click two points to interpolate along <code>z(t) = (1 - t)z_1 + tz_2</code>. Smooth changes suggest the latent space preserves meaningful variation instead of arbitrary memorized coordinates.
          </p>
        </div>
      </div>
    </div>
  )
}

function topKMask(weights: number[], lambda: number) {
  const k = Math.max(1, Math.round((1 - lambda) * 6))
  const ordered = weights
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => b.weight - a.weight)
  const keep = new Set(ordered.slice(0, k).map((item) => item.index))
  return weights.map((weight, index) => (keep.has(index) ? weight : weight * 0.12 * (1 - lambda)))
}

function reconstructSparse(features: SparseFeature[], activations: number[]) {
  const size = Math.sqrt(features[0]?.weights.length ?? 144)
  const pixels = createImageGrid(size, 0)
  features.forEach((feature, featureIndex) => {
    const activation = activations[featureIndex] ?? 0
    feature.weights.forEach((weight, pixelIndex) => {
      pixels[pixelIndex] = Math.min(1, pixels[pixelIndex] + activation * weight)
    })
  })
  return pixels
}

export function SparseFeatureViewerDemo() {
  const features = useMemo(() => makeSparseFeatures(), [])
  const sparseInput = useMemo(() => makeSparseInput(features), [features])
  const [lambda, setLambda] = useState(0.38)
  const [sentence, setSentence] = useState('def greet(name): return "bonjour " + name')
  const activations = useMemo(() => topKMask(sparseInput.weights, lambda), [lambda, sparseInput.weights])
  const reconstruction = useMemo(() => reconstructSparse(features, activations), [activations, features])
  const activeCount = activations.filter((value) => value > 0.15).length
  const conceptualFeatures = useMemo(() => makeConceptFeatures(sentence), [sentence])

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm text-slate-300">Input pattern</div>
            <PixelGrid pixels={sparseInput.pixels} size={sparseInput.size} className="w-full" />
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-300">Sparse reconstruction</div>
            <PixelGrid pixels={reconstruction} size={sparseInput.size} palette="amber" className="w-full" />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-300">Latent neurons</div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Only a few activate strongly</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white">
              {activeCount} active
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {features.map((feature, index) => (
              <div key={feature.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div
                  className="mb-2 aspect-square rounded-xl transition"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(103,232,249,${Math.min(0.95, activations[index] + 0.05)}), rgba(8,47,73,.35))`,
                  }}
                />
                <div className="text-xs text-slate-300">{feature.label}</div>
                <div className="mt-1 text-sm font-medium text-white">{activations[index].toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>Sparsity strength λ</span>
          <span className="font-medium text-white">{lambda.toFixed(2)}</span>
        </div>
        <Slider value={lambda} min={0.05} max={0.95} step={0.01} onChange={setLambda} />
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Higher <code>λ</code> pushes the model toward fewer active units. Reconstructions become less faithful, but each neuron is forced to become more selective and dictionary-like.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-2 text-sm text-slate-300">Mechanistic interpretability concept demo</div>
          <textarea
            value={sentence}
            onChange={(event) => setSentence(event.target.value)}
            className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-3 text-sm text-slate-300">Conceptual sparse features</div>
          <div className="space-y-3">
            {conceptualFeatures.map((feature) => (
              <div key={feature.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-white">{feature.label}</span>
                  <span className="text-xs text-cyan-200">{feature.strength.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300" style={{ width: `${feature.strength * 100}%` }} />
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`
}

function decodeLatentToFace(zx: number, zy: number, size = 26) {
  const pixels = createImageGrid(size, 0)
  const smile = Math.max(-1, Math.min(1, zx))
  const width = 7 + zy * 2
  const eyeOffset = 5 + zy * 0.5
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x
      const dx = x - size / 2
      const dy = y - size / 2
      const face = dx * dx + dy * dy < 80 ? 0.18 : 0
      const leftEye = (x - (size / 2 - eyeOffset)) ** 2 + (y - 9) ** 2 < 3 ? 1 : 0
      const rightEye = (x - (size / 2 + eyeOffset)) ** 2 + (y - 9) ** 2 < 3 ? 1 : 0
      const mouthCurve = Math.abs(y - (17 + smile * ((dx / width) ** 2) * 3 - smile * 2)) < 1 && Math.abs(dx) < width
      pixels[idx] = Math.min(1, face + leftEye * 0.85 + rightEye * 0.85 + (mouthCurve ? 0.75 : 0))
    }
  }
  return pixels
}

export function VAEGaussianExplorerDemo() {
  const latentPoints = [
    { id: 'a', label: 'thin 3', mu: [-1.4, 0.2], sigma: [0.55, 0.32] },
    { id: 'b', label: 'wide 0', mu: [-0.2, 1.1], sigma: [0.45, 0.42] },
    { id: 'c', label: 'angled 7', mu: [1.3, -0.3], sigma: [0.35, 0.62] },
  ]
  const [beta, setBeta] = useState(0.7)
  const [epsilon, setEpsilon] = useState({ x: 0.35, y: -0.6 })
  const [activeId, setActiveId] = useState('a')
  const active = latentPoints.find((point) => point.id === activeId) ?? latentPoints[0]
  const sigmaScale = 1.15 - beta * 0.55
  const z = {
    x: active.mu[0] + active.sigma[0] * sigmaScale * epsilon.x,
    y: active.mu[1] + active.sigma[1] * sigmaScale * epsilon.y,
  }
  const priorSamples = [
    [-1.2, -0.5],
    [0.15, 0.8],
    [1.05, -0.2],
    [0.6, -1.0],
  ]

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
        <svg viewBox="0 0 420 320" className="w-full">
          <rect width="420" height="320" fill="transparent" />
          {[0, 1, 2, 3, 4].map((grid) => (
            <g key={grid} opacity="0.15">
              <line x1={0} y1={64 * grid} x2={420} y2={64 * grid} stroke="white" />
              <line x1={84 * grid} y1={0} x2={84 * grid} y2={320} stroke="white" />
            </g>
          ))}
          {latentPoints.map((point) => {
            const cx = 210 + point.mu[0] * 70
            const cy = 160 - point.mu[1] * 70
            const rx = point.sigma[0] * sigmaScale * 70
            const ry = point.sigma[1] * sigmaScale * 70
            const activePoint = point.id === activeId
            return (
              <g key={point.id} onClick={() => setActiveId(point.id)} className="cursor-pointer">
                <path d={ellipsePath(cx, cy, rx, ry)} fill="rgba(34,211,238,0.12)" stroke={activePoint ? 'rgba(103,232,249,0.95)' : 'rgba(255,255,255,0.25)'} />
                <circle cx={cx} cy={cy} r={activePoint ? 8 : 6} fill={activePoint ? 'rgba(103,232,249,1)' : 'rgba(226,232,240,0.8)'} />
                <text x={cx + 10} y={cy - 10} className="fill-slate-200 text-[12px]">{point.label}</text>
              </g>
            )
          })}
          <line x1={210 + epsilon.x * 40} y1={160 - epsilon.y * 40} x2={210 + z.x * 70} y2={160 - z.y * 70} stroke="rgba(244,114,182,0.8)" strokeDasharray="7 6" />
          <circle cx={210 + epsilon.x * 40} cy={160 - epsilon.y * 40} r={6} fill="rgba(251,191,36,0.95)" />
          <circle cx={210 + z.x * 70} cy={160 - z.y * 70} r={7} fill="rgba(244,114,182,0.95)" />
          <text x={210 + epsilon.x * 40 + 10} y={160 - epsilon.y * 40 + 4} className="fill-amber-200 text-[12px]">ε</text>
          <text x={210 + z.x * 70 + 10} y={160 - z.y * 70 + 4} className="fill-rose-200 text-[12px]">z</text>
        </svg>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-sm text-slate-300">Sampled latent decode</div>
            <PixelGrid pixels={decodeLatentToFace(z.x, z.y)} size={26} className="w-full" />
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-300">Samples from the prior</div>
            <div className="grid grid-cols-2 gap-2">
              {priorSamples.map((sample, index) => (
                <PixelGrid key={index} pixels={decodeLatentToFace(sample[0], sample[1])} size={26} className="w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>KL strength / β</span>
            <span className="font-medium text-white">{beta.toFixed(2)}</span>
          </div>
          <Slider value={beta} min={0.1} max={1.8} step={0.01} onChange={setBeta} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-sm text-slate-300">ε₁</div>
              <Slider value={epsilon.x} min={-2} max={2} step={0.01} onChange={(value) => setEpsilon((current) => ({ ...current, x: value }))} />
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-300">ε₂</div>
              <Slider value={epsilon.y} min={-2} max={2} step={0.01} onChange={(value) => setEpsilon((current) => ({ ...current, y: value }))} />
            </div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            The encoder predicts <code>μ(x)</code> and <code>σ(x)</code>. We sample <code>ε ~ N(0, I)</code> and set <code>z = μ + σ ⊙ ε</code>. Larger KL pressure pulls latent clouds toward the unit Gaussian prior.
          </p>
        </div>
      </div>
    </div>
  )
}

export function DenoisingDemo() {
  const source = useMemo(() => makeSourceImage(), [])
  const [noise, setNoise] = useState(0.18)
  const noisy = useMemo(() => addNoise(source.pixels, noise), [noise, source])
  const denoised = useMemo(() => softDenoise(noisy, source.size, Math.max(1, Math.round(noise * 8))), [noise, noisy, source.size])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="mb-2 text-sm text-slate-300">Original</div>
          <PixelGrid pixels={source.pixels} size={source.size} className="w-full" />
        </div>
        <div>
          <div className="mb-2 text-sm text-slate-300">Corrupted input</div>
          <PixelGrid pixels={noisy} size={source.size} palette="rose" className="w-full" />
        </div>
        <div>
          <div className="mb-2 text-sm text-slate-300">Reconstruction</div>
          <PixelGrid pixels={denoised} size={source.size} palette="amber" className="w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>Noise amplitude</span>
          <span className="font-medium text-white">{noise.toFixed(2)}</span>
        </div>
        <Slider value={noise} min={0} max={0.45} step={0.01} onChange={setNoise} />
      </div>
    </div>
  )
}

export function VQVAEDemo() {
  const [point, setPoint] = useState({ x: 0.4, y: -0.3 })
  const codebook = [
    { id: 0, x: -1.3, y: 1.0 },
    { id: 1, x: -0.2, y: 0.6 },
    { id: 2, x: 0.8, y: 1.2 },
    { id: 3, x: -1.1, y: -0.8 },
    { id: 4, x: 0.0, y: -0.1 },
    { id: 5, x: 1.2, y: -0.9 },
  ]
  const nearest = useMemo(() => {
    return codebook.reduce((best, current) => {
      const bestDist = (best.x - point.x) ** 2 + (best.y - point.y) ** 2
      const currentDist = (current.x - point.x) ** 2 + (current.y - point.y) ** 2
      return currentDist < bestDist ? current : best
    }, codebook[0])
  }, [codebook, point])

  const width = 360
  const height = 280
  const map = (x: number, y: number) => ({ x: 180 + x * 90, y: 140 - y * 90 })

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseMove={(event) => {
            if (!(event.buttons & 1)) return
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 4
            const y = -((event.clientY - rect.top) / rect.height - 0.5) * 3
            setPoint({ x, y })
          }}
        >
          <rect width={width} height={height} fill="transparent" />
          {codebook.map((entry) => {
            const mapped = map(entry.x, entry.y)
            const active = nearest.id === entry.id
            return (
              <g key={entry.id}>
                <circle cx={mapped.x} cy={mapped.y} r={active ? 12 : 8} fill={active ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.75)'} />
                <text x={mapped.x + 10} y={mapped.y - 10} className="fill-slate-300 text-[11px]">c{entry.id}</text>
              </g>
            )
          })}
          <line x1={map(point.x, point.y).x} y1={map(point.x, point.y).y} x2={map(nearest.x, nearest.y).x} y2={map(nearest.x, nearest.y).y} stroke="rgba(103,232,249,0.8)" strokeDasharray="7 6" />
          <circle cx={map(point.x, point.y).x} cy={map(point.x, point.y).y} r={9} fill="rgba(244,114,182,0.95)" />
        </svg>
      </div>
      <div className="grid gap-3">
        <SmallStat label="Encoder output" value={`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`} />
        <SmallStat label="Nearest codebook vector" value={`c${nearest.id}`} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
          In a VQ-VAE, the encoder proposes a continuous point, but the latent actually stored is the nearest learned codebook vector. This discretizes the representation and makes the latent space behave more like tokens than coordinates.
        </div>
      </div>
    </div>
  )
}

function proceduralFace(params: { rotation: number; width: number; height: number; brightness: number; smile: number }) {
  const size = 28
  const pixels = createImageGrid(size, 0)
  const cx = size / 2
  const cy = size / 2
  const width = 8 + params.width * 5
  const height = 9 + params.height * 5
  const angle = (params.rotation - 0.5) * 0.6
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const xr = (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle)
      const yr = (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle)
      const ellipse = (xr * xr) / (width * width) + (yr * yr) / (height * height)
      const idx = y * size + x
      if (ellipse < 1) pixels[idx] = 0.12 + params.brightness * 0.18
      if ((x - (cx - 4)) ** 2 + (y - (cy - 4)) ** 2 < 3) pixels[idx] = 0.95
      if ((x - (cx + 4)) ** 2 + (y - (cy - 4)) ** 2 < 3) pixels[idx] = 0.95
      const mouth = Math.abs(y - (cy + 5 + params.smile * ((x - cx) ** 2) / 36 - params.smile * 2)) < 1 && Math.abs(x - cx) < 6
      if (mouth) pixels[idx] = 0.78
    }
  }
  return pixels
}

export function BetaVaeDisentanglementDemo() {
  const [state, setState] = useState({
    rotation: 0.5,
    width: 0.5,
    height: 0.5,
    brightness: 0.5,
    smile: 0.5,
  })
  const pixels = useMemo(() => proceduralFace(state), [state])

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <PixelGrid pixels={pixels} size={28} className="w-full max-w-[320px]" />
      <div className="grid gap-4">
        {Object.entries(state).map(([key, value]) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span className="capitalize">{key}</span>
              <span className="font-medium text-white">{value.toFixed(2)}</span>
            </div>
            <Slider
              value={value}
              min={0}
              max={1}
              step={0.01}
              onChange={(next) => setState((current) => ({ ...current, [key]: next }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MaskedAutoencoderDemo() {
  const source = useMemo(() => renderDigitPixels({ roundness: 0.75, tilt: 0.4, thickness: 0.3, openness: 0.2, notch: 0.4 }, 20), [])
  const size = 20
  const [maskRatio, setMaskRatio] = useState(0.5)
  const patch = 4
  const masked = useMemo(() => {
    const output = source.slice()
    const patchCount = (size / patch) * (size / patch)
    const hidden = Math.round(maskRatio * patchCount)
    for (let p = 0; p < hidden; p += 1) {
      const patchIndex = (p * 7) % patchCount
      const px = (patchIndex % (size / patch)) * patch
      const py = Math.floor(patchIndex / (size / patch)) * patch
      for (let y = py; y < py + patch; y += 1) {
        for (let x = px; x < px + patch; x += 1) {
          output[y * size + x] = 0.02
        }
      }
    }
    return output
  }, [maskRatio, source])

  const reconstruction = useMemo(() => {
    const result = masked.slice()
    for (let i = 0; i < result.length; i += 1) {
      if (result[i] < 0.04) result[i] = source[i] * (0.6 + (1 - maskRatio) * 0.35)
    }
    return result
  }, [maskRatio, masked, source])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="mb-2 text-sm text-slate-300">Original</div>
          <PixelGrid pixels={source} size={size} className="w-full" />
        </div>
        <div>
          <div className="mb-2 text-sm text-slate-300">Visible patches</div>
          <PixelGrid pixels={masked} size={size} palette="rose" className="w-full" />
        </div>
        <div>
          <div className="mb-2 text-sm text-slate-300">Reconstruction</div>
          <PixelGrid pixels={reconstruction} size={size} palette="amber" className="w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>Mask ratio</span>
          <span className="font-medium text-white">{Math.round(maskRatio * 100)}%</span>
        </div>
        <Slider value={maskRatio} min={0.25} max={0.9} step={0.01} onChange={setMaskRatio} />
      </div>
    </div>
  )
}

export function DiffusionCompressionDemo() {
  const pixelGrid = 256
  const latentGrid = 32
  const saving = (pixelGrid * pixelGrid) / (latentGrid * latentGrid)
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          {[
            { label: 'Image', detail: '256 × 256 × 3' },
            { label: 'Encoder', detail: 'compress' },
            { label: 'Latents', detail: '32 × 32 × 4' },
            { label: 'Diffusion', detail: 'denoise here' },
            { label: 'Decoder', detail: 'expand' },
            { label: 'Output', detail: '256 × 256 × 3' },
          ].map((step, index) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center">
                <div className="text-sm font-medium text-white">{step.label}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{step.detail}</div>
              </div>
              {index < 5 && <div className="hidden text-cyan-200 sm:block">→</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <SmallStat label="Pixel-space cells" value={`${pixelGrid * pixelGrid}`} />
        <SmallStat label="Latent-space cells" value={`${latentGrid * latentGrid}`} />
        <SmallStat label="Cheaper diffusion state" value={`${saving.toFixed(1)}x smaller`} />
      </div>
    </div>
  )
}

export function CompressionCurveDemo() {
  const points = useMemo(() => makeRateDistortionCurve(), [])
  const width = 440
  const height = 260
  const maxError = Math.max(...points.map((point) => point.error))
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <rect width={width} height={height} fill="transparent" />
        {[0, 1, 2, 3, 4].map((g) => (
          <line key={g} x1={50} y1={30 + g * 45} x2={390} y2={30 + g * 45} stroke="rgba(255,255,255,0.08)" />
        ))}
        <polyline
          fill="none"
          stroke="rgba(103,232,249,0.95)"
          strokeWidth={3}
          points={points
            .map((point, index) => {
              const x = 60 + index * 55
              const y = 210 - (point.error / maxError) * 140
              return `${x},${y}`
            })
            .join(' ')}
        />
        {points.map((point, index) => {
          const x = 60 + index * 55
          const y = 210 - (point.error / maxError) * 140
          return (
            <g key={point.dimension}>
              <circle cx={x} cy={y} r={6} fill="rgba(251,191,36,0.95)" />
              <text x={x} y={235} textAnchor="middle" className="fill-slate-400 text-[11px]">{point.dimension}</text>
            </g>
          )
        })}
        <text x={16} y={100} className="fill-slate-400 text-[12px]" transform="rotate(-90 16 100)">error</text>
        <text x={180} y={252} className="fill-slate-400 text-[12px]">latent dimension / bitrate</text>
      </svg>
    </div>
  )
}

export function LatentSemanticsMiniDemo() {
  const points = useMemo(() => makeLatentDigits(), [])
  const [cursor, setCursor] = useState<Point2D>({ x: 0.3, y: 0.4 })
  const nearest = useMemo(() => nearestPoint(points, cursor), [cursor, points])
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
        <div className="mb-3 text-sm text-slate-300">Move through latent space</div>
        <div
          className="relative h-56 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(8,145,178,.14),transparent_55%)]"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 4
            const y = -((event.clientY - rect.top) / rect.height - 0.5) * 3
            setCursor({ x, y })
          }}
        >
          <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/20" />
          <div
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400 shadow-lg shadow-rose-500/50"
            style={{
              left: `${50 + cursor.x * 16}%`,
              top: `${50 - cursor.y * 18}%`,
              transition: 'left 120ms ease-out, top 120ms ease-out',
            }}
          />
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm text-slate-300">Nearest semantic decode</div>
        <PixelGrid pixels={renderDigitPixels(nearest.params)} size={24} className="w-full" />
      </div>
    </div>
  )
}
