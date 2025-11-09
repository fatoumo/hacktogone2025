"""
Helper Utilities
Common utility functions for the Carbon Scoring API
"""

from typing import Any, Dict, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


def format_timestamp(timestamp: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format a datetime object to string

    Args:
        timestamp: Datetime object to format
        format_str: Format string (default: YYYY-MM-DD HH:MM:SS)

    Returns:
        Formatted timestamp string
    """
    return timestamp.strftime(format_str)


def parse_timestamp(timestamp_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> Optional[datetime]:
    """
    Parse a timestamp string to datetime object

    Args:
        timestamp_str: Timestamp string to parse
        format_str: Format string (default: YYYY-MM-DD HH:MM:SS)

    Returns:
        Datetime object or None if parsing fails
    """
    try:
        return datetime.strptime(timestamp_str, format_str)
    except ValueError as e:
        logger.error(f"Failed to parse timestamp '{timestamp_str}': {e}")
        return None


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """
    Calculate percentage change between two values

    Args:
        old_value: Previous value
        new_value: Current value

    Returns:
        Percentage change (positive = increase, negative = decrease)
    """
    if old_value == 0:
        return 100.0 if new_value > 0 else 0.0

    return ((new_value - old_value) / old_value) * 100


def round_to_precision(value: float, precision: int = 2) -> float:
    """
    Round a value to specified precision

    Args:
        value: Value to round
        precision: Number of decimal places (default: 2)

    Returns:
        Rounded value
    """
    return round(value, precision)


def clamp(value: float, min_value: float, max_value: float) -> float:
    """
    Clamp a value between min and max

    Args:
        value: Value to clamp
        min_value: Minimum allowed value
        max_value: Maximum allowed value

    Returns:
        Clamped value
    """
    return max(min_value, min(value, max_value))


def sanitize_input(value: Any, expected_type: type, default: Any = None) -> Any:
    """
    Sanitize and validate input value

    Args:
        value: Input value to sanitize
        expected_type: Expected type of the value
        default: Default value if conversion fails

    Returns:
        Sanitized value or default
    """
    try:
        return expected_type(value)
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to convert {value} to {expected_type}: {e}")
        return default


def merge_dicts(dict1: Dict, dict2: Dict, overwrite: bool = True) -> Dict:
    """
    Merge two dictionaries

    Args:
        dict1: First dictionary
        dict2: Second dictionary
        overwrite: Whether to overwrite values from dict1 with dict2 (default: True)

    Returns:
        Merged dictionary
    """
    result = dict1.copy()

    if overwrite:
        result.update(dict2)
    else:
        for key, value in dict2.items():
            if key not in result:
                result[key] = value

    return result


def get_time_ago(timestamp: datetime) -> str:
    """
    Get human-readable time difference from now

    Args:
        timestamp: Datetime to compare

    Returns:
        Human-readable time difference (e.g., "2 hours ago")
    """
    now = datetime.utcnow()
    diff = now - timestamp

    if diff < timedelta(minutes=1):
        return "just now"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff < timedelta(days=30):
        days = diff.days
        return f"{days} day{'s' if days > 1 else ''} ago"
    elif diff < timedelta(days=365):
        months = int(diff.days / 30)
        return f"{months} month{'s' if months > 1 else ''} ago"
    else:
        years = int(diff.days / 365)
        return f"{years} year{'s' if years > 1 else ''} ago"


def validate_numeric_range(
    value: float,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None,
    field_name: str = "value"
) -> tuple[bool, Optional[str]]:
    """
    Validate that a numeric value is within specified range

    Args:
        value: Value to validate
        min_value: Minimum allowed value (optional)
        max_value: Maximum allowed value (optional)
        field_name: Name of the field for error messages

    Returns:
        tuple: (is_valid, error_message)
    """
    if min_value is not None and value < min_value:
        return False, f"{field_name} must be at least {min_value}"

    if max_value is not None and value > max_value:
        return False, f"{field_name} must be at most {max_value}"

    return True, None


def format_number_with_suffix(value: float) -> str:
    """
    Format large numbers with K, M, B suffixes

    Args:
        value: Number to format

    Returns:
        Formatted string with suffix
    """
    if value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.1f}B"
    elif value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    elif value >= 1_000:
        return f"{value / 1_000:.1f}K"
    else:
        return f"{value:.1f}"
