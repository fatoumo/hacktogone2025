"""
Data Models for Carbon Scoring API
Defines data structures for scoring inputs and outputs
"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass
class ScoringInput:
    """Input parameters for carbon score calculation"""
    energy_consumption: float  # kWh
    transport_distance: float  # km
    waste_generated: float     # kg
    resource_type: str         # Renewable, Non-renewable, Mixed

    def validate(self) -> tuple[bool, Optional[str]]:
        """
        Validate input parameters

        Returns:
            tuple: (is_valid, error_message)
        """
        if self.energy_consumption < 0:
            return False, "Energy consumption must be non-negative"

        if self.transport_distance < 0:
            return False, "Transport distance must be non-negative"

        if self.waste_generated < 0:
            return False, "Waste generated must be non-negative"

        valid_resource_types = ["Renewable", "Non-renewable", "Mixed"]
        if self.resource_type not in valid_resource_types:
            return False, f"Resource type must be one of: {', '.join(valid_resource_types)}"

        return True, None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class EmissionBreakdown:
    """Breakdown of emissions by category"""
    energy_emissions: float      # kg CO2 from energy
    transport_emissions: float   # kg CO2 from transport
    waste_emissions: float       # kg CO2 from waste
    total_emissions: float       # Total kg CO2

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class ScoringResult:
    """Result of carbon score calculation"""
    score: float                           # Overall score (0-100)
    co2_kg: float                          # Total CO2 emissions in kg
    rating: str                            # Letter rating (A+ to E)
    breakdown: EmissionBreakdown           # Detailed emissions breakdown
    timestamp: datetime                    # Calculation timestamp
    resource_multiplier: float             # Applied resource multiplier
    delta: Optional[float] = None          # Change from previous score

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "score": self.score,
            "co2_kg": self.co2_kg,
            "rating": self.rating,
            "breakdown": self.breakdown.to_dict(),
            "timestamp": self.timestamp.isoformat(),
            "resource_multiplier": self.resource_multiplier,
            "delta": self.delta
        }


@dataclass
class HistoricalScore:
    """Historical carbon score record"""
    id: str
    score: float
    co2_kg: float
    rating: str
    timestamp: datetime
    input_params: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "score": self.score,
            "co2_kg": self.co2_kg,
            "rating": self.rating,
            "timestamp": self.timestamp.isoformat(),
            "input_params": self.input_params
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'HistoricalScore':
        """Create from dictionary"""
        return HistoricalScore(
            id=data["id"],
            score=data["score"],
            co2_kg=data["co2_kg"],
            rating=data["rating"],
            timestamp=datetime.fromisoformat(data["timestamp"]) if isinstance(data["timestamp"], str) else data["timestamp"],
            input_params=data["input_params"]
        )
