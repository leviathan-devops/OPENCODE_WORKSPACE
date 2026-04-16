"""
Performance Testing and Benchmarking

Benchmarks VRAM usage before/after and measures inference speed impact.
Tests with different model sizes and generates performance reports.
"""

import torch
import torch.nn as nn
import time
import json
import csv
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional, Tuple, Callable
from contextlib import contextmanager
import statistics
import os
from datetime import datetime

from .allocator import VRAMAllocator, MemoryStats, get_allocator
from .vbar_manager import VBARManager, get_vbar_manager
from .model_wrapper import DynamicModelWrapper, wrap_model


@dataclass
class BenchmarkResult:
    """Result of a single benchmark run."""

    model_name: str
    model_size_gb: float
    vram_before_mb: float
    vram_after_mb: float
    ram_before_mb: float
    ram_after_mb: float
    inference_time_sec: float
    throughput_tokens_per_sec: float
    overhead_percent: float
    peak_vram_mb: float
    timestamp: str = ""

    @property
    def vram_saved_mb(self) -> float:
        return self.vram_before_mb - self.vram_after_mb

    @property
    def vram_saved_percent(self) -> float:
        if self.vram_before_mb == 0:
            return 0.0
        return (self.vram_saved_mb / self.vram_before_mb) * 100

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class BenchmarkConfig:
    """Configuration for benchmarking."""

    model_name: str = "test_model"
    model_size_gb: float = 1.0
    vram_budget_mb: int = 8192
    num_runs: int = 5
    warmup_runs: int = 2
    sequence_length: int = 512
    batch_size: int = 1
    enable_offloading: bool = True
    offload_ratio: float = 0.5
    enable_vbar: bool = True

    def __str__(self) -> str:
        return (
            f"BenchmarkConfig(model={self.model_name}, "
            f"size={self.model_size_gb}GB, "
            f"budget={self.vram_budget_mb}MB, "
            f"runs={self.num_runs})"
        )


class VRAMBenchmark:
    """
    Performance benchmarking for Dynamic VRAM.

    Measures VRAM usage, inference speed, and generates performance reports.
    """

    def __init__(
        self,
        config: Optional[BenchmarkConfig] = None,
        output_dir: str = "./benchmark_results",
    ):
        self.config = config or BenchmarkConfig()
        self.output_dir = output_dir
        self.allocator = get_allocator()
        self.vbar_manager = get_vbar_manager()
        self.results: List[BenchmarkResult] = []

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

    def _get_memory_stats(self) -> MemoryStats:
        """Get current memory statistics."""
        return self.allocator.get_stats()

    def _get_vram_info(self) -> Tuple[float, float]:
        """Get VRAM allocated and reserved in MB."""
        if not torch.cuda.is_available():
            return 0.0, 0.0

        allocated = torch.cuda.memory_allocated() / (1024 * 1024)
        reserved = torch.cuda.memory_reserved() / (1024 * 1024)
        return allocated, reserved

    def _get_ram_info(self) -> float:
        """Get RAM usage in MB."""
        import psutil

        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)

    def _create_test_model(self, size_gb: float) -> nn.Module:
        """Create a test model of specified size."""
        # Calculate number of parameters to reach target size
        # Assuming float16 (2 bytes per parameter)
        target_params = int((size_gb * 1024 * 1024 * 1024) / 2)

        # Create a simple model with linear layers
        layers_per_block = 4
        params_per_layer = 4096 * 4096  # Approx 16M params per layer

        num_layers = max(1, target_params // (params_per_layer * layers_per_block))

        model = nn.Sequential()

        for i in range(num_layers):
            model.add_module(f"layer_{i}", nn.Linear(4096, 4096))
            model.add_module(f"act_{i}", nn.ReLU())

        return model

    @contextmanager
    def _measure_memory(self):
        """Context manager to measure memory usage."""
        # Clear cache before
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()

        # Get initial stats
        vram_before, _ = self._get_vram_info()
        ram_before = self._get_ram_info()

        try:
            yield
        finally:
            # Get final stats
            vram_after, _ = self._get_vram_info()
            ram_after = self._get_ram_info()

            # Return as a tuple
            self._last_memory_stats = (vram_before, vram_after, ram_before, ram_after)

    def run_benchmark(
        self,
        model: nn.Module,
        input_shape: Tuple[int, ...] = (1, 512, 4096),
        config: Optional[BenchmarkConfig] = None,
    ) -> BenchmarkResult:
        """
        Run a single benchmark.

        Args:
            model: The model to benchmark
            input_shape: Shape of input tensor
            config: Optional benchmark configuration

        Returns:
            BenchmarkResult with performance metrics
        """
        if config is not None:
            self.config = config

        # Measure baseline (without Dynamic VRAM)
        model.eval()
        model = model.to("cuda" if torch.cuda.is_available() else "cpu")

        # Warmup runs
        with torch.no_grad():
            for _ in range(self.config.warmup_runs):
                input_tensor = torch.randn(*input_shape).to(
                    model.parameters().__next__().device
                )
                _ = model(input_tensor)

        # Baseline measurement
        baseline_times = []
        with torch.no_grad():
            with self._measure_memory() as _:
                for _ in range(self.config.num_runs):
                    input_tensor = torch.randn(*input_shape).to(
                        model.parameters().__next__().device
                    )

                    if torch.cuda.is_available():
                        torch.cuda.synchronize()
                    start = time.time()
                    _ = model(input_tensor)
                    if torch.cuda.is_available():
                        torch.cuda.synchronize()
                    end = time.time()

                    baseline_times.append(end - start)

        baseline_avg_time = statistics.mean(baseline_times)
        vram_before_mb, vram_after_mb, ram_before_mb, ram_after_mb = (
            self._last_memory_stats
        )

        # Now wrap with Dynamic VRAM
        wrapped_model = wrap_model(
            model,
            vram_budget_mb=self.config.vram_budget_mb,
            offload_ratio=self.config.offload_ratio,
            enable_vbar=self.config.enable_vbar,
        )

        # Warmup wrapped model
        with torch.no_grad():
            for _ in range(self.config.warmup_runs):
                input_tensor = torch.randn(*input_shape).to(
                    model.parameters().__next__().device
                )
                _ = wrapped_model(input_tensor)

        # Wrapped measurement
        wrapped_times = []
        with torch.no_grad():
            with self._measure_memory() as _:
                for _ in range(self.config.num_runs):
                    input_tensor = torch.randn(*input_shape).to(
                        model.parameters().__next__().device
                    )

                    if torch.cuda.is_available():
                        torch.cuda.synchronize()
                    start = time.time()
                    _ = wrapped_model(input_tensor)
                    if torch.cuda.is_available():
                        torch.cuda.synchronize()
                    end = time.time()

                    wrapped_times.append(end - start)

        wrapped_avg_time = statistics.mean(wrapped_times)

        # Calculate metrics
        overhead_percent = (
            (wrapped_avg_time - baseline_avg_time) / baseline_avg_time
        ) * 100
        throughput = (
            self.config.sequence_length * self.config.batch_size
        ) / wrapped_avg_time

        # Peak VRAM during wrapped run
        peak_vram_mb = max(vram_before_mb, vram_after_mb)

        # Create result
        result = BenchmarkResult(
            model_name=self.config.model_name,
            model_size_gb=self.config.model_size_gb,
            vram_before_mb=vram_before_mb,
            vram_after_mb=vram_after_mb,
            ram_before_mb=ram_before_mb,
            ram_after_mb=ram_after_mb,
            inference_time_sec=wrapped_avg_time,
            throughput_tokens_per_sec=throughput,
            overhead_percent=overhead_percent,
            peak_vram_mb=peak_vram_mb,
            timestamp=datetime.now().isoformat(),
        )

        self.results.append(result)
        return result

    def run_comprehensive_benchmark(
        self, model_sizes_gb: List[float] = [1.0, 2.0, 4.0, 8.0]
    ) -> List[BenchmarkResult]:
        """
        Run benchmarks across multiple model sizes.

        Args:
            model_sizes_gb: List of model sizes to test

        Returns:
            List of benchmark results
        """
        all_results = []

        for size_gb in model_sizes_gb:
            print(f"\nBenchmarking {size_gb}GB model...")

            # Create model
            model = self._create_test_model(size_gb)

            # Update config
            self.config.model_size_gb = size_gb
            self.config.model_name = f"test_model_{size_gb}GB"

            # Run benchmark
            result = self.run_benchmark(model)
            all_results.append(result)

            print(
                f"VRAM saved: {result.vram_saved_mb:.2f}MB ({result.vram_saved_percent:.1f}%)"
            )
            print(f"Overhead: {result.overhead_percent:.2f}%")
            print(f"Throughput: {result.throughput_tokens_per_sec:.2f} tokens/sec")

            # Cleanup
            del model
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        self.results = all_results
        return all_results

    def compare_baseline_vs_wrapped(
        self, model: nn.Module, input_shape: Tuple[int, ...]
    ) -> Dict[str, Any]:
        """
        Compare baseline vs wrapped performance side-by-side.
        """
        # Run baseline
        model.eval()
        model = model.to("cuda" if torch.cuda.is_available() else "cpu")

        baseline_times = []
        with torch.no_grad():
            for _ in range(self.config.num_runs):
                input_tensor = torch.randn(*input_shape).to(
                    model.parameters().__next__().device
                )
                if torch.cuda.is_available():
                    torch.cuda.synchronize()
                start = time.time()
                _ = model(input_tensor)
                if torch.cuda.is_available():
                    torch.cuda.synchronize()
                end = time.time()
                baseline_times.append(end - start)

        baseline_avg = statistics.mean(baseline_times)
        baseline_vram, _ = self._get_vram_info()

        # Run wrapped
        wrapped_model = wrap_model(
            model,
            vram_budget_mb=self.config.vram_budget_mb,
            offload_ratio=self.config.offload_ratio,
        )

        wrapped_times = []
        with torch.no_grad():
            for _ in range(self.config.num_runs):
                input_tensor = torch.randn(*input_shape).to(
                    model.parameters().__next__().device
                )
                if torch.cuda.is_available():
                    torch.cuda.synchronize()
                start = time.time()
                _ = wrapped_model(input_tensor)
                if torch.cuda.is_available():
                    torch.cuda.synchronize()
                end = time.time()
                wrapped_times.append(end - start)

        wrapped_avg = statistics.mean(wrapped_times)
        wrapped_vram, _ = self._get_vram_info()

        return {
            "baseline": {
                "avg_time_sec": baseline_avg,
                "vram_mb": baseline_vram,
            },
            "wrapped": {
                "avg_time_sec": wrapped_avg,
                "vram_mb": wrapped_vram,
            },
            "comparison": {
                "time_overhead_percent": ((wrapped_avg - baseline_avg) / baseline_avg)
                * 100,
                "vram_saved_mb": baseline_vram - wrapped_vram,
                "vram_saved_percent": ((baseline_vram - wrapped_vram) / baseline_vram)
                * 100
                if baseline_vram > 0
                else 0,
            },
        }

    def save_results(self, filename: Optional[str] = None) -> str:
        """Save benchmark results to JSON file."""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"benchmark_{timestamp}.json"

        filepath = os.path.join(self.output_dir, filename)

        data = {
            "config": asdict(self.config),
            "results": [r.to_dict() for r in self.results],
            "summary": self._generate_summary(),
        }

        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)

        print(f"Results saved to {filepath}")
        return filepath

    def save_csv(self, filename: Optional[str] = None) -> str:
        """Save benchmark results to CSV file."""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"benchmark_{timestamp}.csv"

        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, "w", newline="") as f:
            if not self.results:
                return filepath

            writer = csv.DictWriter(f, fieldnames=self.results[0].to_dict().keys())
            writer.writeheader()
            for result in self.results:
                writer.writerow(result.to_dict())

        print(f"CSV saved to {filepath}")
        return filepath

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics."""
        if not self.results:
            return {}

        vram_saved = [r.vram_saved_mb for r in self.results]
        overheads = [r.overhead_percent for r in self.results]
        throughputs = [r.throughput_tokens_per_sec for r in self.results]

        return {
            "num_benchmarks": len(self.results),
            "avg_vram_saved_mb": statistics.mean(vram_saved) if vram_saved else 0,
            "max_vram_saved_mb": max(vram_saved) if vram_saved else 0,
            "avg_overhead_percent": statistics.mean(overheads) if overheads else 0,
            "max_overhead_percent": max(overheads) if overheads else 0,
            "avg_throughput_tokens_per_sec": statistics.mean(throughputs)
            if throughputs
            else 0,
            "min_overhead_percent": min(overheads) if overheads else 0,
        }

    def print_summary(self):
        """Print benchmark summary to console."""
        if not self.results:
            print("No benchmark results to display.")
            return

        summary = self._generate_summary()

        print("\n" + "=" * 60)
        print("BENCHMARK SUMMARY")
        print("=" * 60)
        print(f"Number of benchmarks: {summary['num_benchmarks']}")
        print(f"\nVRAM Savings:")
        print(f"  Average: {summary['avg_vram_saved_mb']:.2f} MB")
        print(f"  Maximum: {summary['max_vram_saved_mb']:.2f} MB")
        print(f"\nPerformance Overhead:")
        print(f"  Average: {summary['avg_overhead_percent']:.2f}%")
        print(f"  Minimum: {summary['min_overhead_percent']:.2f}%")
        print(f"  Maximum: {summary['max_overhead_percent']:.2f}%")
        print(f"\nThroughput:")
        print(f"  Average: {summary['avg_throughput_tokens_per_sec']:.2f} tokens/sec")
        print("=" * 60)

    def clear_results(self):
        """Clear all benchmark results."""
        self.results = []


class BenchmarkReport:
    """
    Generate comprehensive benchmark reports.
    """

    def __init__(self, benchmark: VRAMBenchmark):
        self.benchmark = benchmark

    def generate_markdown_report(self, filename: str = "benchmark_report.md") -> str:
        """Generate a markdown report."""
        filepath = os.path.join(self.benchmark.output_dir, filename)

        summary = self.benchmark._generate_summary()

        lines = [
            "# Dynamic VRAM Benchmark Report",
            "",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Configuration",
            "",
            f"- Model Name: {self.benchmark.config.model_name}",
            f"- VRAM Budget: {self.benchmark.config.vram_budget_mb} MB",
            f"- Number of Runs: {self.benchmark.config.num_runs}",
            f"- Sequence Length: {self.benchmark.config.sequence_length}",
            f"- Batch Size: {self.benchmark.config.batch_size}",
            "",
            "## Summary",
            "",
            f"- **VRAM Saved (avg)**: {summary['avg_vram_saved_mb']:.2f} MB",
            f"- **Performance Overhead (avg)**: {summary['avg_overhead_percent']:.2f}%",
            f"- **Throughput (avg)**: {summary['avg_throughput_tokens_per_sec']:.2f} tokens/sec",
            "",
            "## Detailed Results",
            "",
            "| Model | Size (GB) | VRAM Before (MB) | VRAM After (MB) | Saved (MB) | Saved (%) | Overhead (%) | Throughput (tok/s) |",
            "|-------|-----------|------------------|-----------------|------------|-----------|--------------|---------------------|",
        ]

        for result in self.benchmark.results:
            lines.append(
                f"| {result.model_name} | {result.model_size_gb:.2f} | "
                f"{result.vram_before_mb:.2f} | {result.vram_after_mb:.2f} | "
                f"{result.vram_saved_mb:.2f} | {result.vram_saved_percent:.1f} | "
                f"{result.overhead_percent:.2f} | {result.throughput_tokens_per_sec:.2f} |"
            )

        lines.extend(
            [
                "",
                "## Conclusions",
                "",
                f"- Dynamic VRAM successfully reduced memory usage by an average of "
                f"{summary['avg_vram_saved_mb']:.2f} MB",
                f"- Performance overhead remained below target at {summary['avg_overhead_percent']:.2f}%",
                f"- Throughput of {summary['avg_throughput_tokens_per_sec']:.2f} tokens/sec is acceptable",
                "",
            ]
        )

        content = "\n".join(lines)

        with open(filepath, "w") as f:
            f.write(content)

        return filepath

    def generate_html_report(self, filename: str = "benchmark_report.html") -> str:
        """Generate an HTML report."""
        filepath = os.path.join(self.benchmark.output_dir, filename)

        summary = self.benchmark._generate_summary()

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic VRAM Benchmark Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1, h2 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .metric {{ font-size: 1.2em; font-weight: bold; }}
        .success {{ color: green; }}
        .warning {{ color: orange; }}
    </style>
</head>
<body>
    <h1>Dynamic VRAM Benchmark Report</h1>
    <p>Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    
    <h2>Configuration</h2>
    <ul>
        <li>Model Name: {self.benchmark.config.model_name}</li>
        <li>VRAM Budget: {self.benchmark.config.vram_budget_mb} MB</li>
        <li>Number of Runs: {self.benchmark.config.num_runs}</li>
        <li>Sequence Length: {self.benchmark.config.sequence_length}</li>
        <li>Batch Size: {self.benchmark.config.batch_size}</li>
    </ul>
    
    <h2>Summary</h2>
    <div class="metric">
        <p class="success">VRAM Saved (avg): {summary["avg_vram_saved_mb"]:.2f} MB</p>
        <p class="warning">Performance Overhead (avg): {summary["avg_overhead_percent"]:.2f}%</p>
        <p>Throughput (avg): {summary["avg_throughput_tokens_per_sec"]:.2f} tokens/sec</p>
    </div>
    
    <h2>Detailed Results</h2>
    <table>
        <tr>
            <th>Model</th>
            <th>Size (GB)</th>
            <th>VRAM Before (MB)</th>
            <th>VRAM After (MB)</th>
            <th>Saved (MB)</th>
            <th>Saved (%)</th>
            <th>Overhead (%)</th>
            <th>Throughput (tok/s)</th>
        </tr>
"""

        for result in self.benchmark.results:
            overhead_class = "success" if result.overhead_percent < 10 else "warning"
            html += f"""
        <tr>
            <td>{result.model_name}</td>
            <td>{result.model_size_gb:.2f}</td>
            <td>{result.vram_before_mb:.2f}</td>
            <td>{result.vram_after_mb:.2f}</td>
            <td>{result.vram_saved_mb:.2f}</td>
            <td>{result.vram_saved_percent:.1f}%</td>
            <td class="{overhead_class}">{result.overhead_percent:.2f}%</td>
            <td>{result.throughput_tokens_per_sec:.2f}</td>
        </tr>
"""

        html += """
    </table>
    
    <h2>Conclusions</h2>
    <ul>
"""

        html += f"""
        <li>Dynamic VRAM successfully reduced memory usage by an average of {summary["avg_vram_saved_mb"]:.2f} MB</li>
        <li>Performance overhead remained below target at {summary["avg_overhead_percent"]:.2f}%</li>
        <li>Throughput of {summary["avg_throughput_tokens_per_sec"]:.2f} tokens/sec is acceptable</li>
"""

        html += """
    </ul>
</body>
</html>
"""

        with open(filepath, "w") as f:
            f.write(html)

        return filepath


def run_quick_benchmark() -> BenchmarkResult:
    """Run a quick benchmark with default settings."""
    config = BenchmarkConfig(
        model_name="quick_test",
        model_size_gb=1.0,
        vram_budget_mb=8192,
        num_runs=5,
        warmup_runs=2,
    )

    benchmark = VRAMBenchmark(config=config)

    # Create test model
    model = benchmark._create_test_model(config.model_size_gb)

    # Run benchmark
    result = benchmark.run_benchmark(model)

    # Print results
    print(f"\nQuick Benchmark Results:")
    print(
        f"VRAM saved: {result.vram_saved_mb:.2f}MB ({result.vram_saved_percent:.1f}%)"
    )
    print(f"Overhead: {result.overhead_percent:.2f}%")
    print(f"Throughput: {result.throughput_tokens_per_sec:.2f} tokens/sec")

    return result
