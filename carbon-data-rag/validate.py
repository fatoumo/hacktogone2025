#!/usr/bin/env python3
"""
Script de validation du module carbon-data-rag

Vérifie que tout est correctement installé et configuré avant utilisation.

Usage:
    python validate.py
"""

import sys
from pathlib import Path
import subprocess

def check_structure():
    """Vérifie la structure des dossiers"""
    print("📁 Vérification de la structure...")
    
    required_dirs = [
        "data",
        "src",
        "examples",
        "tests"
    ]
    
    required_files = [
        "requirements.txt",
        "README.md",
        "QUICKSTART.md",
        "WHY_RAG.md",
        "src/__init__.py",
        "src/ingest.py",
        "src/rag_service.py",
        "src/api.py",
        "examples/agent_client.py",
        "tests/test_rag.py"
    ]
    
    all_ok = True
    
    for dir_name in required_dirs:
        if Path(dir_name).exists():
            print(f"  ✅ {dir_name}/")
        else:
            print(f"  ❌ {dir_name}/ MANQUANT")
            all_ok = False
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} MANQUANT")
            all_ok = False
    
    return all_ok

def check_dependencies():
    """Vérifie que les dépendances sont installables"""
    print("\n📦 Vérification des dépendances...")
    
    try:
        import chromadb
        print("  ✅ chromadb")
    except ImportError:
        print("  ❌ chromadb (pip install chromadb==0.4.22)")
        return False
    
    try:
        import sentence_transformers
        print("  ✅ sentence-transformers")
    except ImportError:
        print("  ❌ sentence-transformers (pip install sentence-transformers==2.3.1)")
        return False
    
    try:
        import pandas
        print("  ✅ pandas")
    except ImportError:
        print("  ❌ pandas (pip install pandas==2.1.4)")
        return False
    
    try:
        import fastapi
        print("  ✅ fastapi")
    except ImportError:
        print("  ❌ fastapi (pip install fastapi==0.109.0)")
        return False
    
    try:
        import uvicorn
        print("  ✅ uvicorn")
    except ImportError:
        print("  ❌ uvicorn (pip install uvicorn[standard]==0.27.0)")
        return False
    
    return True

def check_chroma_path():
    """Vérifie le chemin ChromaDB"""
    print("\n💾 Vérification ChromaDB...")
    
    chroma_dir = Path("data/chroma_db")
    
    if not chroma_dir.exists():
        print(f"  ⚠️  ChromaDB non créée (normal avant ingestion)")
        print(f"     Chemin: {chroma_dir.absolute()}")
        return "warning"
    else:
        print(f"  ✅ Répertoire ChromaDB existe")
        
        # Vérifier si des données existent
        if (chroma_dir / "chroma.sqlite3").exists():
            print(f"  ✅ Base de données ChromaDB trouvée")
            return True
        else:
            print(f"  ⚠️  Répertoire vide (lancer ingestion)")
            return "warning"

def check_defra_data():
    """Vérifie la présence du fichier DEFRA"""
    print("\n📄 Vérification données DEFRA...")
    
    defra_file = Path("data/defra_2024.xlsx")
    
    if defra_file.exists():
        print(f"  ✅ Fichier DEFRA trouvé")
        print(f"     Taille: {defra_file.stat().st_size / 1024 / 1024:.1f} MB")
        return True
    else:
        print(f"  ⚠️  Fichier DEFRA manquant (téléchargement manuel requis)")
        print(f"     Attendu: {defra_file.absolute()}")
        return "warning"

def run_tests():
    """Lance les tests si ChromaDB existe"""
    print("\n🧪 Lancement des tests...")
    
    chroma_db = Path("data/chroma_db/chroma.sqlite3")
    
    if not chroma_db.exists():
        print("  ⏭️  Tests skippés (ChromaDB non peuplée)")
        return "skip"
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "tests/test_rag.py", "-v"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            # Compter les tests passés
            passed = result.stdout.count(" PASSED")
            print(f"  ✅ Tests unitaires OK ({passed} tests)")
            return True
        else:
            print(f"  ❌ Certains tests ont échoué")
            print(result.stdout[-500:])  # Afficher dernières lignes
            return False
            
    except FileNotFoundError:
        print("  ⚠️  pytest non installé (pip install pytest)")
        return "warning"
    except Exception as e:
        print(f"  ⚠️  Erreur lors des tests: {e}")
        return "warning"

def main():
    """Validation complète"""
    
    print("=" * 80)
    print("  🔍 Validation carbon-data-rag")
    print("=" * 80)
    
    results = {
        "structure": check_structure(),
        "dependencies": check_dependencies(),
        "chroma_path": check_chroma_path(),
        "defra_data": check_defra_data(),
        "tests": run_tests()
    }
    
    print("\n" + "=" * 80)
    print("  📊 Résumé")
    print("=" * 80)
    
    # Compter statuts
    ok_count = sum(1 for v in results.values() if v is True)
    warning_count = sum(1 for v in results.values() if v == "warning" or v == "skip")
    error_count = sum(1 for v in results.values() if v is False)
    
    print(f"\n✅ OK: {ok_count}")
    print(f"⚠️  Warnings: {warning_count}")
    print(f"❌ Erreurs: {error_count}")
    
    if error_count > 0:
        print("\n❌ Module non prêt - corriger les erreurs ci-dessus")
        sys.exit(1)
    
    if warning_count > 0 and results["defra_data"] == "warning":
        print("\n⚠️  Module structuré, mais données manquantes")
        print("\n📥 Prochaine étape : Télécharger DEFRA 2024")
        print("   URL: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024")
        print("   → Cliquez sur 'Flat file set 2024 (XLSX)'")
        print(f"   → Sauvegardez dans : {Path('data/defra_2024.xlsx').absolute()}")
        print("\n🚀 Puis lancer : python src/ingest.py")
    
    elif warning_count > 0 and results["chroma_path"] == "warning":
        print("\n⚠️  Données DEFRA présentes, mais pas encore ingérées")
        print("\n🚀 Prochaine étape : Ingestion")
        print("   $ python src/ingest.py")
    
    else:
        print("\n🎉 Module carbon-data-rag prêt !")
        print("\n🚀 Commandes utiles :")
        print("   - Lancer API      : fastapi dev src/api.py")
        print("   - Tester client   : python examples/agent_client.py")
        print("   - Tests unitaires : pytest tests/test_rag.py -v")


if __name__ == "__main__":
    main()
