"""Test de bout en bout de l'envoi Gmail, avec Google et Gmail simulés.
  python3 verif/gmail_test.py   (app servie sous http://localhost:8765/CRA/)"""
import os, sys, json, base64, email, io, openpyxl
from email import policy
from urllib.parse import urlparse, parse_qs, quote
from playwright.sync_api import sync_playwright
URL = os.environ.get('CRA_URL', 'http://localhost:8765/CRA/')
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
errs, auths, sends = [], [], []
gmail_status = [200]  # file des réponses Gmail à renvoyer

def on_auth(route):
    q = parse_qs(urlparse(route.request.url).query)
    auths.append(q)
    loc = q['redirect_uri'][0] + '#state=' + q['state'][0] + '&access_token=ya29.test' + str(len(auths)) + \
        '&token_type=Bearer&expires_in=3599&scope=' + quote('https://www.googleapis.com/auth/gmail.send')
    route.fulfill(status=302, headers={'location': loc})

CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,OPTIONS'}
def on_gmail(route):
    if route.request.method == 'OPTIONS': return route.fulfill(status=204, headers=CORS)
    st = gmail_status.pop(0) if gmail_status else 200
    sends.append({'status': st, 'auth': route.request.headers.get('authorization'), 'body': route.request.post_data})
    if st == 200: route.fulfill(status=200, headers=CORS, content_type='application/json', body='{"id":"m%d"}' % len(sends))
    else: route.fulfill(status=st, headers=CORS, content_type='application/json', body='{"error":{"message":"simulé"}}')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None)
    ctx = b.new_context(service_workers='block', viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.route('**/config.js', lambda r: r.fulfill(content_type='application/javascript', body="window.CRA_CONFIG={googleClientId:'test.apps.googleusercontent.com'};"))
    ctx.route('https://accounts.google.com/**', on_auth)
    ctx.route('https://gmail.googleapis.com/**', on_gmail)
    page = ctx.new_page()
    page.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text and '401' not in m.text and '500' not in m.text and '403' not in m.text and errs.append(m.text))
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(URL); page.wait_for_timeout(600)
    page.fill('#sNom', 'Tertereau Olivier'); page.fill('#sClient', 'Sopra Steria projet BNPP')
    page.fill('#sTo', 'paie@izencia.fr'); page.fill('#sCc', 'olivier@gmail.com')
    page.click('#setSheet .btn-done')
    for _ in range(3):
        if page.text_content('#monthName') == 'septembre': break
        page.click('#prev'); page.wait_for_timeout(50)
    month = page.text_content('#monthName')
    page.locator('#grid .day:not(.blank)').nth(6).click(); page.click('#presets [data-p=cp1]'); page.click('#daySheet .btn-done')

    # 1) première fois : connexion Google puis envoi
    page.click('#send'); page.wait_for_selector('#sendGmail:visible')
    page.screenshot(path='verif/sortie/gmail-choix.png')
    page.click('#sendGmail')
    page.wait_for_selector('#sendSheet[data-mode=sent]', timeout=8000)
    page.screenshot(path='verif/sortie/gmail-envoye.png')
    assert len(auths) == 1 and len(sends) == 1
    a = auths[0]
    assert a['redirect_uri'] == [URL] and a['response_type'] == ['token']
    assert a['client_id'] == ['test.apps.googleusercontent.com'] and a['scope'] == ['https://www.googleapis.com/auth/gmail.send']
    assert sends[0]['auth'] == 'Bearer ya29.test1'
    assert '#' not in page.url, 'jeton resté dans l\'adresse'
    assert page.text_content('#monthName') == month, 'mois perdu après connexion'
    raw = json.loads(sends[0]['body'])['raw']
    msg = email.message_from_bytes(base64.urlsafe_b64decode(raw + '=' * (-len(raw) % 4)), policy=policy.default)
    assert msg['To'] == 'paie@izencia.fr' and msg['Cc'] == 'olivier@gmail.com', (msg['To'], msg['Cc'])
    assert str(msg['Subject']) == 'CRA %s 2026 – Tertereau Olivier' % month, str(msg['Subject'])
    att = list(msg.iter_attachments())[0]
    assert att.get_filename() == 'CRA_izencia_2026-09_Tertereau_Olivier.xlsx'
    ws = openpyxl.load_workbook(io.BytesIO(att.get_content()))['Technicien']
    assert ws['B2'].value == 9 and ws['C12'].value == 1 and ws['C1'].value == 'TERTEREAU OLIVIER'
    page.click('#sendSheet .m-sent .btn-done')
    assert page.text_content('.btn-send span') == 'Renvoyer le CRA'

    # 2) jeton refusé (401) : reconnexion automatique puis envoi réussi
    gmail_status[:] = [401, 200]
    page.click('#send'); page.wait_for_selector('#sendGmail:visible'); page.click('#sendGmail')
    page.wait_for_selector('#sendSheet[data-mode=sent]', timeout=8000)
    assert len(auths) == 2 and len(sends) == 3 and sends[2]['auth'] == 'Bearer ya29.test2'
    page.click('#sendSheet .m-sent .btn-done')

    # 3) erreur Gmail : message clair, rien d'envoyé, retour au choix
    gmail_status[:] = [500]
    page.click('#send'); page.wait_for_selector('#sendGmail:visible'); page.click('#sendGmail')
    page.wait_for_selector('#sendSheet[data-mode=choose] #sendWarn:visible', timeout=8000)
    w = page.text_content('#sendWarn'); assert 'incertain' in w and '500' in w, w
    page.screenshot(path='verif/sortie/gmail-erreur.png')
    # 3b) refus Google (403) : certain que rien n'est parti
    gmail_status[:] = [403]
    page.click('#sendSheet .sheet-back', position={'x': 195, 'y': 40})
    page.click('#send'); page.wait_for_selector('#sendGmail:visible'); page.click('#sendGmail')
    page.wait_for_selector('#sendSheet[data-mode=choose] #sendWarn:visible', timeout=8000)
    w = page.text_content('#sendWarn'); assert 'Rien n\'a été envoyé' in w and 'refuse' in w, w
    assert len(auths) == 2

    # 4) adresse invalide : bloqué avant toute connexion
    page.click('#sendSheet .sheet-back', position={'x': 195, 'y': 40})
    page.click('#openSettings'); page.fill('#sTo', 'paie@izencia'); page.click('#setSheet .btn-done')
    page.click('#send'); page.wait_for_timeout(300)
    assert page.is_visible('#setSheet') and not page.is_visible('#sendSheet')
    b.close()

if errs: print('Erreurs console :', errs); sys.exit(1)
print('OK gmail : connexion, envoi, pièce jointe, reconnexion 401, erreurs 500/403, adresse invalide')
