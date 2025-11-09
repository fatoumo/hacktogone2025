# Carbon Scoring API

A Streamlit-based carbon footprint scoring system designed for deployment on Snowflake. This API calculates carbon emissions scores based on energy consumption, transportation, and waste generation metrics.

## Features

- **Carbon Score Calculator**: Calculate carbon footprint scores based on multiple input parameters
- **Snowflake Integration**: Seamless integration with Snowflake for data storage and retrieval
- **Historical Data Tracking**: Store and analyze historical carbon scoring data
- **Interactive UI**: User-friendly Streamlit interface for easy interaction
- **RESTful-style API**: Modular API design for carbon scoring operations
- **Configurable Scoring**: Customizable weights and emission factors

## Architecture

```
scoring-api/
├── app.py                    # Main Streamlit application
├── requirements.txt          # Python dependencies
├── config/
│   ├── snowflake_config.py  # Snowflake connection configuration
│   └── app_config.py        # Application settings & scoring parameters
├── api/
│   ├── scoring.py           # Core carbon scoring logic
│   └── models.py            # Data models and schemas
├── utils/
│   ├── database.py          # Snowflake database operations
│   └── helpers.py           # Utility functions
└── .streamlit/
    └── config.toml          # Streamlit configuration
```

## Quick Start

### 🚀 Snowflake Deployment (Recommended)

**Hello World - 2 Minute Setup:**

1. **Deploy Demo App**
   - Login to Snowflake
   - Go to **Data > Streamlit** > **+ Streamlit App**
   - Copy [app_demo.py](app_demo.py) content and run
   - ✅ Works immediately without database setup!

2. **Full Deployment**
   - See detailed guide: [DEPLOYMENT.md](DEPLOYMENT.md)
   - Run [setup.sql](setup.sql) in Snowflake
   - Configure secrets
   - Deploy [app.py](app.py)

### 💻 Local Development

1. **Clone the repository**
   ```bash
   cd scoring-api
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Snowflake credentials
   ```

4. **Run the application**
   ```bash
   # Demo version (no database needed)
   streamlit run app_demo.py

   # Full version (requires Snowflake)
   streamlit run app.py
   ```

## Usage

### Score Calculator

1. Navigate to the **Score Calculator** page
2. Enter the following parameters:
   - **Energy Consumption (kWh)**: Total energy usage
   - **Transport Distance (km)**: Total transportation distance
   - **Waste Generated (kg)**: Total waste produced
   - **Resource Type**: Primary resource type (Renewable/Non-renewable/Mixed)
3. Click **Calculate Carbon Score**
4. View results including:
   - Overall carbon score (0-100)
   - CO2 emissions (kg)
   - Letter rating (A+ to E)
   - Detailed breakdown

### API Usage

```python
from api.scoring import CarbonScoringAPI

# Initialize API
api = CarbonScoringAPI()

# Calculate score
result = api.calculate_score(
    energy_consumption=100.0,
    transport_distance=50.0,
    waste_generated=10.0,
    resource_type="Renewable"
)

print(f"Carbon Score: {result['score']}")
print(f"CO2 Emissions: {result['co2_kg']} kg")
print(f"Rating: {result['rating']}")
```

## Configuration

### Scoring Weights

Edit `config/app_config.py` to adjust scoring weights:

```python
SCORING_WEIGHTS = {
    "energy": 0.40,      # 40% weight for energy consumption
    "transport": 0.35,   # 35% weight for transportation
    "waste": 0.25        # 25% weight for waste generation
}
```

### Emission Factors

Customize emission factors per unit:

```python
EMISSION_FACTORS = {
    "energy_kwh": 0.5,      # kg CO2 per kWh
    "transport_km": 0.12,   # kg CO2 per km
    "waste_kg": 0.3,        # kg CO2 per kg
}
```

### Resource Multipliers

Adjust multipliers for different resource types:

```python
RESOURCE_MULTIPLIERS = {
    "Renewable": 0.3,        # 30% of base emissions
    "Non-renewable": 1.0,    # 100% of base emissions
    "Mixed": 0.65            # 65% of base emissions
}
```

## Database Schema

The application automatically creates the following table in Snowflake:

```sql
CREATE TABLE carbon_scores (
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
    timestamp TIMESTAMP_NTZ,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
)
```

## API Reference

### CarbonScoringAPI

Main API class for carbon scoring operations.

#### Methods

- `calculate_score(energy_consumption, transport_distance, waste_generated, resource_type)`: Calculate carbon score
- `get_recent_scores(limit=10)`: Retrieve recent scores from database
- `get_score_by_id(score_id)`: Get specific score by ID
- `get_statistics()`: Get overall statistics

### Models

- **ScoringInput**: Input parameters for scoring
- **ScoringResult**: Complete scoring result with breakdown
- **EmissionBreakdown**: Detailed emissions by category
- **HistoricalScore**: Historical score record

## Development

### Adding New Features

1. Add business logic to `api/scoring.py`
2. Update models in `api/models.py` if needed
3. Modify UI in `app.py`
4. Update configuration in `config/app_config.py`

### Testing

Run the application locally with test data:

```bash
streamlit run app.py
```

## Deployment Checklist

- [ ] Configure Snowflake credentials
- [ ] Test database connection
- [ ] Verify table creation
- [ ] Test scoring calculations
- [ ] Deploy to Snowflake Streamlit
- [ ] Monitor application logs

## Security

- Store credentials in environment variables or Snowflake secrets
- Never commit `.env` files to version control
- Use Snowflake role-based access control
- Enable Streamlit XSRF protection

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please contact the development team or open an issue in the repository.

---

**Version**: 1.0.0
**Powered by**: Streamlit & Snowflake
