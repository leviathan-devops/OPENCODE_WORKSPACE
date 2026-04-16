"""Tests for the core data processor."""
import pytest
from src.core.processor import DataProcessor, SignalFilter

class TestDataProcessor:
    def setup_method(self):
        self.processor = DataProcessor()
    
    def test_process_empty_data(self):
        result = self.processor.process({})
        assert 'processed' in result
    
    def test_process_with_samples(self):
        result = self.processor.process({'samples': [1.0, 2.0, 3.0]})
        assert result['count'] == 3

class TestSignalFilter:
    def test_filter_creation(self):
        filter_obj = SignalFilter()
        assert filter_obj is not None
