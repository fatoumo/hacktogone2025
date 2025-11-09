"""
Client Carbon RAG pour agents conversationnels

Exemple d'utilisation du service carbon-data-rag depuis un agent.
À intégrer dans votre module carbon-agents.
"""

import requests
from typing import Optional, Dict, List
from pydantic import BaseModel


class CarbonRAGClient:
    """
    Client pour interroger le service Carbon Data RAG
    
    Usage dans un agent :
        rag_client = CarbonRAGClient()
        factors = rag_client.query("voiture électrique")
        result = rag_client.calculate("vol Paris-Londres", distance_km=350)
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Args:
            base_url: URL du service carbon-data-rag
        """
        self.base_url = base_url.rstrip("/")
        self._check_health()
    
    def _check_health(self):
        """Vérifie que le service est accessible"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            response.raise_for_status()
        except Exception as e:
            raise ConnectionError(
                f"Service carbon-data-rag inaccessible à {self.base_url}\n"
                f"Erreur : {e}\n"
                f"Assurez-vous que le service est lancé : fastapi dev src/api.py"
            )
    
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
            query: Requête en langage naturel
            top_k: Nombre de résultats
            category_filter: Filtrer par catégorie (transport, energy, electricity, etc.)
            min_similarity: Score minimum de similarité (0-1)
        
        Returns:
            Liste de facteurs avec métadonnées et scores de similarité
        """
        response = requests.post(
            f"{self.base_url}/query",
            json={
                "query": query,
                "top_k": top_k,
                "category_filter": category_filter,
                "min_similarity": min_similarity
            },
            timeout=10
        )
        response.raise_for_status()
        return response.json()["results"]
    
    def calculate(
        self,
        query: str,
        value: float,
        top_k: int = 3
    ) -> Dict:
        """
        Recherche de facteur + calcul d'émissions
        
        Args:
            query: Description de l'activité
            value: Quantité (km, kWh, kg...)
            top_k: Nombre de facteurs à considérer
        
        Returns:
            Résultat avec émissions calculées et facteur utilisé
        """
        response = requests.post(
            f"{self.base_url}/calculate",
            json={
                "query": query,
                "value": value,
                "top_k": top_k
            },
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    
    def get_categories(self) -> List[str]:
        """Récupère les catégories disponibles"""
        response = requests.get(f"{self.base_url}/categories", timeout=5)
        response.raise_for_status()
        return response.json()["categories"]
    
    def get_stats(self) -> Dict:
        """Récupère les statistiques de la base"""
        response = requests.get(f"{self.base_url}/stats", timeout=5)
        response.raise_for_status()
        return response.json()


# Exemple d'intégration dans un agent OpenAI

def example_agent_with_rag():
    """
    Exemple d'agent conversationnel utilisant le RAG carbon
    """
    from openai import OpenAI
    import json
    
    # Initialiser clients
    openai_client = OpenAI()  # Nécessite OPENAI_API_KEY
    carbon_rag = CarbonRAGClient()
    
    # Définir la fonction tool pour OpenAI
    tools = [{
        "type": "function",
        "function": {
            "name": "calculate_carbon_emissions",
            "description": "Calcule les émissions CO2 d'une activité en interrogeant la base RAG de facteurs d'émission",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity_description": {
                        "type": "string",
                        "description": "Description de l'activité (ex: 'trajet en voiture électrique', 'vol domestique')"
                    },
                    "value": {
                        "type": "number",
                        "description": "Quantité (distance en km, énergie en kWh, etc.)"
                    }
                },
                "required": ["activity_description", "value"]
            }
        }
    }]
    
    # Conversation
    messages = [
        {
            "role": "system",
            "content": """Tu es un assistant qui aide à calculer l'empreinte carbone.
            
            Tu as accès à une base de données RAG de facteurs d'émission DEFRA 2024.
            Pose des questions pour obtenir :
            - La description de l'activité
            - La quantité (distance, énergie, poids...)
            
            Quand tu as ces infos, appelle calculate_carbon_emissions."""
        },
        {
            "role": "user",
            "content": "Je veux calculer l'empreinte de mon trajet en voiture électrique, 150 km"
        }
    ]
    
    # Appel OpenAI
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools
    )
    
    choice = response.choices[0]
    
    # Si OpenAI appelle la fonction
    if choice.message.tool_calls:
        tool_call = choice.message.tool_calls[0]
        args = json.loads(tool_call.function.arguments)
        
        # Interroger le RAG (pas d'appel externe pour les facteurs !)
        result = carbon_rag.calculate(
            query=args["activity_description"],
            value=args["value"]
        )
        
        print(f"✅ Résultat : {result['co2e_kg']} kg CO2e")
        print(f"📊 Facteur utilisé : {result['factor_used']['description']}")
        print(f"   {result['factor_used']['factor']} {result['factor_used']['unit']}")
        
        return result
    
    print(choice.message.content)


# Exemple d'intégration dans un agent ElevenLabs

def example_elevenlabs_agent():
    """
    Exemple de configuration pour agent vocal ElevenLabs
    """
    carbon_rag = CarbonRAGClient()
    
    # Configuration agent ElevenLabs (à mettre dans leur dashboard)
    agent_config = {
        "name": "Carbon Calculator Agent",
        "prompt": """Tu es un assistant vocal qui aide à calculer l'empreinte carbone.
        
        Collecte ces informations :
        - Type d'activité (transport, électricité, etc.)
        - Description précise (voiture électrique, vol court-courrier...)
        - Quantité (distance en km, énergie en kWh...)
        
        Quand tu as ces infos, appelle la fonction calculate_carbon.""",
        
        "client_tools": [
            {
                "name": "calculate_carbon",
                "description": "Calcule les émissions CO2 d'une activité",
                "parameters": {
                    "activity_description": "string",
                    "value": "number"
                }
            }
        ]
    }
    
    # Fonction côté client (JavaScript pour ElevenLabs React SDK)
    client_tool_implementation = """
    async function calculate_carbon({ activity_description, value }) {
        const response = await fetch('http://localhost:8000/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: activity_description,
                value: value,
                top_k: 3
            })
        });
        
        const result = await response.json();
        
        return {
            success: true,
            co2e_kg: result.co2e_kg,
            message: `Vos émissions sont de ${result.co2e_kg} kg de CO2. ${
                result.equivalents.car_km_average
            } km en voiture moyenne.`
        };
    }
    """
    
    print("Configuration agent ElevenLabs :")
    print(json.dumps(agent_config, indent=2))
    print("\nImplémentation client tool :")
    print(client_tool_implementation)


# Tests unitaires du client

def test_carbon_rag_client():
    """Tests du client RAG"""
    print("\n" + "="*80)
    print("  Tests Carbon RAG Client")
    print("="*80 + "\n")
    
    try:
        client = CarbonRAGClient()
        print("✅ Connexion au service établie\n")
        
        # Test 1 : Recherche de facteurs
        print("Test 1 : Recherche de facteurs")
        factors = client.query("voiture électrique", top_k=3)
        print(f"  Trouvé {len(factors)} facteurs :")
        for i, f in enumerate(factors, 1):
            print(f"    {i}. {f['description']}")
            print(f"       {f['factor']} {f['unit']} (similarité: {f['similarity_score']})")
        
        # Test 2 : Calcul d'émissions
        print("\nTest 2 : Calcul d'émissions")
        result = client.calculate("trajet en voiture électrique", value=100)
        print(f"  Émissions : {result['co2e_kg']} kg CO2e")
        print(f"  Facteur : {result['factor_used']['description']}")
        print(f"  Équivalent : {result['equivalents']['car_km_average']} km voiture moyenne")
        
        # Test 3 : Catégories
        print("\nTest 3 : Catégories disponibles")
        categories = client.get_categories()
        print(f"  {len(categories)} catégories : {', '.join(categories)}")
        
        # Test 4 : Statistiques
        print("\nTest 4 : Statistiques")
        stats = client.get_stats()
        print(f"  Total facteurs : {stats['total_factors']}")
        print(f"  Source : {stats['source']}")
        
        print("\n" + "="*80)
        print("✅ Tous les tests passés !")
        print("="*80 + "\n")
        
    except ConnectionError as e:
        print(f"❌ {e}")
    except Exception as e:
        print(f"❌ Erreur : {e}")


if __name__ == "__main__":
    # Exécuter les tests
    test_carbon_rag_client()
    
    # Décommenter pour tester les exemples d'agents
    # example_agent_with_rag()
    # example_elevenlabs_agent()
