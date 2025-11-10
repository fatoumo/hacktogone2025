
#!/usr/bin/env python3
"""main.py
Script CLI pour l'agent "Accueil".
- Lit le prompt
- Pose les questions (CLI)
- Calcule un score heuristique simple
- (Optionnel) envoie la synthèse à ElevenLabs via un endpoint configuré
"""
import os, json, argparse
from dotenv import load_dotenv
from utils import load_config, simple_score, send_to_elevenlabs

load_dotenv()
CONFIG = load_config("config.yaml")

QUESTIONS = [
    ("activity", "Quelle est votre activité principale ? (ex: services numériques, fabrication, commerce, transport, restauration, agriculture)"),
    ("workplace", "Avez-vous des locaux, un atelier, ou travaillez-vous principalement à distance ?"),
    ("employees", "Combien de personnes travaillent régulièrement pour l'entreprise ? (nombre)"),
    ("products", "Vendez-vous des produits physiques, des services, ou les deux ?"),
    ("clients_geo", "Vos clients sont principalement locaux, nationaux ou internationaux ?"),
    ("vehicles", "Utilisez-vous des véhicules pour votre activité (oui/non) ?"),
    ("machines", "Utilisez-vous des équipements énergivores (machines, réfrigération, serveurs) ?"),
    ("cloud", "Vos outils principaux sont-ils majoritairement en ligne (SaaS/cloud) ou locaux ?"),
    ("hosting", "Hébergez-vous des sites/données vous-même ou via un prestataire ?"),
    ("recond", "Utilisez-vous du matériel reconditionné ou neuf ? (reconditionné/majoritairement)"),
]

def run_interactive():
    print("\n=== Agent 'Accueil' — Diagnostic rapide carbone (indicatif) ===\n")
    answers = {}
    for key, q in QUESTIONS:
        a = input(q + " \n> ").strip()
        answers[key] = a
    # compute heuristic scores
    scores = simple_score(answers, CONFIG.get("scoring", {}))
    result = {
        "profile": answers,
        "scores": scores,
        "recommendations": []  # filled by rules (simple)
    }
    print("\n--- Synthèse (indicative) ---\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    # Optional: send to ElevenLabs (text-generation / TTS)
    if os.getenv("ELEVENLABS_API_KEY"):
        print("\nEnvoi de la synthèse à ElevenLabs (appel API placeholder)...\n")
        send_to_elevenlabs(result, CONFIG["elevenlabs"])
    else:
        print("\nPas de clé ELEVENLABS_API_KEY détectée. Pour tester l'envoi, renseignez .env\n")

def demo_run():
    demo_answers = {
        "activity":"services numériques",
        "workplace":"bureaux",
        "employees":"5",
        "products":"services",
        "clients_geo":"nationaux",
        "vehicles":"non",
        "machines":"non",
        "cloud":"cloud",
        "hosting":"prestataire",
        "recond":"non"
    }
    scores = simple_score(demo_answers, CONFIG.get("scoring", {}))
    result = {"profile": demo_answers, "scores": scores, "recommendations": []}
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if os.getenv("ELEVENLABS_API_KEY"):
        send_to_elevenlabs(result, CONFIG["elevenlabs"])
    else:
        print("\nDemo complete. Pas d'envoi (clé API absente).\n")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--demo', action='store_true', help='Run demo')
    args = parser.parse_args()
    if args.demo:
        demo_run()
    else:
        run_interactive()
