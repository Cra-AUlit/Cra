"""python3 verif/horsligne_test.py — l'app installée fonctionne sans réseau (service worker)."""
import os, sys
from playwright.sync_api import sync_playwright
URL = os.environ.get('CRA_URL', 'http://localhost:8765/CRA/')
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, accept_downloads=True)
    page = ctx.new_page()
    page.goto(URL); page.wait_for_function('navigator.serviceWorker && navigator.serviceWorker.controller === null || true')
    page.evaluate('navigator.serviceWorker.ready'); page.reload(); page.wait_for_timeout(800)
    assert page.evaluate('!!navigator.serviceWorker.controller'), 'service worker inactif'
    keys = page.evaluate('caches.keys()'); assert 'cra-v2' in keys, keys
    page.fill('#sNom', 'Test Hors Ligne'); page.fill('#sTo', 'a@b.fr'); page.click('#setSheet .btn-done')
    ctx.set_offline(True)
    page.reload(); page.wait_for_timeout(800)
    assert page.text_content('#monthName'), 'app vide hors ligne'
    page.click('#send'); page.wait_for_selector('#sendOther:visible')
    with page.expect_download() as dl: page.click('#sendOther')
    assert dl.value.suggested_filename.endswith('_Test_Hors_Ligne.xlsx')
    b.close()
print('OK hors ligne : app et génération du fichier sans réseau')
