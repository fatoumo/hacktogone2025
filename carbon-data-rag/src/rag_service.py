"""
Service RAG pour facteurs d'émission carbone

Fournit une interface de recherche sémantique sur les facteurs DEFRA vectorisés.
"""

import chromadb
from sentence_transformers import SentenceTransformer
from pathlib import Path
from typing import List, Dict, Optional
import numpy as np

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
CHROMA_DIR = DATA_DIR / "chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"


class CarbonRAGService:
    """
    Service RAG pour interroger les facteurs d'émission carbone
    """
    
    def __init__(self):
        """Initialise le service RAG"""
        
        # Charger le modèle d'embeddings (même que pour l'ingestion)
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        
        # Connexion ChromaDB
        if not CHROMA_DIR.exists():
            raise FileNotFoundError(
                f"ChromaDB non trouvée : {CHROMA_DIR}\n"
                "Exécutez d'abord : python src/ingest.py"
            )
        
        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        
        try:
            self.collection = self.chroma_client.get_collection("carbon_factors")
        except Exception:
            raise RuntimeError(
                "Collection 'carbon_factors' introuvable.\n"
                "Exécutez d'abord : python src/ingest.py"
            )
        
        print(f"✅ CarbonRAGService initialisé ({self.collection.count()} facteurs)")
    
    def query(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        min_similarity: float = 0.5
    ) -> List[Dict]:
        """
        Recherche sémantique de facteurs d'émission
        
        Args:
            query: Requête en langage naturel (ex: "émissions voiture électrique France")
            top_k: Nombre de résultats à retourner (défaut: 5)
            category_filter: Filtrer par catégorie (transport, energy, electricity, materials, water)
            min_similarity: Score de similarité minimum (0-1, défaut: 0.5)
        
        Returns:
            Liste de facteurs d'émission avec métadonnées et scores
        """
        
        # Générer embedding de la requête
        query_embedding = self.embedding_model.encode([query])[0]
        
        # Construire le filtre ChromaDB si catégorie spécifiée
        where_filter = None
        if category_filter:
            where_filter = {"category": category_filter}
        
        # Recherche dans ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k * 2,  # Récupérer plus pour filtrage post-hoc
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )
        
        # Formater les résultats
        formatted_results = []
        
        if not results['documents'][0]:
            return formatted_results
        
        for doc, metadata, distance in zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        ):
            # Convertir distance en similarité (ChromaDB utilise L2 distance)
            # Plus la distance est petite, plus c'est similaire
            # On normalise approximativement en score 0-1
            similarity = 1 / (1 + distance)
            
            # Filtrer par similarité minimale
            if similarity < min_similarity:
                continue
            
            formatted_results.append({
                "factor": metadata.get("factor"),
                "unit": metadata.get("unit"),
                "description": metadata.get("description"),
                "category": metadata.get("category"),
                "source": metadata.get("source", "DEFRA 2024"),
                "similarity_score": round(similarity, 3),
                "raw_metadata": metadata  # Pour debug/besoin avancés
            })
        
        # Limiter au top_k demandé après filtrage
        return formatted_results[:top_k]
    
    def calculate(
        self,
        query: str,
        value: float,
        top_k: int = 3
    ) -> Dict:
        """
        Recherche + calcul immédiat des émissions
        
        Args:
            query: Description de l'activité (ex: "voiture électrique 100 km")
            value: Quantité (km, kWh, kg selon contexte)
            top_k: Nombre de facteurs à considérer
        
        Returns:
            Résultat avec émissions calculées et facteurs utilisés
        """
        
        # Rechercher les facteurs pertinents
        factors = self.query(query, top_k=top_k)
        
        if not factors:
            return {
                "error": "Aucun facteur trouvé pour cette requête",
                "query": query
            }
        
        # Utiliser le facteur le plus similaire
        best_factor = factors[0]
        
        # Calculer émissions
        co2e_kg = best_factor["factor"] * value
        
        return {
            "query": query,
            "value": value,
            "co2e_kg": round(co2e_kg, 2),
            "factor_used": best_factor,
            "alternative_factors": factors[1:] if len(factors) > 1 else [],
            "equivalents": {
                "car_km_average": round(co2e_kg / 0.17, 1),
                "trees_year_offset": round(co2e_kg / 21, 2)
            }
        }
    
    def get_available_categories(self) -> List[str]:
        """Retourne les catégories disponibles"""
        
        # Récupérer échantillon de métadonnées
        sample = self.collection.get(
            limit=100,
            include=["metadatas"]
        )
        
        categories = set()
        for metadata in sample['metadatas']:
            if 'category' in metadata:
                categories.add(metadata['category'])
        
        return sorted(list(categories))
    
    def get_stats(self) -> Dict:
        """Statistiques sur la base vectorielle"""
        
        categories = self.get_available_categories()
        
        return {
            "total_factors": self.collection.count(),
            "categories": categories,
            "embedding_model": EMBEDDING_MODEL,
            "vector_db": "ChromaDB",
            "source": "DEFRA 2024"
        }


# Instance singleton (chargée au démarrage de l'API)
_rag_service = None

def get_rag_service() -> CarbonRAGService:
    """
    Retourne l'instance singleton du service RAG
    (pattern Dependency Injection pour FastAPI)
    """
    global _rag_service
    if _rag_service is None:
        _rag_service = CarbonRAGService()
    return _rag_service
