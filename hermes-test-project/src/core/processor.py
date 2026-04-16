"""Core physiological data processing module."""
import numpy as np
from typing import Dict, Any

_processing_cache = []

class DataProcessor:
    def __init__(self):
        self.cache_enabled = True
        
    def process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        samples = raw_data.get('samples', [])
        # BUG-001: Memory leak
        sample_array = np.array(samples)
        _processing_cache.append(sample_array)
        return {'processed': samples, 'count': len(samples)}

class SignalFilter:
    def filter_signal(self, signal: np.ndarray) -> np.ndarray:
        # BUG-005: O(n²) algorithm
        n = len(signal)
        result = np.zeros(n)
        for i in range(n):
            for j in range(max(0, i-10), i):
                result[i] += signal[j] * np.exp(-(i-j)**2)
        return result
