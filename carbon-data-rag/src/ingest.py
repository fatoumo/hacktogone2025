"""
Ingestion DEFRA 2024 → ChromaDB

Parse le fichier Excel DEFRA, structure les facteurs d'émission en documents,
et les vectorise dans ChromaDB pour recherche sémantique.

Usage:
    python ingest.py
"""

import pandas as pd
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pathlib import Path
from typing import List, Dict
import json
from tqdm import tqdm

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
DEFRA_FILE = DATA_DIR / "defra_2024.xlsx"
CHROMA_DIR = DATA_DIR / "chroma_db"

# Modèle d'embeddings local (gratuit, rapide, performant)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

class DEFRAIngester:
    """Parse et vectorise les données DEFRA dans ChromaDB"""
    
    def __init__(self):
        print("🚀 Initialisation DEFRAIngester...")
        
        # Créer répertoires si nécessaire
        DATA_DIR.mkdir(exist_ok=True)
        CHROMA_DIR.mkdir(exist_ok=True)
        
        # Charger le modèle d'embeddings
        print(f"📦 Chargement du modèle d'embeddings : {EMBEDDING_MODEL}")
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        
        # Initialiser ChromaDB en mode persistent
        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        
        # Créer ou récupérer la collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="carbon_factors",
            metadata={"description": "DEFRA 2024 emission factors"}
        )
        
        print(f"✅ Collection 'carbon_factors' prête ({self.collection.count()} documents)")
    
    def parse_defra_sheet(self, sheet_name: str, df: pd.DataFrame, category: str) -> List[Dict]:
        """
        Parse un onglet DEFRA et extrait les facteurs structurés
        
        Returns:
            Liste de documents avec: text, metadata, id
        """
        documents = []
        
        # Nettoyer les colonnes
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('(', '').str.replace(')', '')
        
        # Identifier la colonne du facteur CO2e (varie selon les onglets)
        co2e_columns = [col for col in df.columns if 'kg_co2e' in col or 'co2e' in col]
        if not co2e_columns:
            print(f"  ⚠️  Pas de colonne CO2e trouvée dans {sheet_name}")
            return documents
        
        main_co2e_col = co2e_columns[0]
        
        # Identifier colonnes descriptives
        desc_columns = [col for col in df.columns if 'level' in col or 'type' in col or 'description' in col]
        
        # Itérer sur les lignes
        for idx, row in df.iterrows():
            factor_value = row.get(main_co2e_col)
            
            # Skip si pas de valeur
            if pd.isna(factor_value) or factor_value == 0:
                continue
            
            # Construire la description textuelle
            desc_parts = []
            for col in desc_columns:
                val = row.get(col)
                if pd.notna(val) and str(val).strip():
                    desc_parts.append(str(val).strip())
            
            description = " - ".join(desc_parts) if desc_parts else f"{category} emission factor"
            
            # Identifier l'unité
            unit_columns = [col for col in df.columns if 'unit' in col]
            unit = row.get(unit_columns[0]) if unit_columns else "per unit"
            if pd.isna(unit):
                unit = "per unit"
            
            # Créer le document pour RAG
            text = f"""
            Category: {category}
            Description: {description}
            Factor: {factor_value} kg CO2e {unit}
            """
            
            # Métadonnées structurées pour filtrage et retour
            metadata = {
                "category": category,
                "description": description,
                "factor": float(factor_value),
                "unit": str(unit),
                "source": "DEFRA 2024",
                "sheet": sheet_name,
                "raw_data": json.dumps({k: str(v) for k, v in row.to_dict().items() if pd.notna(v)}, ensure_ascii=False)[:500]
            }
            
            doc_id = f"{category}_{sheet_name}_{idx}"
            
            documents.append({
                "id": doc_id,
                "text": text.strip(),
                "metadata": metadata
            })
        
        return documents
    
    def ingest_defra(self):
        """Parse complet du fichier DEFRA et ingestion dans ChromaDB"""
        
        if not DEFRA_FILE.exists():
            print(f"❌ Fichier DEFRA introuvable : {DEFRA_FILE}")
            print("\n📥 Téléchargez-le depuis :")
            print("https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024")
            print(f"→ Sauvegardez-le dans : {DEFRA_FILE}")
            return False
        
        print(f"\n📖 Lecture DEFRA : {DEFRA_FILE}")
        
        # Onglets à ingérer avec leurs catégories
        sheets_config = {
            'Passenger vehicles': 'transport',
            'Delivery vehicles': 'transport',
            'Flights': 'transport',
            'Rail': 'transport',
            'Sea': 'transport',
            'Fuels': 'energy',
            'Electricity': 'electricity',
            'Material waste': 'materials',
            'Water supply': 'water',
            'Water treatment': 'water'
        }
        
        all_documents = []
        
        for sheet_name, category in sheets_config.items():
            try:
                print(f"\n  🔄 Traitement : {sheet_name}")
                df = pd.read_excel(DEFRA_FILE, sheet_name=sheet_name, header=0)
                
                docs = self.parse_defra_sheet(sheet_name, df, category)
                all_documents.extend(docs)
                
                print(f"     ✅ {len(docs)} facteurs extraits")
                
            except Exception as e:
                print(f"     ⚠️  Erreur sur {sheet_name}: {e}")
                continue
        
        if not all_documents:
            print("\n❌ Aucun document extrait !")
            return False
        
        print(f"\n📊 Total : {len(all_documents)} facteurs d'émission extraits")
        
        # Vectorisation et ingestion dans ChromaDB
        print(f"\n🔮 Génération des embeddings ({EMBEDDING_MODEL})...")
        
        texts = [doc["text"] for doc in all_documents]
        ids = [doc["id"] for doc in all_documents]
        metadatas = [doc["metadata"] for doc in all_documents]
        
        print("  Embedding en cours...")
        embeddings = self.embedding_model.encode(texts, show_progress_bar=True, batch_size=32)
        
        print("\n💾 Ingestion dans ChromaDB...")
        
        BATCH_SIZE = 5000
        for i in range(0, len(all_documents), BATCH_SIZE):
            batch_end = min(i + BATCH_SIZE, len(all_documents))
            
            self.collection.add(
                ids=ids[i:batch_end],
                embeddings=embeddings[i:batch_end].tolist(),
                documents=texts[i:batch_end],
                metadatas=metadatas[i:batch_end]
            )
            
            print(f"  ✅ Batch {i//BATCH_SIZE + 1} ingéré ({batch_end}/{len(all_documents)})")
        
        print(f"\n🎉 Ingestion terminée ! {self.collection.count()} documents dans ChromaDB")
        print(f"📂 Base vectorielle : {CHROMA_DIR}")
        
        return True
    
    def test_retrieval(self):
        """Test rapide de récupération"""
        print("\n🧪 Test de récupération...")
        
        test_queries = [
            "émissions d'une voiture électrique",
            "electricity emissions in France",
            "vol court courrier avion"
        ]
        
        for query in test_queries:
            print(f"\n  Query: '{query}'")
            
            query_embedding = self.embedding_model.encode([query])[0]
            
            results = self.collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=2
            )
            
            if results['documents']:
                for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
                    print(f"    {i+1}. {metadata.get('description', 'N/A')}")
                    print(f"       Factor: {metadata.get('factor', 'N/A')} {metadata.get('unit', '')}")
                    print(f"       Category: {metadata.get('category', 'N/A')}")


def main():
    """Point d'entrée principal"""
    
    print("="*80)
    print("  DEFRA 2024 → ChromaDB Ingestion")
    print("="*80)
    
    ingester = DEFRAIngester()
    
    if ingester.collection.count() > 0:
        print(f"\n⚠️  La collection contient déjà {ingester.collection.count()} documents")
        response = input("Voulez-vous réingérer (écrase les données) ? (y/N): ")
        
        if response.lower() == 'y':
            print("🗑️  Suppression de la collection existante...")
            ingester.chroma_client.delete_collection("carbon_factors")
            ingester = DEFRAIngester()
        else:
            print("↪️  Passage au test de récupération...")
            ingester.test_retrieval()
            return
    
    success = ingester.ingest_defra()
    
    if success:
        ingester.test_retrieval()
        
        print("\n" + "="*80)
        print("✅ Module carbon-data-rag prêt !")
        print("="*80)
        print("\n🚀 Prochaine étape : lancer l'API")
        print("   $ fastapi dev src/api.py")
    else:
        print("\n❌ Échec de l'ingestion")


if __name__ == "__main__":
    main()
