#!/usr/bin/env python3
"""
FastAPI service for ElevenLabs Accueil Agent
Provides REST API endpoints for carbon footprint questionnaire and scoring
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to import utils
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from dotenv import load_dotenv
import uvicorn

from utils import load_config, simple_score, send_to_elevenlabs

# Load environment variables
load_dotenv()

# Load configuration
CONFIG_PATH = Path(__file__).parent.parent / "config.yaml"
CONFIG = load_config(str(CONFIG_PATH))

# Questions definition
QUESTIONS = [
    {
        "id": "activity",
        "question": "Quelle est votre activité principale ?",
        "hint": "ex: services numériques, fabrication, commerce, transport, restauration, agriculture",
        "type": "text"
    },
    {
        "id": "workplace",
        "question": "Avez-vous des locaux, un atelier, ou travaillez-vous principalement à distance ?",
        "type": "text"
    },
    {
        "id": "employees",
        "question": "Combien de personnes travaillent régulièrement pour l'entreprise ?",
        "type": "number"
    },
    {
        "id": "products",
        "question": "Vendez-vous des produits physiques, des services, ou les deux ?",
        "type": "text"
    },
    {
        "id": "clients_geo",
        "question": "Vos clients sont principalement locaux, nationaux ou internationaux ?",
        "type": "text"
    },
    {
        "id": "vehicles",
        "question": "Utilisez-vous des véhicules pour votre activité ?",
        "type": "boolean"
    },
    {
        "id": "machines",
        "question": "Utilisez-vous des équipements énergivores (machines, réfrigération, serveurs) ?",
        "type": "boolean"
    },
    {
        "id": "cloud",
        "question": "Vos outils principaux sont-ils majoritairement en ligne (SaaS/cloud) ou locaux ?",
        "type": "text"
    },
    {
        "id": "hosting",
        "question": "Hébergez-vous des sites/données vous-même ou via un prestataire ?",
        "type": "text"
    },
    {
        "id": "recond",
        "question": "Utilisez-vous du matériel reconditionné ou neuf ?",
        "type": "text"
    }
]

# Initialize FastAPI app
app = FastAPI(
    title="ElevenLabs Accueil Agent API",
    description="API for carbon footprint questionnaire and scoring",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QuestionnaireRequest(BaseModel):
    """Request model for questionnaire submission"""
    answers: Dict[str, str] = Field(
        ...,
        description="Dictionary of question IDs to answers",
        example={
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
    )
    company_name: Optional[str] = Field(None, description="Optional company name")

class ScoreResult(BaseModel):
    """Response model for scoring results"""
    numerique: int = Field(..., ge=0, le=100, description="Digital footprint score")
    transport: int = Field(..., ge=0, le=100, description="Transport footprint score")
    energie: int = Field(..., ge=0, le=100, description="Energy footprint score")
    achats: int = Field(..., ge=0, le=100, description="Purchases footprint score")
    global_score: int = Field(..., ge=0, le=100, description="Global weighted score", alias="global")

    class Config:
        populate_by_name = True

class QuestionnaireResponse(BaseModel):
    """Response model for questionnaire results"""
    profile: Dict[str, str] = Field(..., description="Company profile answers")
    scores: ScoreResult = Field(..., description="Calculated scores")
    recommendations: List[str] = Field(default=[], description="List of recommendations")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")

class GenerateSummaryRequest(BaseModel):
    """Request model for generating summary"""
    profile: Dict[str, str] = Field(..., description="Company profile answers")
    scores: Dict[str, int] = Field(..., description="Calculated scores")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    elevenlabs_configured: bool

# API Endpoints

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "ElevenLabs Accueil Agent API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        elevenlabs_configured=bool(elevenlabs_key)
    )

@app.get("/api/v1/questions")
async def get_questions():
    """Get the list of questionnaire questions"""
    return {
        "questions": QUESTIONS,
        "total": len(QUESTIONS)
    }

@app.post("/api/v1/questionnaire", response_model=QuestionnaireResponse)
async def submit_questionnaire(request: QuestionnaireRequest):
    """
    Submit questionnaire answers and receive carbon footprint scores

    Args:
        request: Questionnaire request with answers dictionary

    Returns:
        QuestionnaireResponse with profile, scores, and recommendations
    """
    try:
        # Validate that all required questions are answered
        required_keys = {q["id"] for q in QUESTIONS}
        provided_keys = set(request.answers.keys())
        missing_keys = required_keys - provided_keys

        if missing_keys:
            raise HTTPException(
                status_code=400,
                detail=f"Missing answers for questions: {', '.join(missing_keys)}"
            )

        # Calculate scores
        scores = simple_score(request.answers, CONFIG.get("scoring", {}))

        # Build response
        result = QuestionnaireResponse(
            profile=request.answers,
            scores=ScoreResult(**scores),
            recommendations=_generate_recommendations(scores)
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/api/v1/generate-summary")
async def generate_summary(request: GenerateSummaryRequest):
    """
    Generate a summary using ElevenLabs API

    Args:
        request: Profile and scores data

    Returns:
        Summary generation result
    """
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if not elevenlabs_key:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs API key not configured"
        )

    try:
        payload = {
            "profile": request.profile,
            "scores": request.scores
        }

        result = send_to_elevenlabs(payload, CONFIG["elevenlabs"])

        return {
            "status": "success",
            "message": "Summary sent to ElevenLabs",
            "result": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )

def _generate_recommendations(scores: Dict[str, int]) -> List[str]:
    """
    Generate recommendations based on scores

    Args:
        scores: Dictionary of scores

    Returns:
        List of recommendation strings
    """
    recommendations = []

    if scores.get("numerique", 0) > 60:
        recommendations.append(
            "Considérez l'utilisation d'équipements reconditionnés et optimisez votre infrastructure cloud"
        )

    if scores.get("transport", 0) > 50:
        recommendations.append(
            "Explorez des options de transport plus écologiques (véhicules électriques, covoiturage, télétravail)"
        )

    if scores.get("energie", 0) > 60:
        recommendations.append(
            "Investissez dans des équipements plus économes en énergie et considérez les énergies renouvelables"
        )

    if scores.get("achats", 0) > 50:
        recommendations.append(
            "Privilégiez les fournisseurs locaux et éco-responsables, réduisez les emballages"
        )

    if scores.get("global", 0) > 60:
        recommendations.append(
            "Envisagez un audit carbone complet pour identifier les axes d'amélioration prioritaires"
        )

    if not recommendations:
        recommendations.append(
            "Félicitations ! Votre empreinte carbone semble maîtrisée. Continuez vos efforts !"
        )

    return recommendations

# Main entry point for running the server
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
