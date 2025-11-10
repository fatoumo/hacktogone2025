
# Intégration ClickUp (guide rapide)

L'idée : envoyer la fiche profil / synthèse vers ClickUp (task ou custom fields) pour suivi.

1) Créer une liste / dossier "Diagnostics Carbone" dans votre espace ClickUp.
2) Fields recommandés : `activity_type`, `employees`, `workplace`, `global_score` (number), `numérique_score`, `transport_score`, `énergie_score`, `achats_score`.
3) Exemple de payload pour créer une tâche via l'API ClickUp (PATCH/POST) :

POST https://api.clickup.com/api/v2/list/{list_id}/task
Headers:
  Authorization: YOUR_CLICKUP_TOKEN
  Content-Type: application/json

Body:
{
  "name": "Diagnostic - {company_name}",
  "description": "Synthèse générée par l'agent Accueil",
  "custom_fields": [
    {"id": "cf_activity", "value": "services numériques"},
    {"id": "cf_employees", "value": 5},
    {"id": "cf_global_score", "value": 35}
  ]
}

4) Automatisations : utiliser les valeurs de `global_score` pour déclencher une checklist "Actions recommandées".
