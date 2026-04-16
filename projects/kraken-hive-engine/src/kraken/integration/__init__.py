"""
Kraken Hive integration modules.

This package contains extensions that integrate Kraken Ultra components
with the Hive framework.
"""

from .judge_extension import KrakenEnhancedJudge, create_enhanced_judge

__all__ = [
    "KrakenEnhancedJudge",
    "create_enhanced_judge",
]

__version__ = "0.1.0"
