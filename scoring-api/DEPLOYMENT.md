# Snowflake Deployment Guide

Complete guide for deploying the Carbon Scoring API to Snowflake.

## 🚀 Quick Start - Hello World Deployment

### Option 1: Deploy Demo Version (Recommended First)

The demo version ([app_demo.py](app_demo.py)) works without database setup - perfect for testing!

1. **Login to Snowflake**
   - Navigate to your Snowflake account
   - Go to **Data > Streamlit** section

2. **Create New Streamlit App**
   - Click **+ Streamlit App**
   - Name: `carbon-scoring-demo`
   - Warehouse: Select existing or create new (XSMALL is fine)

3. **Upload Demo App**
   - Copy the contents of [app_demo.py](app_demo.py)
   - Paste into the Snowflake Streamlit editor
   - Click **Run**

4. **Test the App**
   - You should see "Hello World deployment test for Snowflake Streamlit"
   - Try the Quick Carbon Score Demo calculator
   - The app works without any database setup!

---

## 📊 Full Deployment - With Database

### Step 1: Prepare Snowflake Database

1. **Open Snowflake Worksheet**
   - Navigate to **Projects > Worksheets**
   - Create a new SQL worksheet

2. **Run Setup Script**
   ```sql
   -- Copy and paste the entire contents of setup.sql
   -- Then execute all statements
   ```

   Or run the [setup.sql](setup.sql) file directly.

3. **Verify Setup**
   ```sql
   USE DATABASE CARBON_SCORING_DB;
   SHOW TABLES;
   SHOW VIEWS;
   SELECT * FROM RECENT_CARBON_SCORES;
   ```

### Step 2: Create Streamlit App

1. **Navigate to Streamlit**
   - Go to **Data > Streamlit**
   - Click **+ Streamlit App**

2. **Configure App**
   - **Name:** `carbon-scoring-api`
   - **Warehouse:** `COMPUTE_WH` (created by setup.sql)
   - **Database:** `CARBON_SCORING_DB`
   - **Schema:** `PUBLIC`

3. **Upload Files**

   You have two options:

   **Option A: Upload via UI**
   - Main file: Copy [app.py](app.py) content
   - Create additional files by clicking **+ Add** for each module:
     - `config/app_config.py`
     - `config/snowflake_config.py`
     - `api/models.py`
     - `api/scoring.py`
     - `utils/database.py`
     - `utils/helpers.py`

   **Option B: Use Snowflake CLI (if available)**
   ```bash
   snow streamlit deploy \
     --connection myconnection \
     --name carbon-scoring-api
   ```

### Step 3: Configure Secrets

1. **Open App Settings**
   - Click on your Streamlit app
   - Go to **Settings > Secrets**

2. **Add Snowflake Secrets**

   Copy from [.streamlit/secrets.toml.example](.streamlit/secrets.toml.example):

   ```toml
   [snowflake]
   account = "your_account"
   user = "your_username"
   password = "your_password"
   warehouse = "COMPUTE_WH"
   database = "CARBON_SCORING_DB"
   schema = "PUBLIC"
   role = "PUBLIC"
   ```

3. **Save and Restart**
   - Click **Save**
   - Restart the app

### Step 4: Test the Deployment

1. **Open the App**
   - Click **Run** or **View App**

2. **Test Score Calculator**
   - Navigate to "Score Calculator" page
   - Enter test values:
     - Energy: 100 kWh
     - Transport: 50 km
     - Waste: 10 kg
     - Resource: Renewable
   - Click "Calculate Carbon Score"
   - Verify results are displayed

3. **Test Data Explorer**
   - Navigate to "Data Explorer" page
   - Click "Load Recent Scores"
   - You should see the sample data from setup.sql

---

## 📦 File Structure for Snowflake

When deploying to Snowflake, maintain this structure:

```
Streamlit App Root/
├── app.py                    # Main entry point
├── app_demo.py              # Demo version
├── config/
│   ├── __init__.py
│   ├── app_config.py
│   └── snowflake_config.py
├── api/
│   ├── __init__.py
│   ├── models.py
│   └── scoring.py
└── utils/
    ├── __init__.py
    ├── database.py
    └── helpers.py
```

**Note:** `requirements.txt` is NOT needed for Snowflake Streamlit apps - dependencies are managed automatically.

---

## 🔧 Configuration

### Database Configuration

Edit `config/app_config.py` to change database settings:

```python
DATABASE_CONFIG = {
    "table_name": "carbon_scores",
    "schema": "public",
    "database": "carbon_scoring_db"
}
```

### Scoring Configuration

Adjust scoring parameters in `config/app_config.py`:

```python
SCORING_WEIGHTS = {
    "energy": 0.40,      # 40% weight
    "transport": 0.35,   # 35% weight
    "waste": 0.25        # 25% weight
}

EMISSION_FACTORS = {
    "energy_kwh": 0.5,
    "transport_km": 0.12,
    "waste_kg": 0.3,
}
```

---

## 🔍 Troubleshooting

### Issue: "Failed to connect to Snowflake"

**Solution:**
- Verify secrets are configured correctly
- Check warehouse is running: `SHOW WAREHOUSES;`
- Verify role has access: `SHOW GRANTS TO ROLE PUBLIC;`

### Issue: "Table does not exist"

**Solution:**
```sql
USE DATABASE CARBON_SCORING_DB;
USE SCHEMA PUBLIC;
SHOW TABLES;
```

If tables don't exist, run [setup.sql](setup.sql) again.

### Issue: "Cannot import module"

**Solution:**
- Ensure all files are uploaded with correct directory structure
- Verify `__init__.py` files exist in each package
- Check file paths are correct in imports

### Issue: App is slow

**Solution:**
- Increase warehouse size:
  ```sql
  ALTER WAREHOUSE COMPUTE_WH SET WAREHOUSE_SIZE = 'SMALL';
  ```
- Check query performance in History tab
- Add indexes to frequently queried columns

---

## 📈 Performance Optimization

### 1. Warehouse Sizing

For production use:
```sql
ALTER WAREHOUSE COMPUTE_WH SET
    WAREHOUSE_SIZE = 'SMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE;
```

### 2. Query Optimization

The app uses views for common queries:
- `RECENT_CARBON_SCORES` - Last 100 scores
- `CARBON_SCORE_STATISTICS` - Aggregated statistics
- `RATING_DISTRIBUTION` - Rating breakdown

### 3. Caching

Streamlit caching is enabled:
```python
@st.cache_resource
def initialize_api():
    return CarbonScoringAPI()
```

---

## 🔒 Security Best Practices

1. **Never commit secrets**
   - Use Snowflake Secrets management
   - Don't hardcode credentials

2. **Use appropriate roles**
   - Create custom role for the app
   - Grant minimum required permissions

3. **Enable audit logging**
   ```sql
   ALTER ACCOUNT SET ENABLE_AUDIT_LOGGING = TRUE;
   ```

4. **Use secure connections**
   - Snowflake uses HTTPS by default
   - No additional SSL configuration needed

---

## 🚀 Going to Production

### Checklist

- [ ] Run `setup.sql` in production account
- [ ] Configure production secrets
- [ ] Test all features thoroughly
- [ ] Set up monitoring/alerting
- [ ] Document warehouse costs
- [ ] Train users on the app
- [ ] Set up backup/recovery plan

### Monitoring

Monitor warehouse usage:
```sql
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE WAREHOUSE_NAME = 'COMPUTE_WH'
ORDER BY START_TIME DESC
LIMIT 10;
```

Monitor query performance:
```sql
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE QUERY_TEXT LIKE '%CARBON_SCORES%'
ORDER BY START_TIME DESC
LIMIT 10;
```

---

## 📚 Additional Resources

- [Snowflake Streamlit Documentation](https://docs.snowflake.com/en/developer-guide/streamlit/about-streamlit)
- [Streamlit Documentation](https://docs.streamlit.io/)
- [Carbon Scoring API README](README.md)

---

## 💡 Tips

1. **Start with demo version** - Test deployment with `app_demo.py` first
2. **Use small warehouses** - XSMALL is sufficient for development
3. **Monitor costs** - Check warehouse usage regularly
4. **Version control** - Keep track of app versions
5. **Test locally** - Use `streamlit run app.py` for development

---

**Need help?** Contact the development team or check the troubleshooting section above.

**Version:** 1.0.0
**Last Updated:** 2025
