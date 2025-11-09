"""
Carbon Scoring API - Demo/Hello World Version
Simplified version for initial Snowflake deployment testing
"""

import streamlit as st
from datetime import datetime

# Page configuration
st.set_page_config(
    page_title="Carbon Scoring API - Demo",
    page_icon="🌱",
    layout="wide"
)

# Header
st.title("🌱 Carbon Scoring API - Demo")
st.markdown("**Hello World** deployment test for Snowflake Streamlit")

# Display deployment info
st.success("✅ Successfully deployed to Snowflake!")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Status", "Running", delta="Active")

with col2:
    st.metric("Version", "1.0.0")

with col3:
    st.metric("Platform", "Snowflake")

st.divider()

# Demo calculator section
st.header("Quick Carbon Score Demo")

with st.form("demo_form"):
    st.markdown("**Test the scoring logic without database connection**")

    col1, col2 = st.columns(2)

    with col1:
        energy = st.number_input("Energy Consumption (kWh)", value=100.0, min_value=0.0)
        transport = st.number_input("Transport Distance (km)", value=50.0, min_value=0.0)

    with col2:
        waste = st.number_input("Waste Generated (kg)", value=10.0, min_value=0.0)
        resource_type = st.selectbox("Resource Type", ["Renewable", "Non-renewable", "Mixed"])

    submitted = st.form_submit_button("Calculate Score")

    if submitted:
        # Simple calculation (no database)
        emission_factors = {
            "energy_kwh": 0.5,
            "transport_km": 0.12,
            "waste_kg": 0.3
        }

        resource_multipliers = {
            "Renewable": 0.3,
            "Non-renewable": 1.0,
            "Mixed": 0.65
        }

        # Calculate emissions
        energy_emissions = energy * emission_factors["energy_kwh"]
        transport_emissions = transport * emission_factors["transport_km"]
        waste_emissions = waste * emission_factors["waste_kg"]

        multiplier = resource_multipliers[resource_type]
        energy_emissions *= multiplier

        total_co2 = energy_emissions + transport_emissions + waste_emissions

        # Calculate score (0-100)
        score = min((energy / 10) * 0.4 + (transport / 5) * 0.35 + (waste / 2) * 0.25, 100) * multiplier

        # Determine rating
        if score < 20:
            rating = "A+"
        elif score < 40:
            rating = "A"
        elif score < 60:
            rating = "B"
        elif score < 80:
            rating = "C"
        elif score < 90:
            rating = "D"
        else:
            rating = "E"

        # Display results
        st.success("✅ Score calculated!")

        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric("Carbon Score", f"{score:.2f}", help="0-100 scale, lower is better")

        with col2:
            st.metric("CO2 Emissions", f"{total_co2:.2f} kg")

        with col3:
            st.metric("Rating", rating, help="A+ (Best) to E (Worst)")

        # Breakdown
        with st.expander("View Detailed Breakdown"):
            st.markdown(f"""
            **Emissions Breakdown:**
            - Energy: {energy_emissions:.2f} kg CO2
            - Transport: {transport_emissions:.2f} kg CO2
            - Waste: {waste_emissions:.2f} kg CO2
            - **Total: {total_co2:.2f} kg CO2**

            **Calculation Parameters:**
            - Resource Multiplier: {multiplier} ({resource_type})
            - Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """)

st.divider()

# Connection test section
st.header("Database Connection Test")

if st.button("Test Snowflake Connection"):
    try:
        # Try to get connection from Snowflake context
        conn = st.connection("snowflake")

        st.success("✅ Successfully connected to Snowflake!")

        # Try a simple query
        df = conn.query("SELECT CURRENT_VERSION() as VERSION, CURRENT_DATABASE() as DATABASE, CURRENT_SCHEMA() as SCHEMA")

        st.markdown("**Connection Info:**")
        st.dataframe(df, use_container_width=True)

    except Exception as e:
        st.warning(f"⚠️ Database connection not configured yet. This is normal for initial deployment.")
        st.code(f"Error: {str(e)}")
        st.info("""
        **To enable database features:**
        1. Run the setup.sql script in Snowflake
        2. Configure secrets in Streamlit app settings
        3. Restart the app
        """)

# Information section
st.divider()

with st.expander("ℹ️ About This Demo"):
    st.markdown("""
    ### Carbon Scoring API Demo

    This is a simplified "Hello World" version of the Carbon Scoring API, designed for:

    - ✅ Testing Snowflake Streamlit deployment
    - ✅ Validating basic functionality
    - ✅ Verifying the scoring algorithm
    - ✅ Testing UI components

    ### Features in Full Version:
    - 🗄️ Snowflake database integration
    - 📊 Historical data tracking
    - 📈 Statistics and analytics
    - 🔍 Data explorer
    - 🚀 Advanced scoring features

    ### Next Steps:
    1. Run `setup.sql` in your Snowflake worksheet
    2. Configure secrets in app settings
    3. Switch to the full version (`app.py`)

    **Version:** 1.0.0
    **Platform:** Snowflake Streamlit
    **Event:** Hacktogone Toulouse 2025
    """)

# Footer
st.divider()
st.caption("🌱 Carbon Scoring API | Powered by Streamlit & Snowflake | Hacktogone 2025")
