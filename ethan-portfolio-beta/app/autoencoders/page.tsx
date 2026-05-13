import type { Metadata } from 'next'
import {
  ArticleShell,
  Callout,
  CodeBlock,
  ComparisonTable,
  DemoCard,
  Equation,
  HeroHeader,
  Section,
} from '@/components/autoencoders/ArticlePrimitives'
import {
  BetaVaeDisentanglementDemo,
  BottleneckSliderDemo,
  CompressionCurveDemo,
  DenoisingDemo,
  DiffusionCompressionDemo,
  LatentSemanticsMiniDemo,
  LatentSpaceExplorerDemo,
  MaskedAutoencoderDemo,
  SparseFeatureViewerDemo,
  SwissRollDemo,
  VAEGaussianExplorerDemo,
  VQVAEDemo,
} from '@/components/autoencoders/Demos'

export const metadata: Metadata = {
  title: 'Autoencoders: The Geometry of Compression',
  description:
    'An interactive long-form essay on autoencoders, sparse features, VAEs, diffusion models, and representation learning.',
}

const toc = [
  { id: 'introduction', label: '1. What is an autoencoder?' },
  { id: 'not-copying', label: '2. Why they do not just copy' },
  { id: 'geometry', label: '3. Latent geometry' },
  { id: 'pca', label: '4. Autoencoders vs PCA' },
  { id: 'latent-explorer', label: '5. Latent space explorer' },
  { id: 'sparse', label: '6. Sparse autoencoders' },
  { id: 'denoising', label: '7. Denoising autoencoders' },
  { id: 'contractive', label: '8. Contractive autoencoders' },
  { id: 'vae', label: '9. Variational autoencoders' },
  { id: 'beta-vae', label: '10. Beta-VAE and disentanglement' },
  { id: 'vqvae', label: '11. VQ-VAE' },
  { id: 'conv', label: '12. Convolutional autoencoders' },
  { id: 'mae', label: '13. Masked autoencoders' },
  { id: 'diffusion', label: '14. Autoencoders and diffusion' },
  { id: 'repr-learning', label: '15. Representation learning' },
  { id: 'info-theory', label: '16. Information theory view' },
  { id: 'semantics', label: '17. Why latent spaces become semantic' },
  { id: 'pytorch', label: '18. Practical PyTorch tutorial' },
  { id: 'failure-modes', label: '19. Failure modes' },
  { id: 'summary', label: '20. Summary and big picture' },
]

const basicAeCode = `import torch
import torch.nn as nn

class Autoencoder(nn.Module):
    def __init__(self, latent_dim=32):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Flatten(),
            nn.Linear(28 * 28, 256),
            nn.ReLU(),
            nn.Linear(256, latent_dim),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 28 * 28),
            nn.Sigmoid(),
        )

    def forward(self, x):
        z = self.encoder(x)
        x_hat = self.decoder(z)
        return x_hat.view(-1, 1, 28, 28), z

model = Autoencoder(latent_dim=16)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

for x, _ in train_loader:
    x_hat, z = model(x)
    loss = criterion(x_hat, x)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()`

const convAeCode = `class ConvAutoencoder(nn.Module):
    def __init__(self, latent_dim=128):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 32, 3, stride=2, padding=1),  # 28 -> 14
            nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1), # 14 -> 7
            nn.ReLU(),
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, latent_dim),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64 * 7 * 7),
            nn.ReLU(),
            nn.Unflatten(1, (64, 7, 7)),
            nn.Upsample(scale_factor=2, mode="nearest"),
            nn.Conv2d(64, 32, 3, padding=1),
            nn.ReLU(),
            nn.Upsample(scale_factor=2, mode="nearest"),
            nn.Conv2d(32, 1, 3, padding=1),
            nn.Sigmoid(),
        )`

const sparseAeCode = `l1_lambda = 1e-3
x_hat, z = model(x)
recon_loss = F.mse_loss(x_hat, x)
sparsity_penalty = z.abs().mean()
loss = recon_loss + l1_lambda * sparsity_penalty`

const denoisingAeCode = `noise_std = 0.25
noise = torch.randn_like(x) * noise_std
x_tilde = (x + noise).clamp(0, 1)
x_hat, z = model(x_tilde)
loss = F.mse_loss(x_hat, x)`

const vaeCode = `class VAE(nn.Module):
    def __init__(self, latent_dim=16):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Flatten(),
            nn.Linear(784, 256),
            nn.ReLU(),
        )
        self.to_mu = nn.Linear(256, latent_dim)
        self.to_logvar = nn.Linear(256, latent_dim)
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 784),
            nn.Sigmoid(),
        )

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def forward(self, x):
        h = self.backbone(x)
        mu, logvar = self.to_mu(h), self.to_logvar(h)
        z = self.reparameterize(mu, logvar)
        x_hat = self.decoder(z).view(-1, 1, 28, 28)
        return x_hat, mu, logvar

def vae_loss(x_hat, x, mu, logvar):
    recon = F.binary_cross_entropy(x_hat, x, reduction="sum")
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon + kl`

export default function AutoencodersPage() {
  return (
    <ArticleShell toc={toc}>
      <HeroHeader />

      <Section id="introduction" title="1. Introduction: What Is an Autoencoder?">
        <p>
          An autoencoder is a neural network trained to reproduce its own input. The basic pipeline is:
          input <code>x</code> goes through an encoder, becomes a latent code <code>z</code>, then a decoder maps that code back into a reconstruction <code>\\hat x</code>.
        </p>
        <Equation>
          <div>
            <div>z = f_θ(x)</div>
            <div className="mt-2">x̂ = g_φ(z)</div>
            <div className="mt-2">L_recon = ‖x - x̂‖²</div>
          </div>
        </Equation>
        <p>
          The <strong>encoder</strong> compresses the input into a smaller or more structured internal representation. The <strong>decoder</strong> tries to reconstruct the input from that representation. The intermediate space of codes is called the <strong>latent space</strong>. If the latent representation is forced to be limited, the network must keep the important information and discard redundancy.
        </p>
        <Callout title="Intuition Box">
          Compression is not merely a memory trick. It is a training signal. By squeezing data through a constrained representation, we force the model to answer a hard question: what information is worth preserving?
        </Callout>
        <DemoCard
          title="Bottleneck Size Slider"
          subtitle="A toy reconstruction demo showing how latent capacity changes what the model can preserve."
        >
          <BottleneckSliderDemo />
        </DemoCard>
      </Section>

      <Section id="not-copying" title="2. Why Autoencoders Do Not Just Copy the Input">
        <p>
          A large unconstrained autoencoder can learn an identity map. That is not interesting. The useful versions of autoencoders become useful precisely because we stop them from copying too easily.
        </p>
        <Equation>
          <div>ℝⁿ → ℝᵏ → ℝⁿ with k ≪ n</div>
        </Equation>
        <p>
          If the latent dimension <code>k</code> is much smaller than the input dimension <code>n</code>, then perfect copying is impossible unless the data already live near a lower-dimensional structure. This is the <strong>undercomplete</strong> case. Other strategies introduce sparsity constraints, input corruption, weight regularization, or stochastic latent variables.
        </p>
        <ul>
          <li>Undercomplete bottlenecks limit total capacity.</li>
          <li>Sparse autoencoders allow many units but only a few active at once.</li>
          <li>Denoising autoencoders corrupt the input, preventing trivial identity.</li>
          <li>VAEs regularize latent distributions, making random samples meaningful.</li>
        </ul>
        <Callout title="Common Misconception" tone="amber">
          “Autoencoder” does not mean “compressor that automatically learns semantics.” A model only learns useful abstractions if the architecture and objective force useful abstractions to be the easiest solution.
        </Callout>
      </Section>

      <Section id="geometry" title="3. Autoencoders and Latent Geometry" wide>
        <p>
          Natural data often lies near a low-dimensional manifold embedded inside a high-dimensional ambient space. A classic picture is the Swiss roll: intrinsically two-dimensional, but bent into three dimensions. A nonlinear encoder can learn coordinates closer to that intrinsic manifold than a single linear projection can.
        </p>
        <DemoCard
          title="Swiss Roll Geometry"
          subtitle="Rotate the 3D manifold, compare a linear projection with a nonlinear latent unrolling, and track corresponding points by color."
        >
          <SwissRollDemo />
        </DemoCard>
        <Callout title="Math Note" tone="emerald">
          The autoencoder is not literally recovering “the manifold” in a theorem-proof sense. It is learning a coordinate system that reduces reconstruction loss. But when data are well-structured, those learned coordinates often align with the latent factors that generated the data.
        </Callout>
      </Section>

      <Section id="pca" title="4. Autoencoders vs PCA">
        <p>
          There is a precise and important relationship here: a linear autoencoder with a single hidden layer, no nonlinearities, and mean squared reconstruction loss learns the same principal subspace as PCA, up to a rotation of the basis. So PCA is not unrelated to autoencoders. It is the linear special case.
        </p>
        <ComparisonTable
          headers={['Method', 'Strengths', 'Limits']}
          rows={[
            ['PCA', 'Linear, deterministic, fast, interpretable, closed-form subspace view.', 'Can only represent linear subspaces. Curved manifolds get flattened badly.'],
            ['Deep autoencoder', 'Nonlinear, flexible, can model curved manifolds and richer decoding structure.', 'Optimization-based, more opaque, and easier to overfit or regularize poorly.'],
          ]}
        />
        <p>
          On the Swiss roll above, PCA overlays distant turns of the roll. A nonlinear autoencoder can separate them because it is allowed to learn a curved map.
        </p>
      </Section>

      <Section id="latent-explorer" title="5. Latent Space Explorer" wide>
        <p>
          A latent space is useful when nearby codes correspond to nearby data, interpolation looks smooth, and neighborhoods preserve meaningful similarity. The model is still only trained by reconstruction, but the geometry of the latent space often becomes semantically useful.
        </p>
        <DemoCard
          title="Latent Space Explorer"
          subtitle="Hover to inspect a decoded example, click two points to interpolate, and watch the latent path morph the reconstruction."
        >
          <LatentSpaceExplorerDemo />
        </DemoCard>
      </Section>

      <Section id="sparse" title="6. Sparse Autoencoders" wide>
        <p>
          Sparse autoencoders are especially important today because they connect classical dictionary learning with modern mechanistic interpretability. Instead of insisting on a tiny bottleneck, they may use an <strong>overcomplete</strong> latent space with more units than input dimensions, but only a small subset of units is allowed to activate on any given example.
        </p>
        <Equation>
          <div>L = L_recon + λ · sparsity_penalty</div>
        </Equation>
        <p>
          Common sparsity penalties include:
        </p>
        <ul>
          <li><strong>L1 penalties</strong>, which shrink activations toward zero.</li>
          <li><strong>KL sparsity penalties</strong>, which encourage target activation rates.</li>
          <li><strong>Top-k sparsity</strong>, which explicitly keeps only the strongest units active.</li>
        </ul>
        <p>
          The point is subtle but crucial: sparse autoencoders can be overcomplete without collapsing into trivial copying because the model pays for using too many features at once. This makes the latent space behave more like a learned dictionary than a dense bottleneck.
        </p>
        <DemoCard
          title="Sparse Feature Viewer"
          subtitle="Increase sparsity strength, watch fewer neurons light up, and compare the tradeoff between selectivity and reconstruction quality."
        >
          <SparseFeatureViewerDemo />
        </DemoCard>
        <p>
          In mechanistic interpretability, sparse autoencoders are used to decompose dense neural activations into more interpretable feature directions. The motivating idea is that many networks represent multiple concepts in <strong>superposition</strong>: several features share the same neurons or directions. Sparse decomposition attempts to untangle that mixture into a larger set of human-legible features.
        </p>
        <Callout title="Interpretability Connection" tone="rose">
          Sparse autoencoders used on language-model activations do not magically reveal “the ground truth ontology” of the model. They provide a useful basis in which features are more isolated, more inspectable, and often closer to human concepts.
        </Callout>
      </Section>

      <Section id="denoising" title="7. Denoising Autoencoders" wide>
        <p>
          A denoising autoencoder does not reconstruct the corrupted input. It reconstructs the clean target from the corrupted input. This matters because it forces the representation to capture stable structure rather than memorize the exact noisy observation.
        </p>
        <Equation>
          <div>
            <div>x̃ = x + ε</div>
            <div className="mt-2">x̂ = g(f(x̃))</div>
            <div className="mt-2">L = ‖x - x̂‖²</div>
          </div>
        </Equation>
        <p>
          Geometrically, the denoiser learns how to move off-manifold points back toward the data manifold. This is one reason denoising autoencoders are conceptually connected to score matching and diffusion: both learn structured denoising fields rather than just static compression.
        </p>
        <DemoCard
          title="Noise Slider"
          subtitle="Inject more corruption and see how reconstruction quality degrades as the denoiser is asked to recover the clean signal."
        >
          <DenoisingDemo />
        </DemoCard>
      </Section>

      <Section id="contractive" title="8. Contractive Autoencoders">
        <p>
          Contractive autoencoders add a Jacobian penalty to the encoder so that small input perturbations do not wildly change the latent code. The goal is local invariance and smoothness.
        </p>
        <Equation>
          <div>L = L_recon + λ ‖∂f(x) / ∂x‖²_F</div>
        </Equation>
        <p>
          The Frobenius norm of the encoder Jacobian measures how sensitive the code is to small changes in the input. Penalizing that norm encourages nearby inputs to map to nearby latent points, especially away from directions that do not matter for reconstruction. You can think of this as pulling the representation toward a stable chart of the data manifold.
        </p>
      </Section>

      <Section id="vae" title="9. Variational Autoencoders" wide>
        <p>
          Ordinary autoencoders are not automatically generative. Their latent spaces can have holes: regions never visited by any training example. If you sample a random latent vector there, the decoder may produce junk because it never learned how to decode that region.
        </p>
        <p>
          A variational autoencoder fixes this by making the encoder output a <strong>distribution</strong> over latent variables instead of a single point. Typically, the encoder predicts a mean and variance for a Gaussian:
        </p>
        <Equation>
          <div>
            <div>q_φ(z|x) = N(μ(x), σ²(x)I)</div>
            <div className="mt-2">ε ~ N(0, I)</div>
            <div className="mt-2">z = μ + σ ⊙ ε</div>
          </div>
        </Equation>
        <p>
          The final line is the <strong>reparameterization trick</strong>. We write the random variable as a deterministic transform of noise so gradients can still flow through <code>μ</code> and <code>σ</code>.
        </p>
        <Equation>
          <div>L = L_recon + KL(q_φ(z|x) || p(z))</div>
        </Equation>
        <p>
          This objective is the negative ELBO in its common implementation form: a reconstruction term plus a KL penalty that nudges the approximate posterior toward a prior, usually <code>N(0, I)</code>. The KL term makes the latent space smoother and more sampleable, but too much KL pressure can blur reconstructions or cause posterior collapse.
        </p>
        <DemoCard
          title="VAE Gaussian Explorer"
          subtitle="Inspect Gaussian latent clouds, reparameterized sampling, and the effect of stronger KL regularization."
        >
          <VAEGaussianExplorerDemo />
        </DemoCard>
      </Section>

      <Section id="beta-vae" title="10. Beta-VAE and Disentanglement" wide>
        <p>
          Beta-VAE scales the KL term:
        </p>
        <Equation>
          <div>L = L_recon + β · KL(q(z|x) || p(z))</div>
        </Equation>
        <p>
          Larger <code>β</code> pushes the representation to use the latent space more efficiently and more independently. This can yield more <strong>disentangled</strong> factors, where different latent coordinates track different attributes such as width, rotation, brightness, or pose. The tradeoff is that reconstruction quality often drops.
        </p>
        <DemoCard
          title="Disentanglement Sliders"
          subtitle="A procedural decoder that illustrates the idealized intuition behind independent latent factors."
        >
          <BetaVaeDisentanglementDemo />
        </DemoCard>
      </Section>

      <Section id="vqvae" title="11. Vector Quantized VAE" wide>
        <p>
          VQ-VAE replaces a continuous latent vector with a discrete codebook. The encoder emits a continuous proposal, but the model stores the nearest learned codebook vector instead. The latent becomes a sequence of discrete symbols rather than a point in Gaussian space.
        </p>
        <p>
          This is useful when you want token-like discrete representations for downstream autoregressive or transformer-based generation. It is one conceptual bridge from autoencoders to tokenizer-style latent image models.
        </p>
        <DemoCard
          title="Codebook Quantization"
          subtitle="Drag the encoder output and watch it snap to the nearest learned codebook vector."
        >
          <VQVAEDemo />
        </DemoCard>
      </Section>

      <Section id="conv" title="12. Convolutional Autoencoders">
        <p>
          For images, fully connected layers ignore spatial structure. Convolutional autoencoders exploit locality, weight sharing, and translation structure, which usually makes them more data-efficient and visually coherent.
        </p>
        <ComparisonTable
          headers={['Stage', 'Typical tensor shape', 'Role']}
          rows={[
            ['Input', '28 × 28 × 1', 'Raw grayscale image'],
            ['Conv 1', '14 × 14 × 32', 'Extract local edges and downsample'],
            ['Conv 2', '7 × 7 × 64', 'Deeper spatial features'],
            ['Latent', '128', 'Compact code'],
            ['Decoder', 'Reverse path', 'Upsample and reconstruct'],
          ]}
        />
        <p>
          Be careful with transpose convolutions: they can introduce checkerboard artifacts. In practice, many modern implementations prefer resize-then-convolve, which is often visually cleaner.
        </p>
      </Section>

      <Section id="mae" title="13. Masked Autoencoders and Transformer Autoencoders" wide>
        <p>
          Masked autoencoders hide large portions of the input and train the model to reconstruct the missing content. In vision, the input is typically split into patches, embedded as tokens, and processed by a transformer encoder that only sees the visible subset.
        </p>
        <p>
          The reason this works for representation learning is that the model cannot rely on a pixel-local shortcut. It has to infer global structure to fill in what is missing.
        </p>
        <DemoCard
          title="Patch Masking Demo"
          subtitle="Increase the mask ratio and see reconstruction become harder as more context is removed."
        >
          <MaskedAutoencoderDemo />
        </DemoCard>
      </Section>

      <Section id="diffusion" title="14. Autoencoders and Diffusion Models" wide>
        <p>
          Denoising autoencoders and diffusion models are conceptually related because both learn structured denoising. Diffusion models can be viewed as learning a sequence of denoising steps, gradually reversing a corruption process from pure noise back to data.
        </p>
        <p>
          In latent diffusion systems such as Stable Diffusion-style architectures, an autoencoder first compresses images into a lower-dimensional latent representation. Diffusion happens in that latent space, not in pixel space, which dramatically reduces the compute required.
        </p>
        <DemoCard
          title="Latent Diffusion Compression"
          subtitle="A schematic showing why diffusion in latent space is far cheaper than diffusion directly on pixels."
        >
          <DiffusionCompressionDemo />
        </DemoCard>
      </Section>

      <Section id="repr-learning" title="15. Autoencoders and Representation Learning">
        <p>
          Autoencoders are one family of self-supervised learning methods. Their supervision signal is internal: reconstruct the input, or a clean/masked version of the input, from a constrained view of the data.
        </p>
        <ComparisonTable
          headers={['Method', 'Training signal', 'Learns by', 'Common use']}
          rows={[
            ['Autoencoder', 'Reconstruction', 'Compressing then decoding', 'Dimensionality reduction'],
            ['Denoising AE', 'Clean target from noisy input', 'Removing corruption', 'Robust features'],
            ['VAE', 'Reconstruction + KL', 'Probabilistic latent modeling', 'Generation'],
            ['Sparse AE', 'Reconstruction + sparsity', 'Feature decomposition', 'Interpretability'],
            ['MAE', 'Masked reconstruction', 'Filling missing patches', 'Vision pretraining'],
            ['Contrastive learning', 'Positive/negative pairs', 'Similarity structure', 'Representation learning'],
          ]}
        />
      </Section>

      <Section id="info-theory" title="16. Information Theory View" wide>
        <p>
          Autoencoders can be understood through the lens of rate-distortion theory. We want low distortion reconstructions, but we also want the code <code>z</code> to have limited capacity. This is the compression-fidelity tradeoff.
        </p>
        <p>
          If <code>z</code> stores too little information, reconstructions collapse. If <code>z</code> stores too much, the model learns a brittle copy mechanism. The interesting regime is the middle one, where the model stores just enough to preserve the stable structure of the data.
        </p>
        <DemoCard
          title="Compression-Fidelity Curve"
          subtitle="A stylized rate-distortion picture: more latent capacity lowers error, but returns diminish."
        >
          <CompressionCurveDemo />
        </DemoCard>
      </Section>

      <Section id="semantics" title="17. Why Latent Spaces Become Semantic" wide>
        <p>
          Autoencoders are not explicitly told what a “digit,” “face,” or “concept” is. Semantics emerge because natural data is highly structured. Images contain reusable strokes, edges, and parts. Language contains recurring syntactic and semantic patterns. Compression rewards the model for discovering those reusable regularities.
        </p>
        <p>
          Meaning often emerges from compression because the best compressed representation must preserve the factors that reliably explain the data. That is why latent variables frequently line up with concepts humans recognize.
        </p>
        <DemoCard
          title="Semantic Neighborhoods"
          subtitle="A tiny conceptual demo of how moving smoothly through latent space changes the nearest decoded example."
        >
          <LatentSemanticsMiniDemo />
        </DemoCard>
      </Section>

      <Section id="pytorch" title="18. Practical PyTorch Tutorial">
        <p>
          The code below is intentionally educational rather than optimized. The goal is to show how the mathematics maps onto an actual training loop.
        </p>

        <h3>A. Basic autoencoder on MNIST</h3>
        <CodeBlock language="python" code={basicAeCode} />

        <h3>B. Convolutional autoencoder</h3>
        <CodeBlock language="python" code={convAeCode} />

        <h3>C. Sparse autoencoder with L1 penalty</h3>
        <CodeBlock language="python" code={sparseAeCode} />

        <h3>D. Denoising autoencoder</h3>
        <CodeBlock language="python" code={denoisingAeCode} />

        <h3>E. VAE with reparameterization trick</h3>
        <CodeBlock language="python" code={vaeCode} />
      </Section>

      <Section id="failure-modes" title="19. Common Failure Modes">
        <ul>
          <li><strong>Identity mapping:</strong> the bottleneck or regularization is too weak.</li>
          <li><strong>Posterior collapse in VAEs:</strong> the decoder ignores the latent variables.</li>
          <li><strong>Blurry VAE samples:</strong> likelihood choice and strong averaging effects can wash out detail.</li>
          <li><strong>Dead sparse features:</strong> overly aggressive sparsity can kill neurons permanently.</li>
          <li><strong>Checkerboard artifacts:</strong> transpose convolutions can produce uneven upsampling patterns.</li>
          <li><strong>Poor latent interpolation:</strong> the latent space may contain holes or disconnected regions.</li>
          <li><strong>Over-regularization:</strong> too much KL or sparsity pressure can erase useful signal.</li>
          <li><strong>Train/test mismatch:</strong> low training reconstruction does not guarantee robust generalization.</li>
        </ul>
        <Callout title="Practical Fixes" tone="emerald">
          Tune bottleneck size, anneal KL for VAEs, normalize inputs, use resize-conv when deconvolution artifacts appear, lower sparsity strength if features die, and be careful with skip connections because they can bypass the intended bottleneck.
        </Callout>
      </Section>

      <Section id="summary" title="20. Summary and Big Picture">
        <p>
          Autoencoders are more than compression tools. They are a lens into representation learning. By forcing a model to preserve what matters and discard what does not, autoencoders reveal the geometry of data.
        </p>
        <p>
          Modern AI increasingly depends on learned representations. Autoencoders show one of the clearest paths from raw data to latent structure: compress, reconstruct, regularize, and discover meaning.
        </p>
      </Section>
    </ArticleShell>
  )
}

