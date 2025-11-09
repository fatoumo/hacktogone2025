"""
Carbon Scoring Logic
Core business logic for carbon footprint scoring
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import logging

from .models import ScoringInput, ScoringResult, EmissionBreakdown, HistoricalScore
from config.app_config import (
    SCORING_WEIGHTS,
    EMISSION_FACTORS,
    RESOURCE_MULTIPLIERS,
    RATING_THRESHOLDS
)
from utils.database import DatabaseManager

logger = logging.getLogger(__name__)


class CarbonScoringAPI:
    """Carbon Scoring API - Main scoring engine"""

    def __init__(self):
        """Initialize the scoring API"""
        self.db_manager = DatabaseManager()
        logger.info("CarbonScoringAPI initialized")

    def calculate_emissions(
        self,
        energy_consumption: float,
        transport_distance: float,
        waste_generated: float,
        resource_type: str
    ) -> EmissionBreakdown:
        """
        Calculate emissions breakdown

        Args:
            energy_consumption: Energy in kWh
            transport_distance: Distance in km
            waste_generated: Waste in kg
            resource_type: Type of resources used

        Returns:
            EmissionBreakdown: Detailed emissions breakdown
        """
        # Calculate base emissions
        energy_emissions = energy_consumption * EMISSION_FACTORS["energy_kwh"]
        transport_emissions = transport_distance * EMISSION_FACTORS["transport_km"]
        waste_emissions = waste_generated * EMISSION_FACTORS["waste_kg"]

        # Apply resource type multiplier
        multiplier = RESOURCE_MULTIPLIERS.get(resource_type, 1.0)

        # Adjust emissions based on resource type
        energy_emissions *= multiplier

        total_emissions = energy_emissions + transport_emissions + waste_emissions

        return EmissionBreakdown(
            energy_emissions=round(energy_emissions, 2),
            transport_emissions=round(transport_emissions, 2),
            waste_emissions=round(waste_emissions, 2),
            total_emissions=round(total_emissions, 2)
        )

    def calculate_score(
        self,
        energy_consumption: float,
        transport_distance: float,
        waste_generated: float,
        resource_type: str
    ) -> Dict[str, Any]:
        """
        Calculate carbon score based on input parameters

        Args:
            energy_consumption: Energy consumption in kWh
            transport_distance: Transport distance in km
            waste_generated: Waste generated in kg
            resource_type: Type of resources used

        Returns:
            dict: Scoring result with score, emissions, rating, and breakdown
        """
        # Validate inputs
        scoring_input = ScoringInput(
            energy_consumption=energy_consumption,
            transport_distance=transport_distance,
            waste_generated=waste_generated,
            resource_type=resource_type
        )

        is_valid, error_msg = scoring_input.validate()
        if not is_valid:
            raise ValueError(error_msg)

        # Calculate emissions
        breakdown = self.calculate_emissions(
            energy_consumption,
            transport_distance,
            waste_generated,
            resource_type
        )

        # Calculate weighted score (0-100 scale)
        # Higher emissions = higher score (worse)
        energy_score = min(energy_consumption / 10, 100) * SCORING_WEIGHTS["energy"]
        transport_score = min(transport_distance / 5, 100) * SCORING_WEIGHTS["transport"]
        waste_score = min(waste_generated / 2, 100) * SCORING_WEIGHTS["waste"]

        total_score = energy_score + transport_score + waste_score

        # Apply resource multiplier to final score
        multiplier = RESOURCE_MULTIPLIERS.get(resource_type, 1.0)
        total_score *= multiplier
        total_score = min(max(total_score, 0), 100)  # Clamp to 0-100

        # Determine rating
        rating = self._get_rating(total_score)

        # Create result
        result = ScoringResult(
            score=round(total_score, 2),
            co2_kg=breakdown.total_emissions,
            rating=rating,
            breakdown=breakdown,
            timestamp=datetime.utcnow(),
            resource_multiplier=multiplier
        )

        # Store in database (non-blocking)
        try:
            self.db_manager.store_score(result, scoring_input)
        except Exception as e:
            logger.warning(f"Failed to store score in database: {e}")

        return result.to_dict()

    def _get_rating(self, score: float) -> str:
        """
        Get letter rating based on score

        Args:
            score: Carbon score (0-100)

        Returns:
            str: Letter rating
        """
        for rating, (min_score, max_score) in RATING_THRESHOLDS.items():
            if min_score <= score < max_score:
                return rating
        return "E"  # Default to worst rating

    def get_recent_scores(self, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        """
        Get recent carbon scores from database

        Args:
            limit: Maximum number of records to retrieve

        Returns:
            List of historical scores or None
        """
        try:
            scores = self.db_manager.get_recent_scores(limit)
            return [score.to_dict() for score in scores] if scores else None
        except Exception as e:
            logger.error(f"Failed to retrieve recent scores: {e}")
            return None

    def get_score_by_id(self, score_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific score by ID

        Args:
            score_id: Unique score identifier

        Returns:
            Score data or None
        """
        try:
            score = self.db_manager.get_score_by_id(score_id)
            return score.to_dict() if score else None
        except Exception as e:
            logger.error(f"Failed to retrieve score {score_id}: {e}")
            return None

    def get_statistics(self) -> Optional[Dict[str, Any]]:
        """
        Get overall statistics from stored scores

        Returns:
            Statistics dictionary or None
        """
        try:
            return self.db_manager.get_statistics()
        except Exception as e:
            logger.error(f"Failed to retrieve statistics: {e}")
            return None
