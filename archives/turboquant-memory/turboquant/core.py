"""
TurboQuant Core: Lloyd-Max Quantization with Beta Distribution

Implements the core TurboQuant algorithm:
- Beta distribution codebook generation (Beta((d-1)/2, (d-1)/2))
- 300 iterations over 50000 grid points
- Precomputed QR rotation matrix (orthogonal, not Hadamard)
- Quantize/dequantize functions with uint8 indices
- Self-test with cosine similarity > 0.94

Reference: https://arxiv.org/abs/2504.19874
"""

import torch
import numpy as np
from scipy.stats import beta as beta_dist
from scipy.linalg import qr
from typing import Tuple, Optional
import warnings


def build_lloyd_max_codebook(
    d: int,
    bits: int,
    n_grid: int = 50000,
    n_iter: int = 300,
    sigma_range: float = 6.0,
) -> torch.Tensor:
    """
    Build Lloyd-Max codebook for Beta distribution.

    After random rotation on unit sphere S^(d-1), each coordinate follows
    Beta((d-1)/2, (d-1)/2) distribution on [-1, 1].

    Args:
        d: Vector dimension (typically 256)
        bits: Number of bits for quantization (typically 2)
        n_grid: Number of grid points for PDF evaluation (default 50000)
        n_iter: Number of Lloyd-Max iterations (default 300)
        sigma_range: Number of standard deviations to cover (default 6.0)

    Returns:
        Codebook tensor of shape [2^bits] containing centroids
    """
    n_levels = 1 << bits

    # Beta distribution parameters
    alpha = (d - 1) / 2
    beta = (d - 1) / 2

    # Standard deviation of Beta distribution on [-1, 1]
    std_dev = np.sqrt(1 / (2 * alpha + 1))

    # Grid focused on region where distribution has mass
    x_grid = torch.linspace(-sigma_range * std_dev, sigma_range * std_dev, n_grid)

    # Evaluate PDF on grid (transform Beta(0,1) to Beta(-1,1))
    # PDF on [-1, 1]: f(x) = 0.5 * beta.pdf((x+1)/2, alpha, beta)
    pdf_values = torch.tensor(
        beta_dist.pdf((x_grid.numpy() + 1) / 2, alpha, beta) * 0.5,
        dtype=torch.float32,
    )

    # Normalize PDF over grid
    pdf_values = pdf_values / (pdf_values.sum() * (x_grid[1] - x_grid[0]))

    # Initialize centroids evenly spaced
    centroids = torch.linspace(x_grid[0].item(), x_grid[-1].item(), n_levels)

    # Lloyd-Max iterations
    for iteration in range(n_iter):
        # Assign each grid point to nearest centroid
        distances = torch.abs(x_grid.unsqueeze(1) - centroids.unsqueeze(0))
        assignments = torch.argmin(distances, dim=1)

        # Update centroids as weighted means
        new_centroids = torch.zeros_like(centroids)
        for i in range(n_levels):
            mask = assignments == i
            if mask.sum() > 0:
                new_centroids[i] = (x_grid[mask] * pdf_values[mask]).sum() / pdf_values[
                    mask
                ].sum()
            else:
                # If no points assigned, keep old centroid
                new_centroids[i] = centroids[i]

        # Check convergence
        if torch.max(torch.abs(new_centroids - centroids)) < 1e-8:
            break

        centroids = new_centroids

    return centroids


class TurboQuantMSE:
    """
    TurboQuant MSE quantizer for vector compression.

    Uses Lloyd-Max quantization with precomputed QR rotation matrix.
    Optimized for MSE (mean squared error) reconstruction.

    Attributes:
        d: Vector dimension
        bits: Number of quantization bits
        codebook: Lloyd-Max codebook (shape: [2^bits])
        Q_T: Transposed rotation matrix (shape: [d, d])
    """

    def __init__(
        self,
        d: int = 256,
        bits: int = 2,
        n_grid: int = 50000,
        n_iter: int = 300,
        sigma_range: float = 6.0,
        seed: int = 42,
    ):
        """
        Initialize TurboQuant quantizer.

        Args:
            d: Vector dimension (default 256)
            bits: Number of bits (default 2)
            n_grid: Grid points for codebook (default 50000)
            n_iter: Lloyd-Max iterations (default 300)
            sigma_range: PDF range in standard deviations (default 6.0)
            seed: Random seed for rotation matrix (default 42)
        """
        self.d = d
        self.bits = bits

        # Build Lloyd-Max codebook
        print(
            f"  Building Lloyd-Max codebook (d={d}, bits={bits})...", end="", flush=True
        )
        self.codebook = build_lloyd_max_codebook(d, bits, n_grid, n_iter, sigma_range)
        self.codebook = self.codebook.to(torch.float32)
        print(" done.")

        # Precompute random orthogonal rotation matrix via QR decomposition
        # This is MUCH faster than the slow Hadamard transform with Python loops
        torch.manual_seed(seed)
        G = torch.randn(d, d, dtype=torch.float32)
        Q, _ = qr(G.numpy())
        self.Q_T = torch.tensor(Q.T, dtype=torch.float32)

        # Move to GPU if available
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.Q_T = self.Q_T.to(self.device)
        self.codebook = self.codebook.to(self.device)

    def quantize(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Quantize vectors to compressed indices.

        Args:
            x: Input tensor of shape [*, d]

        Returns:
            indices: Quantized indices (uint8), shape [*, d]
            norms: Vector norms (fp16), shape [*]
        """
        original_shape = x.shape
        x = x.view(-1, self.d).to(self.device)

        # Compute norms
        norms = torch.norm(x, dim=-1, keepdim=True).clamp(min=1e-8)
        x_normalized = x / norms

        # Apply rotation
        x_rotated = torch.matmul(x_normalized, self.Q_T.T)

        # Quantize each dimension independently
        # Find nearest centroid for each dimension
        distances = torch.abs(
            x_rotated.unsqueeze(-1) - self.codebook.unsqueeze(0).unsqueeze(0)
        )
        indices = torch.argmin(distances, dim=-1).to(torch.uint8)

        return indices.squeeze(-1), norms.squeeze(-1).half()

    def dequantize(self, indices: torch.Tensor, norms: torch.Tensor) -> torch.Tensor:
        """
        Dequantize from compressed indices.

        Args:
            indices: Quantized indices (uint8), shape [*, d]
            norms: Vector norms (fp16), shape [*]

        Returns:
            x: Reconstructed vectors (fp32), shape [*, d]
        """
        original_shape = indices.shape
        indices = indices.view(-1, self.d).to(self.device)
        norms = norms.view(-1).to(self.device)

        # Gather centroids using indices - codebook[indices] indexes into the 1D codebook
        # Result has same shape as indices, with each element replaced by its centroid value
        centroids = self.codebook[indices.long()]

        # Apply inverse rotation (Q is orthogonal, so inverse = transpose)
        x_normalized = torch.matmul(centroids, self.Q_T)

        # Restore norms
        x = x_normalized * norms.unsqueeze(-1).float()

        return x.view(original_shape)

    def self_test(self, n: int = 64) -> dict:
        """
        Run self-test on random vectors.

        Args:
            n: Number of test vectors

        Returns:
            Dictionary with test metrics
        """
        # Generate random unit vectors
        x = torch.randn(n, self.d, dtype=torch.float32).to(self.device)
        x = x / torch.norm(x, dim=-1, keepdim=True).clamp(min=1e-8)

        # Quantize and dequantize
        indices, norms = self.quantize(x)
        x_reconstructed = self.dequantize(indices, norms)

        # Compute metrics
        mse = torch.mean((x - x_reconstructed) ** 2).item()

        cosine_sims = torch.nn.functional.cosine_similarity(x, x_reconstructed, dim=-1)
        mean_cosine_sim = torch.mean(cosine_sims).item()

        # Inner product correlation
        inner_products = torch.sum(x * x_reconstructed, dim=-1)
        corr_matrix = torch.stack([torch.sum(x * x, dim=-1), inner_products])
        inner_product_corr = torch.corrcoef(corr_matrix)[0, 1].item()

        # Size comparison
        original_size = n * self.d * 2  # fp16
        compressed_size = n * self.d * 1 + n * 2  # uint8 indices + fp16 norms
        compression_ratio = original_size / compressed_size

        results = {
            "mse": mse,
            "mean_cosine_sim": mean_cosine_sim,
            "inner_product_corr": inner_product_corr,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "compression_ratio": compression_ratio,
        }

        print(f"TurboQuant_mse  d={self.d}  bits={self.bits}  n={n}")
        print(f"  MSE:                {mse:.6f}")
        print(f"  Mean cosine sim:    {mean_cosine_sim:.4f}")
        print(f"  Inner-product corr: {inner_product_corr:.4f}")
        print(
            f"  Size: {original_size:,} -> {compressed_size:,} bytes  ({compression_ratio:.1f}x)"
        )

        # Check quality threshold
        if mean_cosine_sim < 0.94:
            warnings.warn(f"Cosine similarity {mean_cosine_sim:.4f} < 0.94 threshold")

        return results

    @staticmethod
    def run_self_test() -> None:
        """Run comprehensive self-test with multiple bit widths."""
        print("\n" + "=" * 70)
        print("TurboQuant Core Algorithm Self-Test")
        print("=" * 70)

        for bits in [2, 3, 4]:
            print(f"\nTesting {bits}-bit quantization:")
            quantizer = TurboQuantMSE(d=256, bits=bits)
            quantizer.self_test(n=64)


if __name__ == "__main__":
    TurboQuantMSE.run_self_test()
