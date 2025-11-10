# ElevenLabs Accueil Agent - FastAPI Service

REST API service for carbon footprint questionnaire and scoring.

## Installation

```bash
cd eleven_agent_acceuil

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Unix/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the `eleven_agent_acceuil` directory:

```bash
# Optional: ElevenLabs API key for summary generation
ELEVENLABS_API_KEY=sk_your_key_here

# Optional: Custom port (default: 8002)
PORT=8002
```

## Running the Service

### Development Mode (with auto-reload)

```bash
# From project root
cd eleven_agent_acceuil
python api/main.py

# Or with uvicorn directly
uvicorn api.main:app --reload --port 8002
```

### Production Mode

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8002 --workers 4
```

## API Endpoints

### Health Check
```bash
GET /api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "elevenlabs_configured": true
}
```

### Get Questions
```bash
GET /api/v1/questions
```

Response:
```json
{
  "questions": [
    {
      "id": "activity",
      "question": "Quelle est votre activité principale ?",
      "hint": "ex: services numériques, fabrication, commerce...",
      "type": "text"
    },
    ...
  ],
  "total": 10
}
```

### Submit Questionnaire
```bash
POST /api/v1/questionnaire
Content-Type: application/json
```

Request body:
```json
{
  "answers": {
    "activity": "services numériques",
    "workplace": "bureaux",
    "employees": "5",
    "products": "services",
    "clients_geo": "nationaux",
    "vehicles": "non",
    "machines": "non",
    "cloud": "cloud",
    "hosting": "prestataire",
    "recond": "non"
  },
  "company_name": "Ma Société"
}
```

Response:
```json
{
  "profile": {
    "activity": "services numériques",
    ...
  },
  "scores": {
    "numerique": 50,
    "transport": 20,
    "energie": 30,
    "achats": 20,
    "global": 30
  },
  "recommendations": [
    "Considérez l'utilisation d'équipements reconditionnés...",
    "Félicitations ! Votre empreinte carbone semble maîtrisée..."
  ]
}
```

### Generate Summary (ElevenLabs)
```bash
POST /api/v1/generate-summary
Content-Type: application/json
```

Request body:
```json
{
  "profile": {
    "activity": "services numériques",
    ...
  },
  "scores": {
    "numerique": 50,
    "transport": 20,
    "energie": 30,
    "achats": 20,
    "global": 30
  }
}
```

Response:
```json
{
  "status": "success",
  "message": "Summary sent to ElevenLabs",
  "result": true
}
```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc

## Testing

### Using curl

```bash
# Health check
curl http://localhost:8002/api/v1/health

# Get questions
curl http://localhost:8002/api/v1/questions

# Submit questionnaire
curl -X POST http://localhost:8002/api/v1/questionnaire \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "activity": "services numériques",
      "workplace": "bureaux",
      "employees": "5",
      "products": "services",
      "clients_geo": "nationaux",
      "vehicles": "non",
      "machines": "non",
      "cloud": "cloud",
      "hosting": "prestataire",
      "recond": "non"
    }
  }'
```

### Using Python

```python
import requests

# Submit questionnaire
response = requests.post(
    "http://localhost:8002/api/v1/questionnaire",
    json={
        "answers": {
            "activity": "services numériques",
            "workplace": "bureaux",
            "employees": "5",
            "products": "services",
            "clients_geo": "nationaux",
            "vehicles": "non",
            "machines": "non",
            "cloud": "cloud",
            "hosting": "prestataire",
            "recond": "non"
        }
    }
)

result = response.json()
print(f"Global score: {result['scores']['global']}")
print("Recommendations:")
for rec in result['recommendations']:
    print(f"  - {rec}")
```

## CLI Mode (Legacy)

The original CLI interface is still available:

```bash
# Interactive mode
python main.py

# Demo mode
python main.py --demo
```

## Integration with Web App

The web application can consume this API at `http://localhost:8002`:

```typescript
// Example fetch from Next.js
const response = await fetch('http://localhost:8002/api/v1/questionnaire', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: {
      activity: 'services numériques',
      // ... other answers
    }
  })
});

const result = await response.json();
console.log('Scores:', result.scores);
```

## Docker Deployment

A Dockerfile is available for containerized deployment:

```bash
# Build image
docker build -t elevenlabs-accueil-agent .

# Run container
docker run -p 8002:8002 -e ELEVENLABS_API_KEY=sk_xxx elevenlabs-accueil-agent
```

## Troubleshooting

### Port already in use
If port 8002 is already in use, specify a different port:
```bash
PORT=8003 python api/main.py
```

### Import errors
Make sure you're running from the correct directory and the virtual environment is activated:
```bash
cd eleven_agent_acceuil
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python api/main.py
```

### CORS issues
For local development with the web app, CORS is enabled for all origins. In production, restrict origins in `api/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    ...
)
```
