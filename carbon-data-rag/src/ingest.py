"""
Ingestion DEFRA 2024 → ChromaDB

Parse le fichier Excel DEFRA, structure les facteurs d'émission en documents,
et les vectorise dans ChromaDB pour recherche sémantique.

Usage:
    python ingest.py
"""

import sys
import io
import os

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Disable ChromaDB telemetry before import to avoid errors
os.environ['ANONYMIZED_TELEMETRY'] = 'False'

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
        
        # Initialiser ChromaDB en mode persistent (disable telemetry to avoid errors)
        self.chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Créer ou récupérer la collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="carbon_factors",
            metadata={"description": "DEFRA 2024 emission factors"}
        )
        
        print(f"✅ Collection 'carbon_factors' prête ({self.collection.count()} documents)")
    
    def parse_defra_flat_format(self, df: pd.DataFrame) -> List[Dict]:
        """
        Parse the flat format DEFRA file and extract structured emission factors

        Args:
            df: DataFrame from the "Factors by Category" sheet

        Returns:
            List of documents with: text, metadata, id
        """
        documents = []

        # Column names: ID, Scope, Level 1, Level 2, Level 3, Level 4, Column Text, UOM, GHG/Unit, GHG Conversion Factor 2024

        for idx, row in df.iterrows():
            # Get the emission factor value
            factor_value = row.get('GHG Conversion Factor 2024')

            # Skip if no value or zero
            if pd.isna(factor_value) or factor_value == 0:
                continue

            # Extract category and description components
            level1 = row.get('Level 1', '')
            level2 = row.get('Level 2', '')
            level3 = row.get('Level 3', '')
            level4 = row.get('Level 4', '')
            column_text = row.get('Column Text', '')
            ghg_unit = row.get('GHG/Unit', '')

            # Build description from available levels
            desc_parts = []
            for part in [level1, level2, level3, level4, column_text]:
                if pd.notna(part) and str(part).strip():
                    desc_parts.append(str(part).strip())

            description = " - ".join(desc_parts) if desc_parts else "Emission factor"

            # Get the unit
            unit = row.get('UOM', 'per unit')
            if pd.isna(unit):
                unit = 'per unit'

            # Get scope and category
            scope = row.get('Scope', '')
            category = str(level1).lower() if pd.notna(level1) else 'other'

            # Create document text for RAG
            text = f"""
            Category: {category}
            Scope: {scope}
            Description: {description}
            Factor: {factor_value} kg CO2e per {unit}
            Type: {ghg_unit if pd.notna(ghg_unit) else 'Total GHG'}
            """

            # Structured metadata for filtering and retrieval
            metadata = {
                "category": category,
                "scope": str(scope),
                "description": description,
                "factor": float(factor_value),
                "unit": str(unit),
                "ghg_type": str(ghg_unit) if pd.notna(ghg_unit) else "kg CO2e",
                "source": "DEFRA 2024",
                "level1": str(level1) if pd.notna(level1) else "",
                "level2": str(level2) if pd.notna(level2) else "",
                "level3": str(level3) if pd.notna(level3) else "",
            }

            # Create unique ID
            doc_id = row.get('ID', f'defra_{idx}')

            documents.append({
                "id": str(doc_id),
                "text": text.strip(),
                "metadata": metadata
            })

        return documents
    
    def ingest_defra(self):
        """Parse the DEFRA file and ingest into ChromaDB"""

        if not DEFRA_FILE.exists():
            print(f"❌ DEFRA file not found: {DEFRA_FILE}")
            print("\n📥 Download it from:")
            print("https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024")
            print(f"→ Save it as: {DEFRA_FILE}")
            return False

        print(f"\n📖 Reading DEFRA file: {DEFRA_FILE}")

        try:
            # Read the flat format file
            # The header is on row 6 (0-indexed row 5), so skip the first 5 rows
            print("  🔄 Processing 'Factors by Category' sheet...")
            df = pd.read_excel(DEFRA_FILE, sheet_name='Factors by Category', skiprows=5)

            print(f"     ✅ Loaded {len(df)} rows from Excel")

            # Parse all emission factors
            all_documents = self.parse_defra_flat_format(df)

            if not all_documents:
                print("\n❌ No documents extracted!")
                return False

            print(f"\n📊 Total: {len(all_documents)} emission factors extracted")

        except Exception as e:
            print(f"\n❌ Error reading DEFRA file: {e}")
            import traceback
            traceback.print_exc()
            return False
        
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
