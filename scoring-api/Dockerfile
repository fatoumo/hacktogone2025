# Dockerfile for scoring-api Streamlit application (demo version)
FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# Note: We install all dependencies even for demo mode to keep flexibility
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create Streamlit config directory
RUN mkdir -p ~/.streamlit

# Configure Streamlit for production
RUN echo "[server]\n\
headless = true\n\
port = 8501\n\
address = 0.0.0.0\n\
enableCORS = false\n\
enableXsrfProtection = true\n\
\n\
[browser]\n\
gatherUsageStats = false\n\
" > ~/.streamlit/config.toml

# Expose Streamlit port
EXPOSE 8501

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

# Run Streamlit demo version
CMD ["streamlit", "run", "app_demo.py"]
