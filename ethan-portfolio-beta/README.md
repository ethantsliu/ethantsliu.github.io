# Ethan Portfolio (Next.js + Tailwind + Framer Motion)

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Customize
- Edit `lib/data.ts` (name, links, projects, images)
- Components live in `components/`
- Styling in `app/globals.css`

## Autoencoders Interactive Essay
- Route: `app/autoencoders/page.tsx`
- Shared article layout primitives: `components/autoencoders/ArticlePrimitives.tsx`
- Interactive demos: `components/autoencoders/Demos.tsx`
- Synthetic/precomputed demo data helpers: `lib/autoencoders-data.ts`

Implemented demos:
- `BottleneckSliderDemo`: latent size vs reconstruction quality
- `SwissRollDemo`: rotatable 3D Swiss roll with PCA vs nonlinear latent projection
- `LatentSpaceExplorerDemo`: latent scatter, hover decode, interpolation
- `SparseFeatureViewerDemo`: sparse latent activations plus conceptual mech-interp feature view
- `VAEGaussianExplorerDemo`: Gaussian posterior clouds, reparameterization, KL slider
- `DenoisingDemo`: corruption vs denoising recovery
- `VQVAEDemo`: nearest-neighbor codebook quantization
- `MaskedAutoencoderDemo`: patch masking and reconstruction
- `DiffusionCompressionDemo`: latent diffusion pipeline and compression savings
- `BetaVaeDisentanglementDemo`: factor sliders for disentanglement intuition

## Notes
- No video/recording assets are required. All media are images by default.
