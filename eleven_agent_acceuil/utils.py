
# utils.py
import json, yaml, os, requests
from dotenv import load_dotenv
load_dotenv()

def load_config(path):
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def simple_score(answers, scoring_cfg):
    # Heuristic: assign sub-scores 0-100 for categories based on simple rules
    # This is intentionally approximate and illustrative.
    def score_numerique(ans):
        s = 50
        cloud = ans.get('cloud','').lower()
        if 'cloud' in cloud:
            s -= 10
        if 'local' in cloud:
            s += 10
        recond = ans.get('recond','').lower()
        if 'oui' in recond or 'recondition' in recond:
            s -= 15
        return max(0, min(100, s))
    def score_transport(ans):
        if ans.get('vehicles','').lower() in ['oui','yes','y']:
            return 60
        return 20
    def score_energie(ans):
        if ans.get('machines','').lower() in ['oui','yes','y']:
            return 70
        return 30
    def score_achats(ans):
        # products physical -> higher impact
        p = ans.get('products','').lower()
        if 'produit' in p:
            return 60
        return 20

    numerique = score_numerique(answers)
    transport = score_transport(answers)
    energie = score_energie(answers)
    achats = score_achats(answers)
    # Weighted global score
    weights = scoring_cfg.get('weights', {"numerique":0.25,"transport":0.25,"energie":0.25,"achats":0.25})
    global_score = int(round(numerique*weights.get('numerique',0.25) +
                             transport*weights.get('transport',0.25) +
                             energie*weights.get('energie',0.25) +
                             achats*weights.get('achats',0.25)))
    return {"numerique": numerique, "transport": transport, "energie": energie, "achats": achats, "global": global_score}

def send_to_elevenlabs(payload, cfg):
    """Placeholder send - make your own integration here.
    cfg contains 'api_url' and optional model info.
    """
    api_url = os.getenv('ELEVENLABS_API_URL', cfg.get('api_url'))
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        print('ELEVENLABS_API_KEY missing, skipping send.')
        return None
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    body = {
        'input': json.dumps(payload, ensure_ascii=False),
        'model': cfg.get('model','elevenlabs-small')
    }
    print(f"[DEBUG] Sending to ElevenLabs at {api_url} (placeholder)\nHeaders: {headers}\nBody sample keys: {list(body.keys())}")
    # Example HTTP call (commented out — enable if you adapt to real ElevenLabs API)
    # resp = requests.post(api_url, headers=headers, json=body, timeout=15)
    # print('ElevenLabs response:', resp.status_code, resp.text)
    return True
