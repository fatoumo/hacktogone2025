# Dockerfile for eleven_agent_acceuil
# Currently: CLI application
# Future: FastAPI application (ready for migration)

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
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose port 8002 (for future FastAPI migration)
# This port will be used when the app is converted to FastAPI
EXPOSE 8002

# Current: Keep container running for CLI access
# Future: Replace with FastAPI command when migrated
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]

# For now, run in interactive mode or keep alive
# You can exec into this container to run: python main.py
CMD ["tail", "-f", "/dev/null"]

# Alternative: Run the CLI in demo mode automatically
# CMD ["python", "main.py", "--demo"]
