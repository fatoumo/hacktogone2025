
# ElevenLabs Agent — "Accueil" (Projet exécutable)

Ce projet contient un agent "Accueil" prêt à être exécuté localement en Python.  
Il sert d'exemple complet pour démarrer un assistant conversationnel qui :
- Identifie le type d'activité d'une TPE/PME,
- Pose les premières questions,
- Prépare une fiche profil simple et un score carbone indicatif.

**Contenu du zip**
- `main.py` : script principal (CLI) qui orchestre le dialogue et appelle l'API ElevenLabs (placeholder).
- `agent_prompt.txt` : prompt système complet et flow de questions (version lisible).
- `config.yaml` : configuration (endpoints, modèle, options).
- `kb.json` : base de connaissances minimale (secteurs, indicateurs, règles de score).
- `clickup_integration.md` : guide d'intégration et exemple de payload pour ClickUp.
- `README.md` : ce fichier.
- `requirements.txt` : packages Python nécessaires.
- `.env.example` : exemple de fichier d'environnement pour la clé API.
- `utils.py` : utilitaires (chargement config, scoring).
- `example_responses.json` : exemple de sortie après un run de démonstration.

## Exécution rapide
1. Copier `.env.example` en `.env` et compléter `ELEVENLABS_API_KEY`.
2. (Optionnel) créer un virtualenv et installer : `pip install -r requirements.txt`
3. Lancer : `python main.py --demo` pour un run de démonstration ou `python main.py` pour dialoguer.

> **Important** : Le code inclut un *placeholder* d'appel HTTP à ElevenLabs. Remplacez l'URL et la logique dans `send_to_elevenlabs()` par les endpoints / SDK ElevenLabs que vous utilisez (text-generation / voice / agents selon votre subscription).

