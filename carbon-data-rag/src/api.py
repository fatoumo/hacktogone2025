"""
API Carbon Data RAG

Expose le service RAG de facteurs d'émission carbone pour consommation par des agents.

Usage:
    fastapi dev api.py
    
Endpoints:
    GET  /                  - Health check et info
    GET  /stats             - Statistiques de la base
    POST /query             - Recherche sémantique de facteurs
    """
    POST /calculate         - Recherche + calcul immédiat
    GET  /categories        - Liste des catégories disponibles
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from src.rag_service import CarbonRAGService, get_rag_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup/shutdown events"""
    # Startup
    print("\n" + "="*80)
    print("  🚀 Carbon Data RAG API Starting...")
    print("="*80)
    
    try:
        # Précharger le service RAG
        rag = get_rag_service()
        stats = rag.get_stats()
        
        print(f"\n✅ Service RAG chargé :")
        print(f"   - {stats['total_factors']} facteurs d'émission")
        print(f"   - {len(stats['categories'])} catégories : {', '.join(stats['categories'])}")
        print(f"   - Source : {stats['source']}")
        print(f"   - Embedding : {stats['embedding_model']}")
        
        print("\n🌐 API prête sur : http://localhost:8000")
        print("📖 Documentation : http://localhost:8000/docs")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Erreur d'initialisation : {e}")
        print("\n💡 Avez-vous exécuté l'ingestion ?")
        print("   $ python src/ingest.py\n")
        raise
    
    yield
    
    # Shutdown
    print("\n👋 Carbon Data RAG API Shutting down...")

# Initialisation FastAPI
app = FastAPI(
    title="Carbon Data RAG API",
    description="Service RAG pour facteurs d'émission carbone (DEFRA 2024)",
    version="1.0.0",
    lifespan=lifespan
)
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from src.rag_service import CarbonRAGService, get_rag_service

# Initialisation FastAPI
app = FastAPI(
    title="Carbon Data RAG API",
    description="Service RAG pour facteurs d'émission carbone (DEFRA 2024)",
    version="1.0.0"
)

# CORS pour appels depuis autres modules/agents
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod: restreindre aux domaines agents
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles Pydantic pour validation

class QueryRequest(BaseModel):
    """Requête de recherche sémantique"""
    query: str = Field(..., description="Requête en langage naturel", min_length=3)
    top_k: int = Field(5, description="Nombre de résultats", ge=1, le=20)
    category_filter: Optional[str] = Field(None, description="Filtrer par catégorie")
    min_similarity: float = Field(0.5, description="Similarité minimale", ge=0.0, le=1.0)
    
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "query": "émissions d'une voiture électrique en France",
                "top_k": 3,
                "category_filter": "transport",
                "min_similarity": 0.6
            }
        })

class CalculateRequest(BaseModel):
    """Requête de calcul d'émissions"""
    query: str = Field(..., description="Description de l'activité", min_length=3)
    value: float = Field(..., description="Quantité (km, kWh, kg...)", gt=0)
    top_k: int = Field(3, description="Facteurs à considérer", ge=1, le=10)
    
    model_config = ConfigDict(
        json_schema_extra = {
            "example": {
                "query": "trajet en voiture électrique",
                "value": 100,
                "top_k": 3
            }
        })


# Endpoints

@app.get("/")
def root():
    """Health check et informations de base"""
    return {
        "service": "Carbon Data RAG",
        "status": "operational",
        "version": "1.0.0",
        "source": "DEFRA 2024",
        "endpoints": {
            "/stats": "Statistiques de la base",
            "/query": "Recherche sémantique de facteurs",
            "/calculate": "Recherche + calcul d'émissions",
            "/categories": "Catégories disponibles"
        }
    }

@app.get("/stats")
def get_stats(rag: CarbonRAGService = Depends(get_rag_service)):
    """Statistiques sur la base vectorielle"""
    return rag.get_stats()

@app.get("/categories")
def get_categories(rag: CarbonRAGService = Depends(get_rag_service)):
    """Liste des catégories de facteurs disponibles"""
    categories = rag.get_available_categories()
    return {
        "categories": categories,
        "count": len(categories)
    }

@app.post("/query")
def query_factors(
    request: QueryRequest,
    rag: CarbonRAGService = Depends(get_rag_service)
):
    """
    Recherche sémantique de facteurs d'émission
    
    Retourne les facteurs les plus pertinents pour la requête en langage naturel.
    Les agents peuvent utiliser ces facteurs pour calculer les émissions.
    """
    try:
        results = rag.query(
            query=request.query,
            top_k=request.top_k,
            category_filter=request.category_filter,
            min_similarity=request.min_similarity
        )

        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate")
def calculate_emissions(
    request: CalculateRequest,
    rag: CarbonRAGService = Depends(get_rag_service)
):
    """
    Recherche de facteur + calcul immédiat des émissions
    
    Combine la recherche sémantique avec le calcul d'émissions.
    Utile pour les agents qui veulent une réponse directe.
    """
    try:
        result = rag.calculate(
            query=request.query,
            value=request.value,
            top_k=request.top_k
        )
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))





# Point d'entrée pour exécution directe
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
