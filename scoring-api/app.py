"""
Carbon Scoring API - Main Streamlit Application
Deployed on Snowflake for carbon footprint scoring
"""

import streamlit as st
from api.scoring import CarbonScoringAPI
from config.app_config import APP_TITLE, APP_DESCRIPTION, API_VERSION

# Page configuration
st.set_page_config(
    page_title=APP_TITLE,
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize API
@st.cache_resource
def initialize_api():
    """Initialize the Carbon Scoring API"""
    return CarbonScoringAPI()

api = initialize_api()

# Main UI
st.title(f"{APP_TITLE} 🌱")
st.markdown(f"**Version:** {API_VERSION}")
st.markdown(APP_DESCRIPTION)

# Sidebar navigation
with st.sidebar:
    st.header("Navigation")
    page = st.radio(
        "Select Page",
        ["Score Calculator", "API Documentation", "Data Explorer"]
    )

# Main content based on selected page
if page == "Score Calculator":
    st.header("Carbon Score Calculator")

    with st.form("scoring_form"):
        st.subheader("Input Parameters")

        col1, col2 = st.columns(2)

        with col1:
            energy_consumption = st.number_input(
                "Energy Consumption (kWh)",
                min_value=0.0,
                value=100.0,
                help="Total energy consumption in kilowatt-hours"
            )

            transport_distance = st.number_input(
                "Transport Distance (km)",
                min_value=0.0,
                value=50.0,
                help="Total transport distance in kilometers"
            )

        with col2:
            waste_generated = st.number_input(
                "Waste Generated (kg)",
                min_value=0.0,
                value=10.0,
                help="Total waste generated in kilograms"
            )

            resource_type = st.selectbox(
                "Primary Resource Type",
                ["Renewable", "Non-renewable", "Mixed"],
                help="Primary type of resources used"
            )

        submitted = st.form_submit_button("Calculate Carbon Score")

        if submitted:
            with st.spinner("Calculating carbon score..."):
                result = api.calculate_score(
                    energy_consumption=energy_consumption,
                    transport_distance=transport_distance,
                    waste_generated=waste_generated,
                    resource_type=resource_type
                )

                st.success("✅ Score calculated successfully!")

                # Display results
                col1, col2, col3 = st.columns(3)

                with col1:
                    st.metric(
                        "Carbon Score",
                        f"{result['score']:.2f}",
                        delta=result.get('delta', None)
                    )

                with col2:
                    st.metric(
                        "CO2 Emissions (kg)",
                        f"{result['co2_kg']:.2f}"
                    )

                with col3:
                    st.metric(
                        "Rating",
                        result['rating'],
                        help="A+ (Best) to E (Worst)"
                    )

                # Detailed breakdown
                with st.expander("View Detailed Breakdown"):
                    st.json(result.get('breakdown', {}))

elif page == "API Documentation":
    st.header("API Documentation")

    st.markdown("""
    ### Available Endpoints

    #### 1. Calculate Carbon Score
    Calculate carbon footprint score based on input parameters.

    **Parameters:**
    - `energy_consumption` (float): Energy consumption in kWh
    - `transport_distance` (float): Transport distance in km
    - `waste_generated` (float): Waste generated in kg
    - `resource_type` (string): Type of resources used

    **Returns:**
    - `score` (float): Carbon score (0-100)
    - `co2_kg` (float): Total CO2 emissions in kg
    - `rating` (string): Letter rating (A+ to E)
    - `breakdown` (object): Detailed emissions breakdown

    #### 2. Get Historical Data
    Retrieve historical carbon score data from Snowflake.

    #### 3. Store Score
    Save calculated scores to Snowflake database.
    """)

    st.code("""
# Example API Usage
from api.scoring import CarbonScoringAPI

api = CarbonScoringAPI()
result = api.calculate_score(
    energy_consumption=100.0,
    transport_distance=50.0,
    waste_generated=10.0,
    resource_type="Renewable"
)

print(f"Carbon Score: {result['score']}")
print(f"CO2 Emissions: {result['co2_kg']} kg")
    """, language="python")

elif page == "Data Explorer":
    st.header("Data Explorer")

    st.info("Connect to Snowflake to explore historical carbon scoring data")

    if st.button("Load Recent Scores"):
        with st.spinner("Loading data from Snowflake..."):
            try:
                data = api.get_recent_scores(limit=10)
                if data:
                    st.dataframe(data, use_container_width=True)
                else:
                    st.warning("No data available")
            except Exception as e:
                st.error(f"Error loading data: {str(e)}")

# Footer
st.divider()
st.caption(f"Carbon Scoring API v{API_VERSION} | Powered by Streamlit & Snowflake")
