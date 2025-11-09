# Carbon Data RAG Module

Module autonome fournissant un accès RAG (Retrieval-Augmented Generation) aux facteurs d'émission carbone (DEFRA 2024) pour des agents conversationnels.

## Architecture

```
carbon-data-rag/              # Module données (ce repo)
├── data/
│   ├── defra_2024.xlsx       # Données brutes DEFRA
│   └── chroma_db/            # Base vectorielle persistée
├── src/
│   ├── ingest.py             # Parsing DEFRA → vectorisation
│   ├── rag_service.py        # Service RAG avec ChromaDB
│   └── api.py                # API FastAPI pour agents
├── requirements.txt
└── README.md

carbon-agents/                # Module agents (séparé)
├── src/
│   ├── conversational_agent.py
│   └── carbon_client.py      # Client pour appeler carbon-data-rag
└── requirements.txt
```

## Pourquoi RAG > SQL pour ce use case

✅ **Recherche sémantique** : "voiture hybride France" trouve le bon facteur même sans match exact  
✅ **Langage naturel** : Les agents n'ont pas besoin de connaître le schéma  
✅ **Extensible** : Facile d'ajouter ADEME, EPA, etc. dans le même store vectoriel  
✅ **Contexte enrichi** : RAG retourne les métadonnées (source, unité, année, région)  
✅ **Qualité réponses** : L'agent reçoit les 3-5 facteurs les plus pertinents pour décider

## Stack technique

- **ChromaDB** : Vector store local, persistence, setup 5 minutes
- **sentence-transformers** : Embeddings locaux gratuits (ou OpenAI)
- **FastAPI** : API REST pour exposer le RAG
- **pandas + openpyxl** : Parsing DEFRA

## Installation rapide

```bash
cd carbon-data-rag
pip install -r requirements.txt
python src/ingest.py  # Vectorise DEFRA (une fois, ~5 min)
fastapi dev src/api.py  # Lance le service RAG
```

## Utilisation depuis un agent

```python
import requests

# L'agent interroge en langage naturel
response = requests.post("http://localhost:8000/query", json={
    "query": "émissions d'une voiture électrique sur 100 km en France",
    "top_k": 3
})

results = response.json()
# {
#   "results": [
#     {
#       "factor": 0.053,
#       "unit": "kg CO2e/km",
#       "description": "Battery Electric Vehicle, UK electricity mix",
#       "category": "passenger_vehicles",
#       "confidence": 0.89
#     },
#     ...
#   ]
# }
```

## Timeline setup

- ⏱️ **15 min** : Installation + téléchargement DEFRA
- ⏱️ **30 min** : Première vectorisation (parsing + embeddings)
- ⏱️ **20 min** : API RAG opérationnelle
- ⏱️ **Total : ~1h** pour module données prêt

Ensuite vos agents peuvent interroger instantanément (latence <100ms).
