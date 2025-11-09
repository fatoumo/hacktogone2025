"""
Tests unitaires pour le module carbon-data-rag

Execute avec: pytest tests/test_rag.py -v
"""

import pytest
import os
from pathlib import Path
import sys

# Ajouter src au path pour imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Configuration
CHROMA_DIR = Path(__file__).parent.parent / "data" / "chroma_db"
CHROMA_EXISTS = CHROMA_DIR.exists() and (CHROMA_DIR / "chroma.sqlite3").exists()

# Skip tests si ChromaDB n'existe pas
pytestmark = pytest.mark.skipif(
    not CHROMA_EXISTS,
    reason="ChromaDB not found. Run: python src/ingest.py first"
)

# Fixtures

@pytest.fixture(scope="module")
def rag_service():
    """Instance du service RAG pour les tests"""
    from rag_service import CarbonRAGService
    return CarbonRAGService()

@pytest.fixture(scope="module")
def test_client():
    """Client de test FastAPI"""
    from fastapi.testclient import TestClient
    from api import app
    return TestClient(app)


# Tests du service RAG

def test_query_semantic_search(rag_service):
    """Test de recherche sémantique basique"""
    results = rag_service.query("electric car", top_k=5)
    
    assert len(results) > 0, "La recherche devrait retourner des résultats"
    assert len(results) <= 5, "Ne devrait pas dépasser top_k"
    
    # Vérifier structure
    first_result = results[0]
    assert "factor" in first_result
    assert "unit" in first_result
    assert "description" in first_result
    assert "category" in first_result
    assert "similarity_score" in first_result
    
    # Le résultat devrait être lié au transport
    assert first_result["category"] == "transport"


def test_calculate_emissions(rag_service):
    """Test de calcul d'émissions"""
    result = rag_service.calculate("electric car trip", value=100, top_k=3)
    
    assert "co2e_kg" in result, "Devrait calculer les émissions"
    assert "factor_used" in result
    assert "alternative_factors" in result
    assert "equivalents" in result
    
    # Les émissions devraient être > 0
    assert result["co2e_kg"] > 0
    
    # Vérifier équivalents
    assert "car_km_average" in result["equivalents"]
    assert "trees_year_offset" in result["equivalents"]


def test_category_filter(rag_service):
    """Test du filtrage par catégorie"""
    results = rag_service.query(
        "emissions",
        top_k=5,
        category_filter="electricity"
    )
    
    assert len(results) > 0
    
    # Tous les résultats devraient être dans la catégorie electricity
    for result in results:
        assert result["category"] == "electricity"


def test_min_similarity_filter(rag_service):
    """Test du filtre de similarité minimale"""
    results_low = rag_service.query("car", top_k=10, min_similarity=0.3)
    results_high = rag_service.query("car", top_k=10, min_similarity=0.8)
    
    # Plus de résultats avec similarité basse
    assert len(results_low) >= len(results_high)
    
    # Tous les résultats devraient avoir similarité >= min
    for result in results_high:
        assert result["similarity_score"] >= 0.8


def test_get_categories(rag_service):
    """Test de récupération des catégories"""
    categories = rag_service.get_available_categories()
    
    assert isinstance(categories, list)
    assert len(categories) > 0
    
    # Vérifier présence de catégories attendues
    expected_categories = {"transport", "energy", "electricity"}
    assert expected_categories.issubset(set(categories))


def test_get_stats(rag_service):
    """Test des statistiques"""
    stats = rag_service.get_stats()
    
    assert "total_factors" in stats
    assert "categories" in stats
    assert "embedding_model" in stats
    assert "vector_db" in stats
    assert "source" in stats
    
    assert stats["total_factors"] > 0
    assert stats["embedding_model"] == "all-MiniLM-L6-v2"
    assert stats["source"] == "DEFRA 2024"


# Tests de l'API

def test_api_health(test_client):
    """Test du endpoint de santé"""
    response = test_client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "operational"
    assert "endpoints" in data


def test_api_stats(test_client):
    """Test du endpoint stats"""
    response = test_client.get("/stats")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "total_factors" in data
    assert data["total_factors"] > 0


def test_api_categories(test_client):
    """Test du endpoint categories"""
    response = test_client.get("/categories")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "categories" in data
    assert "count" in data
    assert len(data["categories"]) == data["count"]


def test_api_query(test_client):
    """Test du endpoint query"""
    response = test_client.post(
        "/query",
        json={
            "query": "electric vehicle",
            "top_k": 3,
            "min_similarity": 0.5
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "results" in data
    assert "count" in data
    assert len(data["results"]) <= 3


def test_api_query_validation(test_client):
    """Test de validation des entrées query"""
    # Query trop courte
    response = test_client.post(
        "/query",
        json={"query": "ab", "top_k": 5}
    )
    assert response.status_code == 422
    
    # top_k trop grand
    response = test_client.post(
        "/query",
        json={"query": "car emissions", "top_k": 100}
    )
    assert response.status_code == 422


def test_api_calculate(test_client):
    """Test du endpoint calculate"""
    response = test_client.post(
        "/calculate",
        json={
            "query": "electric car trip",
            "value": 150,
            "top_k": 3
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "co2e_kg" in data
    assert "factor_used" in data
    assert "alternative_factors" in data
    assert data["value"] == 150


def test_api_calculate_validation(test_client):
    """Test de validation des entrées calculate"""
    # Valeur négative
    response = test_client.post(
        "/calculate",
        json={"query": "car trip", "value": -10}
    )
    assert response.status_code == 422
    
    # Query trop courte
    response = test_client.post(
        "/calculate",
        json={"query": "ab", "value": 100}
    )
    assert response.status_code == 422


# Tests de performance (optionnels)

@pytest.mark.slow
def test_query_performance(rag_service):
    """Test de performance de la recherche"""
    import time
    
    start = time.time()
    results = rag_service.query("car emissions", top_k=10)
    elapsed = time.time() - start
    
    # La recherche devrait être rapide (< 1 seconde)
    assert elapsed < 1.0, f"Query trop lente: {elapsed:.2f}s"
    assert len(results) > 0
