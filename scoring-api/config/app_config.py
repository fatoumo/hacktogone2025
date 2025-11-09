"""
Application Configuration
Central configuration for the Carbon Scoring API
"""

import os

# Application metadata
APP_TITLE = "Carbon Scoring API"
APP_DESCRIPTION = """
Advanced carbon footprint scoring system powered by Snowflake.
Calculate, track, and analyze carbon emissions across various activities.
"""
API_VERSION = "1.0.0"

# Scoring configuration
SCORING_WEIGHTS = {
    "energy": 0.40,      # 40% weight for energy consumption
    "transport": 0.35,   # 35% weight for transportation
    "waste": 0.25        # 25% weight for waste generation
}

# Emission factors (kg CO2 per unit)
EMISSION_FACTORS = {
    "energy_kwh": 0.5,           # kg CO2 per kWh
    "transport_km": 0.12,        # kg CO2 per km (average)
    "waste_kg": 0.3,             # kg CO2 per kg of waste
}

# Resource type multipliers
RESOURCE_MULTIPLIERS = {
    "Renewable": 0.3,        # 30% of base emissions
    "Non-renewable": 1.0,    # 100% of base emissions
    "Mixed": 0.65            # 65% of base emissions
}

# Rating thresholds (based on score 0-100)
RATING_THRESHOLDS = {
    "A+": (0, 20),
    "A": (20, 40),
    "B": (40, 60),
    "C": (60, 80),
    "D": (80, 90),
    "E": (90, 100)
}

# Database configuration
DATABASE_CONFIG = {
    "table_name": os.getenv("SNOWFLAKE_TABLE", "carbon_scores"),
    "schema": os.getenv("SNOWFLAKE_SCHEMA", "public"),
    "database": os.getenv("SNOWFLAKE_DATABASE", "carbon_scoring_db")
}

# Cache configuration
CACHE_TTL = 300  # 5 minutes cache for data queries

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
