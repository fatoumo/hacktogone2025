"""
Database Utilities
Handles Snowflake database operations for carbon scoring
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

try:
    import snowflake.connector
    from snowflake.connector import DictCursor
    SNOWFLAKE_AVAILABLE = True
except ImportError:
    SNOWFLAKE_AVAILABLE = False
    logging.warning("Snowflake connector not available. Database features will be limited.")

from config.snowflake_config import SnowflakeConfig
from config.app_config import DATABASE_CONFIG
from api.models import ScoringResult, ScoringInput, HistoricalScore

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages Snowflake database operations"""

    def __init__(self):
        """Initialize database manager"""
        self.config = SnowflakeConfig()
        self.conn = None
        self._ensure_connection()

    def _ensure_connection(self):
        """Ensure database connection is established"""
        if not SNOWFLAKE_AVAILABLE:
            logger.warning("Snowflake connector not available. Running in offline mode.")
            return

        try:
            if self.conn is None or self.conn.is_closed():
                conn_params = self.config.get_connection_params()
                is_valid, error = self.config.validate_config(conn_params)

                if not is_valid:
                    logger.error(f"Invalid Snowflake configuration: {error}")
                    return

                self.conn = snowflake.connector.connect(**conn_params)
                logger.info("Connected to Snowflake successfully")

                # Ensure table exists
                self._create_table_if_not_exists()

        except Exception as e:
            logger.error(f"Failed to connect to Snowflake: {e}")
            self.conn = None

    def _create_table_if_not_exists(self):
        """Create carbon scores table if it doesn't exist"""
        if not self.conn:
            return

        try:
            cursor = self.conn.cursor()

            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {DATABASE_CONFIG['database']}.{DATABASE_CONFIG['schema']}.{DATABASE_CONFIG['table_name']} (
                id VARCHAR(36) PRIMARY KEY,
                score FLOAT NOT NULL,
                co2_kg FLOAT NOT NULL,
                rating VARCHAR(5) NOT NULL,
                energy_consumption FLOAT,
                transport_distance FLOAT,
                waste_generated FLOAT,
                resource_type VARCHAR(50),
                resource_multiplier FLOAT,
                energy_emissions FLOAT,
                transport_emissions FLOAT,
                waste_emissions FLOAT,
                total_emissions FLOAT,
                timestamp TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
            )
            """

            cursor.execute(create_table_sql)
            self.conn.commit()
            cursor.close()

            logger.info("Carbon scores table ensured")

        except Exception as e:
            logger.error(f"Failed to create table: {e}")

    def store_score(self, result: ScoringResult, input_params: ScoringInput) -> bool:
        """
        Store a carbon score in Snowflake

        Args:
            result: Scoring result to store
            input_params: Input parameters used for scoring

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.conn or not SNOWFLAKE_AVAILABLE:
            logger.warning("Cannot store score: No database connection")
            return False

        try:
            cursor = self.conn.cursor()

            score_id = str(uuid.uuid4())

            insert_sql = f"""
            INSERT INTO {DATABASE_CONFIG['database']}.{DATABASE_CONFIG['schema']}.{DATABASE_CONFIG['table_name']}
            (id, score, co2_kg, rating, energy_consumption, transport_distance, waste_generated,
             resource_type, resource_multiplier, energy_emissions, transport_emissions,
             waste_emissions, total_emissions, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            cursor.execute(insert_sql, (
                score_id,
                result.score,
                result.co2_kg,
                result.rating,
                input_params.energy_consumption,
                input_params.transport_distance,
                input_params.waste_generated,
                input_params.resource_type,
                result.resource_multiplier,
                result.breakdown.energy_emissions,
                result.breakdown.transport_emissions,
                result.breakdown.waste_emissions,
                result.breakdown.total_emissions,
                result.timestamp
            ))

            self.conn.commit()
            cursor.close()

            logger.info(f"Score stored successfully with ID: {score_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to store score: {e}")
            return False

    def get_recent_scores(self, limit: int = 10) -> Optional[List[HistoricalScore]]:
        """
        Retrieve recent carbon scores

        Args:
            limit: Maximum number of records to retrieve

        Returns:
            List of HistoricalScore objects or None
        """
        if not self.conn or not SNOWFLAKE_AVAILABLE:
            logger.warning("Cannot retrieve scores: No database connection")
            return None

        try:
            cursor = self.conn.cursor(DictCursor)

            query = f"""
            SELECT id, score, co2_kg, rating, timestamp,
                   energy_consumption, transport_distance, waste_generated, resource_type
            FROM {DATABASE_CONFIG['database']}.{DATABASE_CONFIG['schema']}.{DATABASE_CONFIG['table_name']}
            ORDER BY timestamp DESC
            LIMIT %s
            """

            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            cursor.close()

            scores = []
            for row in rows:
                score = HistoricalScore(
                    id=row['ID'],
                    score=row['SCORE'],
                    co2_kg=row['CO2_KG'],
                    rating=row['RATING'],
                    timestamp=row['TIMESTAMP'],
                    input_params={
                        "energy_consumption": row['ENERGY_CONSUMPTION'],
                        "transport_distance": row['TRANSPORT_DISTANCE'],
                        "waste_generated": row['WASTE_GENERATED'],
                        "resource_type": row['RESOURCE_TYPE']
                    }
                )
                scores.append(score)

            return scores

        except Exception as e:
            logger.error(f"Failed to retrieve recent scores: {e}")
            return None

    def get_score_by_id(self, score_id: str) -> Optional[HistoricalScore]:
        """
        Retrieve a specific score by ID

        Args:
            score_id: Unique score identifier

        Returns:
            HistoricalScore object or None
        """
        if not self.conn or not SNOWFLAKE_AVAILABLE:
            return None

        try:
            cursor = self.conn.cursor(DictCursor)

            query = f"""
            SELECT id, score, co2_kg, rating, timestamp,
                   energy_consumption, transport_distance, waste_generated, resource_type
            FROM {DATABASE_CONFIG['database']}.{DATABASE_CONFIG['schema']}.{DATABASE_CONFIG['table_name']}
            WHERE id = %s
            """

            cursor.execute(query, (score_id,))
            row = cursor.fetchone()
            cursor.close()

            if row:
                return HistoricalScore(
                    id=row['ID'],
                    score=row['SCORE'],
                    co2_kg=row['CO2_KG'],
                    rating=row['RATING'],
                    timestamp=row['TIMESTAMP'],
                    input_params={
                        "energy_consumption": row['ENERGY_CONSUMPTION'],
                        "transport_distance": row['TRANSPORT_DISTANCE'],
                        "waste_generated": row['WASTE_GENERATED'],
                        "resource_type": row['RESOURCE_TYPE']
                    }
                )

            return None

        except Exception as e:
            logger.error(f"Failed to retrieve score {score_id}: {e}")
            return None

    def get_statistics(self) -> Optional[Dict[str, Any]]:
        """
        Get overall statistics from stored scores

        Returns:
            Dictionary with statistics or None
        """
        if not self.conn or not SNOWFLAKE_AVAILABLE:
            return None

        try:
            cursor = self.conn.cursor(DictCursor)

            query = f"""
            SELECT
                COUNT(*) as total_scores,
                AVG(score) as avg_score,
                AVG(co2_kg) as avg_emissions,
                MIN(score) as min_score,
                MAX(score) as max_score
            FROM {DATABASE_CONFIG['database']}.{DATABASE_CONFIG['schema']}.{DATABASE_CONFIG['table_name']}
            """

            cursor.execute(query)
            row = cursor.fetchone()
            cursor.close()

            if row:
                return {
                    "total_scores": row['TOTAL_SCORES'],
                    "avg_score": round(row['AVG_SCORE'], 2) if row['AVG_SCORE'] else 0,
                    "avg_emissions": round(row['AVG_EMISSIONS'], 2) if row['AVG_EMISSIONS'] else 0,
                    "min_score": round(row['MIN_SCORE'], 2) if row['MIN_SCORE'] else 0,
                    "max_score": round(row['MAX_SCORE'], 2) if row['MAX_SCORE'] else 0
                }

            return None

        except Exception as e:
            logger.error(f"Failed to retrieve statistics: {e}")
            return None

    def close(self):
        """Close database connection"""
        if self.conn and not self.conn.is_closed():
            self.conn.close()
            logger.info("Database connection closed")
