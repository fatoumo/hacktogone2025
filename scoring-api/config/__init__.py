"""Configuration module for Carbon Scoring API"""

from .app_config import (
    APP_TITLE,
    APP_DESCRIPTION,
    API_VERSION,
    SCORING_WEIGHTS,
    EMISSION_FACTORS,
    RESOURCE_MULTIPLIERS,
    RATING_THRESHOLDS,
    DATABASE_CONFIG,
    CACHE_TTL,
    LOG_LEVEL
)
from .snowflake_config import SnowflakeConfig

__all__ = [
    "APP_TITLE",
    "APP_DESCRIPTION",
    "API_VERSION",
    "SCORING_WEIGHTS",
    "EMISSION_FACTORS",
    "RESOURCE_MULTIPLIERS",
    "RATING_THRESHOLDS",
    "DATABASE_CONFIG",
    "CACHE_TTL",
    "LOG_LEVEL",
    "SnowflakeConfig"
]
