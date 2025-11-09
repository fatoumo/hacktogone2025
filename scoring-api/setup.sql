-- ============================================================================
-- Carbon Scoring API - Snowflake Setup Script
-- ============================================================================
-- This script creates all necessary Snowflake objects for the Carbon Scoring API
-- Run this script in your Snowflake worksheet before deploying the Streamlit app
-- ============================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS CARBON_SCORING_DB
    COMMENT = 'Database for Carbon Scoring API - Hacktogone Toulouse 2025';

USE DATABASE CARBON_SCORING_DB;

-- 2. Create Schema
CREATE SCHEMA IF NOT EXISTS PUBLIC
    COMMENT = 'Public schema for carbon scoring tables';

USE SCHEMA PUBLIC;

-- 3. Create Warehouse (if not exists)
CREATE WAREHOUSE IF NOT EXISTS COMPUTE_WH
    WITH WAREHOUSE_SIZE = 'XSMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE
    INITIALLY_SUSPENDED = TRUE
    COMMENT = 'Compute warehouse for Carbon Scoring API';

-- 4. Create Carbon Scores Table
CREATE TABLE IF NOT EXISTS CARBON_SCORES (
    -- Primary identifier
    ID VARCHAR(36) PRIMARY KEY,

    -- Scoring results
    SCORE FLOAT NOT NULL COMMENT 'Overall carbon score (0-100)',
    CO2_KG FLOAT NOT NULL COMMENT 'Total CO2 emissions in kilograms',
    RATING VARCHAR(5) NOT NULL COMMENT 'Letter rating (A+ to E)',

    -- Input parameters
    ENERGY_CONSUMPTION FLOAT COMMENT 'Energy consumption in kWh',
    TRANSPORT_DISTANCE FLOAT COMMENT 'Transport distance in kilometers',
    WASTE_GENERATED FLOAT COMMENT 'Waste generated in kilograms',
    RESOURCE_TYPE VARCHAR(50) COMMENT 'Type of resources (Renewable/Non-renewable/Mixed)',

    -- Calculation details
    RESOURCE_MULTIPLIER FLOAT COMMENT 'Applied resource type multiplier',
    ENERGY_EMISSIONS FLOAT COMMENT 'CO2 emissions from energy (kg)',
    TRANSPORT_EMISSIONS FLOAT COMMENT 'CO2 emissions from transport (kg)',
    WASTE_EMISSIONS FLOAT COMMENT 'CO2 emissions from waste (kg)',
    TOTAL_EMISSIONS FLOAT COMMENT 'Total CO2 emissions (kg)',

    -- Metadata
    TIMESTAMP TIMESTAMP_NTZ COMMENT 'Calculation timestamp',
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP() COMMENT 'Record creation timestamp'
)
COMMENT = 'Stores carbon footprint scoring calculations';

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS IDX_TIMESTAMP ON CARBON_SCORES(TIMESTAMP DESC);
CREATE INDEX IF NOT EXISTS IDX_RATING ON CARBON_SCORES(RATING);

-- 6. Create View for Recent Scores
CREATE OR REPLACE VIEW RECENT_CARBON_SCORES AS
SELECT
    ID,
    SCORE,
    CO2_KG,
    RATING,
    ENERGY_CONSUMPTION,
    TRANSPORT_DISTANCE,
    WASTE_GENERATED,
    RESOURCE_TYPE,
    TIMESTAMP,
    CREATED_AT
FROM CARBON_SCORES
ORDER BY TIMESTAMP DESC
LIMIT 100;

-- 7. Create View for Statistics
CREATE OR REPLACE VIEW CARBON_SCORE_STATISTICS AS
SELECT
    COUNT(*) AS TOTAL_SCORES,
    ROUND(AVG(SCORE), 2) AS AVG_SCORE,
    ROUND(AVG(CO2_KG), 2) AS AVG_EMISSIONS,
    ROUND(MIN(SCORE), 2) AS MIN_SCORE,
    ROUND(MAX(SCORE), 2) AS MAX_SCORE,
    ROUND(MIN(CO2_KG), 2) AS MIN_EMISSIONS,
    ROUND(MAX(CO2_KG), 2) AS MAX_EMISSIONS,
    MODE(RATING) AS MOST_COMMON_RATING,
    CURRENT_TIMESTAMP() AS STATS_GENERATED_AT
FROM CARBON_SCORES;

-- 8. Create View for Rating Distribution
CREATE OR REPLACE VIEW RATING_DISTRIBUTION AS
SELECT
    RATING,
    COUNT(*) AS COUNT,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS PERCENTAGE
FROM CARBON_SCORES
GROUP BY RATING
ORDER BY
    CASE RATING
        WHEN 'A+' THEN 1
        WHEN 'A' THEN 2
        WHEN 'B' THEN 3
        WHEN 'C' THEN 4
        WHEN 'D' THEN 5
        WHEN 'E' THEN 6
    END;

-- 9. Insert Sample Data (Optional - for testing)
INSERT INTO CARBON_SCORES (
    ID,
    SCORE,
    CO2_KG,
    RATING,
    ENERGY_CONSUMPTION,
    TRANSPORT_DISTANCE,
    WASTE_GENERATED,
    RESOURCE_TYPE,
    RESOURCE_MULTIPLIER,
    ENERGY_EMISSIONS,
    TRANSPORT_EMISSIONS,
    WASTE_EMISSIONS,
    TOTAL_EMISSIONS,
    TIMESTAMP
)
VALUES
    (
        'demo-001',
        15.50,
        18.00,
        'A+',
        100.0,
        50.0,
        10.0,
        'Renewable',
        0.3,
        15.0,
        6.0,
        3.0,
        18.00,
        CURRENT_TIMESTAMP()
    ),
    (
        'demo-002',
        45.75,
        85.00,
        'B',
        250.0,
        150.0,
        30.0,
        'Mixed',
        0.65,
        81.25,
        18.0,
        9.0,
        85.00,
        CURRENT_TIMESTAMP()
    ),
    (
        'demo-003',
        78.20,
        156.00,
        'D',
        500.0,
        200.0,
        50.0,
        'Non-renewable',
        1.0,
        250.0,
        24.0,
        15.0,
        156.00,
        CURRENT_TIMESTAMP()
    );

-- 10. Grant Permissions (adjust role as needed)
GRANT USAGE ON DATABASE CARBON_SCORING_DB TO ROLE PUBLIC;
GRANT USAGE ON SCHEMA PUBLIC TO ROLE PUBLIC;
GRANT SELECT, INSERT ON TABLE CARBON_SCORES TO ROLE PUBLIC;
GRANT SELECT ON VIEW RECENT_CARBON_SCORES TO ROLE PUBLIC;
GRANT SELECT ON VIEW CARBON_SCORE_STATISTICS TO ROLE PUBLIC;
GRANT SELECT ON VIEW RATING_DISTRIBUTION TO ROLE PUBLIC;

-- 11. Verify Setup
SELECT 'Setup complete! Database objects created successfully.' AS STATUS;

-- View created objects
SHOW TABLES IN SCHEMA PUBLIC;
SHOW VIEWS IN SCHEMA PUBLIC;

-- View sample data
SELECT * FROM RECENT_CARBON_SCORES LIMIT 5;
SELECT * FROM CARBON_SCORE_STATISTICS;
SELECT * FROM RATING_DISTRIBUTION;

-- ============================================================================
-- Setup Complete!
-- You can now deploy the Streamlit app to Snowflake
-- ============================================================================
