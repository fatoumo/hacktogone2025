# Pourquoi RAG > SQL pour les données carbone

## Le problème avec l'approche SQL classique

### ❌ Approche SQL naïve

```python
# Agent doit construire une requête SQL précise
cursor.execute("""
    SELECT factor FROM passenger_vehicles 
    WHERE vehicle_type = 'Battery Electric' 
    AND fuel = 'Electricity'
    AND country = 'UK'
""")
```

**Problèmes :**

1. **Rigidité** : L'agent doit connaître exactement la structure de la base
2. **Fragilité** : "voiture électrique" ≠ "Battery Electric Vehicle" → 0 résultat
3. **Pas de synonymes** : "vol" vs "flight", "électricité" vs "electricity"
4. **Maintenance** : Chaque changement de schéma casse les agents
5. **Multi-sources** : Intégrer ADEME + DEFRA + EPA = cauchemar de jointures

### ✅ Approche RAG

```python
# Agent interroge en langage naturel
result = carbon_rag.query("émissions voiture électrique France")
```

**Avantages :**

1. **Flexibilité** : Recherche sémantique trouve les facteurs pertinents
2. **Robustesse** : "voiture électrique" trouve "Battery Electric Vehicle"
3. **Multilingue** : Requête en français trouve données en anglais
4. **Extensible** : Ajouter une source = juste ingérer de nouveaux docs
5. **Contexte** : RAG retourne les 3-5 meilleurs facteurs avec scores

## Comparaison concrète

### Scénario : Agent doit calculer émissions d'un trajet

**❌ SQL : 3 requêtes nécessaires**

```python
# 1. Trouver la table
cursor.execute("SHOW TABLES LIKE '%vehicle%'")

# 2. Trouver les colonnes
cursor.execute("DESCRIBE passenger_vehicles")

# 3. Construire la requête
cursor.execute("""
    SELECT kg_co2e_per_km 
    FROM passenger_vehicles 
    WHERE level_1 = 'Cars (by size)' 
    AND level_2 = 'Battery Electric Vehicle'
    AND level_3 = 'UK electricity'
""")
```

**Complexité : O(n) requêtes × latence SQL**

**✅ RAG : 1 requête**

```python
result = carbon_rag.calculate(
    "trajet en voiture électrique UK",
    value=100
)
# → 5.31 kg CO2e
```

**Complexité : O(1) requête × 50-100ms**

## Architecture modulaire : Séparation des responsabilités

```
┌─────────────────────────────────────────────────────────────┐
│                     MODULE: carbon-agents                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Agent 1    │  │   Agent 2    │  │   Agent 3    │     │
│  │  (OpenAI)    │  │ (ElevenLabs) │  │  (Claude)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP REST API
                             │ (Découplage)
┌────────────────────────────┼─────────────────────────────────┐
│                            ▼                                  │
│              MODULE: carbon-data-rag                         │
│                                                              │
│   ┌────────────────────────────────────────────┐            │
│   │         RAG Service (rag_service.py)       │            │
│   │  - Recherche sémantique                    │            │
│   │  - Calcul émissions                        │            │
│   │  - Gestion ChromaDB                        │            │
│   └────────────────────────────────────────────┘            │
│                            │                                 │
│                            ▼                                 │
│   ┌────────────────────────────────────────────┐            │
│   │        ChromaDB (chroma_db/)               │            │
│   │  - 9847 facteurs DEFRA vectorisés         │            │
│   │  - Embeddings sentence-transformers        │            │
│   │  - Index HNSW pour recherche rapide        │            │
│   └────────────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Bénéfices de l'architecture modulaire

### 1. Indépendance des modules

**carbon-data-rag** peut évoluer sans toucher aux agents :
- Ajouter ADEME → Juste réingérer
- Changer de vector DB (Chroma → Pinecone) → Agents non affectés
- Améliorer embeddings → Transparence pour agents

**carbon-agents** peuvent évoluer sans toucher aux données :
- Ajouter un nouvel agent → Utilise la même API
- Changer de LLM provider → Data RAG inchangé
- A/B test différents prompts → Data RAG stable

### 2. Testabilité

**Tests unitaires carbon-data-rag :**
```python
def test_rag_search():
    rag = CarbonRAGService()
    results = rag.query("electric car")
    assert len(results) > 0
    assert results[0]['category'] == 'transport'
```

**Tests unitaires carbon-agents :**
```python
def test_agent_with_mock_rag():
    mock_rag = MockCarbonRAG()  # Mock du service RAG
    agent = CarbonAgent(rag_client=mock_rag)
    response = agent.chat("Calculate emissions for 100 km car trip")
    assert "kg CO2e" in response
```

### 3. Scalabilité

**Scaler le RAG :**
- Déployer sur un serveur dédié
- Load balancer pour haute disponibilité
- Cache Redis pour requêtes fréquentes

**Scaler les agents :**
- Chaque agent appelle le même endpoint RAG
- Pas de duplication des données
- Économie de mémoire et maintenance

### 4. Sécurité

**Séparation des secrets :**
- `carbon-data-rag` : Pas de clés API LLM
- `carbon-agents` : Pas d'accès direct aux données brutes

**Rate limiting au niveau API :**
```python
@app.middleware("http")
async def rate_limit(request, call_next):
    # Limiter à 100 req/min par agent
    pass
```

## Cas d'usage réels

### Exemple 1 : Multi-agents parallèles

```python
# Agent vocal (ElevenLabs)
elevenlabs_agent.calculate("vol Paris-Londres")
# → Appelle carbon-data-rag API

# Agent text (OpenAI)
openai_agent.calculate("vol Paris-Londres")
# → Appelle la MÊME carbon-data-rag API

# Pas de duplication de données !
# Pas de désynchronisation !
```

### Exemple 2 : Ajout d'une nouvelle source

```bash
# Dans carbon-data-rag uniquement
python src/ingest_ademe.py  # Nouveau script

# API reste identique
# Agents fonctionnent sans changement
# Juste plus de facteurs disponibles
```

### Exemple 3 : Migration vers un meilleur embedding

```python
# Dans carbon-data-rag/src/ingest.py
EMBEDDING_MODEL = "all-mpnet-base-v2"  # Meilleur modèle

# Réingérer
python src/ingest.py

# Agents bénéficient automatiquement
# Aucun changement de code agent nécessaire
```

## Performance RAG vs SQL

### Benchmarks (base 10 000 facteurs)

| Opération | SQL | RAG ChromaDB |
|-----------|-----|--------------|
| Recherche exacte | 5-10ms | 50-100ms |
| Recherche floue | N/A | 50-100ms |
| Recherche multilingue | N/A | 50-100ms |
| Top-K résultats | 10-20ms | 50-100ms |
| Ajout données | Instantané | 1-2 min (vectorisation) |
| Schema change | Breaking | Non-breaking |

**Verdict :** RAG légèrement plus lent (~50ms supplémentaires) mais beaucoup plus flexible.

Pour un hackathon/prod : **50ms de latence = imperceptible** pour l'utilisateur.

## Quand utiliser SQL vs RAG ?

### ✅ Utilisez SQL si :

- Requêtes **exactes** connues à l'avance
- Schéma **totalement stable**
- Performance **critique** (<5ms requis)
- Transactions / ACID requis

### ✅ Utilisez RAG si :

- Requêtes en **langage naturel**
- Schéma peut **évoluer**
- **Multi-sources** à intégrer
- **Recherche sémantique** nécessaire
- Agents **multiples** consomment les données

Pour des **facteurs d'émission carbone** interrogés par des **agents LLM** : **RAG est le choix évident**.

## Code minimal : Agent avec RAG

```python
# carbon-agents/src/simple_agent.py

from carbon_rag_client import CarbonRAGClient

class SimpleCarbonAgent:
    def __init__(self):
        self.rag = CarbonRAGClient()
    
    def calculate(self, user_input: str):
        # Parse user input (simple pour l'exemple)
        parts = user_input.split()
        value = float([p for p in parts if p.isdigit()][0])
        activity = " ".join([p for p in parts if not p.isdigit()])
        
        # Interroger RAG
        result = self.rag.calculate(activity, value)
        
        return f"Émissions : {result['co2e_kg']} kg CO2e"

# Usage
agent = SimpleCarbonAgent()
response = agent.calculate("voiture électrique 150 km")
print(response)  # "Émissions : 7.97 kg CO2e"
```

**10 lignes de code. Zéro SQL. Zéro regex complexe. RAG fait tout.**

## Conclusion

**SQL :** Rigide, fragile, complexe à maintenir avec agents LLM  
**RAG :** Flexible, robuste, naturel pour agents conversationnels

Pour votre hackathon :
1. ⏱️ **Setup RAG en 1h** (vs 3h+ pour bien faire le SQL)
2. 🚀 **Agents fonctionnent immédiatement** (langage naturel)
3. 🔧 **Extensible facilement** (ADEME, EPA, etc.)
4. 💪 **Architecture pro** (impression jury)

**RAG n'est pas juste "cool et moderne" - c'est la bonne solution technique pour ce cas d'usage.**
