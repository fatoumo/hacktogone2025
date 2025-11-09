"""
Snowflake Connection Configuration
Handles connection to Snowflake database
"""

import os
from typing import Optional
import streamlit as st

class SnowflakeConfig:
    """Snowflake connection configuration"""

    @staticmethod
    def get_connection_params() -> dict:
        """
        Get Snowflake connection parameters from environment or Streamlit secrets

        Returns:
            dict: Connection parameters for Snowflake
        """
        # Try to get from Streamlit secrets first (recommended for Snowflake deployment)
        try:
            if hasattr(st, 'secrets') and 'snowflake' in st.secrets:
                return {
                    "account": st.secrets.snowflake.account,
                    "user": st.secrets.snowflake.user,
                    "password": st.secrets.snowflake.password,
                    "warehouse": st.secrets.snowflake.warehouse,
                    "database": st.secrets.snowflake.database,
                    "schema": st.secrets.snowflake.schema,
                    "role": st.secrets.snowflake.get("role", "PUBLIC")
                }
        except Exception:
            pass

        # Fallback to environment variables
        return {
            "account": os.getenv("SNOWFLAKE_ACCOUNT"),
            "user": os.getenv("SNOWFLAKE_USER"),
            "password": os.getenv("SNOWFLAKE_PASSWORD"),
            "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
            "database": os.getenv("SNOWFLAKE_DATABASE"),
            "schema": os.getenv("SNOWFLAKE_SCHEMA", "public"),
            "role": os.getenv("SNOWFLAKE_ROLE", "PUBLIC")
        }

    @staticmethod
    def validate_config(config: dict) -> tuple[bool, Optional[str]]:
        """
        Validate Snowflake configuration

        Args:
            config: Configuration dictionary

        Returns:
            tuple: (is_valid, error_message)
        """
        required_fields = ["account", "user", "password", "warehouse", "database", "schema"]

        for field in required_fields:
            if not config.get(field):
                return False, f"Missing required field: {field}"

        return True, None

    @staticmethod
    def get_session_params() -> dict:
        """
        Get additional session parameters for Snowflake connection

        Returns:
            dict: Session parameters
        """
        return {
            "timezone": "UTC",
            "query_tag": "carbon_scoring_api"
        }
