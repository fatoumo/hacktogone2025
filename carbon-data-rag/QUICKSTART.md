# 🚀 Démarrage Rapide - Carbon Data RAG

Guide pour setup en 1 heure du module carbon-data-rag pour votre hackathon.

## 📋 Prérequis

- Python 3.9+
- 5 GB d'espace disque (données DEFRA + embeddings)
- Connexion internet (pour télécharger DEFRA et modèle embeddings)

## ⚡ Setup Express (1 heure)

### Étape 1 : Installation (10 min)

```bash
# Cloner ou créer le dossier
cd carbon-data-rag

# Créer environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer dépendances
pip install -r requirements.txt
```

### Étape 2 : Télécharger DEFRA (5 min)

**Option A : Téléchargement manuel (recommandé)**

1. Aller sur : https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024
2. Cliquer sur : **"Flat file set 2024 (XLSX, 5MB)"**
3. Sauvegarder dans : `carbon-data-rag/data/defra_2024.xlsx`

**Option B : Téléchargement automatique**

```bash
cd data
wget https://assets.publishing.service.gov.uk/media/6671b8fd1d2a7c6ab40e1c09/2024-ghg-conversion-factors-flat-file.xlsx -O defra_2024.xlsx
```

### Étape 3 : Ingestion dans ChromaDB (30 min)

```bash
# Depuis le dossier carbon-data-rag
python src/ingest.py
```

**Ce qui se passe :**
- ✅ Parse le fichier Excel DEFRA (10 onglets)
- ✅ Extrait ~8 000-12 000 facteurs d'émission
- ✅ Génère les embeddings avec sentence-transformers
- ✅ Indexe dans ChromaDB (base vectorielle locale)
- ✅ Lance un test de récupération

**Output attendu :**
```
================================================================================
  DEFRA 2024 → ChromaDB Ingestion
================================================================================
🚀 Initialisation DEFRAIngester...
📦 Chargement du modèle d'embeddings : all-MiniLM-L6-v2
✅ Collection 'carbon_factors' prête (0 documents)

📖 Lecture DEFRA : .../data/defra_2024.xlsx

  🔄 Traitement : Passenger vehicles
     ✅ 1234 facteurs extraits
  
  🔄 Traitement : Flights
     ✅ 567 facteurs extraits
  
  [... autres onglets ...]

📊 Total : 9847 facteurs d'émission extraits

🔮 Génération des embeddings (all-MiniLM-L6-v2)...
  Embedding en cours...
100%|████████████████████| 9847/9847 [00:45<00:00]

💾 Ingestion dans ChromaDB...
  ✅ Batch 1 ingéré (5000/9847)
  ✅ Batch 2 ingéré (9847/9847)

🎉 Ingestion terminée ! 9847 documents dans ChromaDB
📂 Base vectorielle : .../data/chroma_db

🧪 Test de récupération...

  Query: 'émissions d'une voiture électrique'
    1. Battery Electric Vehicle, UK electricity mix
       Factor: 0.05314 kg CO2e/km
       Category: transport
    2. Battery Electric Vehicle, average
       Factor: 0.05000 kg CO2e/km
       Category: transport

================================================================================
✅ Module carbon-data-rag prêt !
================================================================================

🚀 Prochaine étape : lancer l'API
   $ fastapi dev src/api.py
```

### Étape 4 : Lancer l'API (5 min)

```bash
# Depuis carbon-data-rag
fastapi dev src/api.py
```

**L'API démarre sur : http://localhost:8000**

**Output attendu :**
```
================================================================================
  🚀 Carbon Data RAG API Starting...
================================================================================

✅ Service RAG chargé :
   - 9847 facteurs d'émission
   - 5 catégories : electricity, energy, materials, transport, water
   - Source : DEFRA 2024
   - Embedding : all-MiniLM-L6-v2

🌐 API prête sur : http://localhost:8000
📖 Documentation : http://localhost:8000/docs
================================================================================

INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Étape 5 : Tester l'API (10 min)

**Via curl :**

```bash
# Test 1 : Health check
curl http://localhost:8000/

# Test 2 : Recherche de facteurs
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "émissions voiture électrique",
    "top_k": 3
  }'

# Test 3 : Calcul d'émissions
curl -X POST http://localhost:8000/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "trajet en voiture électrique",
    "value": 100
  }'

# Test 4 : Catégories disponibles
curl http://localhost:8000/categories

# Test 5 : Statistiques
curl http://localhost:8000/stats
```

**Via la documentation interactive :**

Ouvrir http://localhost:8000/docs dans votre navigateur et tester les endpoints.

**Via le client Python :**

```bash
python examples/agent_client.py
```

## 🤖 Utilisation dans vos agents

### Exemple agent OpenAI

```python
from examples.agent_client import CarbonRAGClient
from openai import OpenAI

# Initialiser clients
carbon_rag = CarbonRAGClient()
openai_client = OpenAI()

# Définir function calling
tools = [{
    "type": "function",
    "function": {
        "name": "calculate_carbon",
        "description": "Calcule émissions CO2 via base RAG",
        "parameters": {
            "type": "object",
            "properties": {
                "activity": {"type": "string"},
                "value": {"type": "number"}
            },
            "required": ["activity", "value"]
        }
    }
}]

# Conversation
messages = [
    {"role": "system", "content": "Tu aides à calculer l'empreinte carbone."},
    {"role": "user", "content": "Mon trajet en voiture électrique : 150 km"}
]

response = openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
    tools=tools
)

# Si OpenAI appelle la fonction
if response.choices[0].message.tool_calls:
    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    
    # Interroger le RAG local
    result = carbon_rag.calculate(args["activity"], args["value"])
    
    print(f"Émissions : {result['co2e_kg']} kg CO2e")
```

### Exemple agent ElevenLabs

```javascript
// Configuration dans ElevenLabs dashboard
const conversation = useConversation({
  agentId: 'VOTRE_AGENT_ID',
  clientTools: {
    calculateCarbon: async ({ activity, value }) => {
      const response = await fetch('http://localhost:8000/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activity, value })
      });
      
      const data = await response.json();
      return {
        co2e_kg: data.co2e_kg,
        message: `Émissions : ${data.co2e_kg} kg CO2`
      };
    }
  }
});
```

## 🔍 Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Health check |
| `/stats` | GET | Statistiques base |
| `/categories` | GET | Catégories disponibles |
| `/query` | POST | Recherche sémantique facteurs |
| `/calculate` | POST | Recherche + calcul émissions |

## 📊 Structure des réponses

### `/query` - Recherche de facteurs

```json
{
  "query": "voiture électrique",
  "results": [
    {
      "factor": 0.05314,
      "unit": "kg CO2e/km",
      "description": "Battery Electric Vehicle, UK mix",
      "category": "transport",
      "source": "DEFRA 2024",
      "similarity_score": 0.892
    }
  ],
  "count": 3
}
```

### `/calculate` - Calcul d'émissions

```json
{
  "query": "trajet voiture électrique",
  "value": 100,
  "co2e_kg": 5.31,
  "factor_used": {
    "factor": 0.05314,
    "unit": "kg CO2e/km",
    "description": "Battery Electric Vehicle",
    "category": "transport"
  },
  "equivalents": {
    "car_km_average": 31.2,
    "trees_year_offset": 0.25
  }
}
```

## 🐛 Troubleshooting

### Erreur : "ChromaDB non trouvée"

```bash
# Relancer l'ingestion
python src/ingest.py
```

### Erreur : "Collection carbon_factors introuvable"

```bash
# Supprimer et réingérer
rm -rf data/chroma_db
python src/ingest.py
```

### Erreur : "DEFRA file not found"

```bash
# Vérifier le chemin
ls data/defra_2024.xlsx

# Si absent, retélécharger
cd data
wget https://assets.publishing.service.gov.uk/media/6671b8fd1d2a7c6ab40e1c09/2024-ghg-conversion-factors-flat-file.xlsx -O defra_2024.xlsx
```

### L'API ne démarre pas

```bash
# Vérifier que l'ingestion est complète
python -c "import chromadb; client = chromadb.PersistentClient(path='data/chroma_db'); print(client.list_collections())"

# Relancer avec logs détaillés
fastapi dev src/api.py --log-level debug
```

### Embeddings lents

Le premier chargement du modèle sentence-transformers peut prendre 1-2 minutes.
Les appels suivants sont quasi-instantanés (<100ms).

## ⏱️ Timeline récapitulatif

| Étape | Durée | Cumulé |
|-------|-------|--------|
| Installation dépendances | 10 min | 10 min |
| Téléchargement DEFRA | 5 min | 15 min |
| Ingestion + vectorisation | 30 min | 45 min |
| Lancer API | 2 min | 47 min |
| Tests | 10 min | 57 min |
| **Total setup** | | **~1h** |

Après ça, votre module est **opérationnel** et vos agents peuvent l'interroger instantanément.

## 🎯 Prochaines étapes

1. ✅ Setup carbon-data-rag (ce guide)
2. 🤖 Créer vos agents dans `carbon-agents` module
3. 🔗 Intégrer CarbonRAGClient dans vos agents
4. 🎤 Ajouter ElevenLabs si vous avez le temps
5. 🚀 Démo !

## 💡 Optimisations pour production

- [ ] Déployer l'API sur un serveur (Render, Railway, etc.)
- [ ] Ajouter authentification API (API keys)
- [ ] Cacher les embeddings en Redis pour encore plus de vitesse
- [ ] Monitorer avec Prometheus/Grafana
- [ ] Ajouter d'autres sources (ADEME, EPA, etc.)
- [ ] Fine-tuner le modèle d'embeddings sur vos données

Mais pour le hackathon de ce soir : **ce setup suffit largement** ! 🎉
