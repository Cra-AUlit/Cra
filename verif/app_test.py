"""Test de bout en bout de la PWA (Chromium headless, écran de téléphone).
Pré-requis : servir le dossier parent de web/ sous /CRA/ sur le port 8765.
  python3 verif/app_test.py"""
import os, sys, openpyxl
from playwright.sync_api import sync_playwright
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, 'sortie'); os.makedirs(OUT, exist_ok=True)
URL = os.environ.get('CRA_URL', 'http://localhost:8765/CRA/')
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
errs = []

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None)
    ctx = b.new_context(service_workers='block', viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True, accept_downloads=True)
    ctx.add_init_script("Date.now=(()=>{const n=Date.now;return()=>n()})();")
    page = ctx.new_page()
    page.on('console', lambda m: m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text and errs.append(m.text))
    page.on('pageerror', lambda e: errs.append(str(e)))

    # 1er lancement : les réglages s'ouvrent
    page.goto(URL); page.wait_for_timeout(700)
    assert page.is_visible('#setSheet'), 'réglages non ouverts au 1er lancement'
    page.screenshot(path=os.path.join(OUT, 'app-reglages.png'))
    page.fill('#sNom', 'Tertereau Olivier'); page.fill('#sClient', 'Sopra Steria projet BNPP'); page.fill('#sTo', 'paie@exemple.fr')
    page.click('#setSheet .btn-done')

    # aller en septembre 2026 (aujourd'hui = octobre 2026 en test réel, sinon on navigue)
    for _ in range(24):
        if page.text_content('#monthName') == 'septembre' and page.inner_text('#monthYear') == '2026': break
        page.click('#prev'); page.wait_for_timeout(50)
    days = page.locator('#grid .day:not(.blank)')
    assert days.count() == 30
    assert page.inner_text('#tWork') == '22', page.inner_text('#tWork')

    # 7 sept : congé ; 15 : ½ + ½ CP + commentaire ; 10 : HS
    days.nth(6).click(); page.click('#presets [data-p=cp1]'); page.click('#daySheet .btn-done')
    days.nth(14).click(); page.click('#presets [data-p=cp05]'); page.fill('#dayCom', 'Après-midi en congé'); page.click('#daySheet .btn-done')
    days.nth(9).click()
    page.click('.stepper[data-k=hj] [data-d="0.5"]'); page.click('.stepper[data-k=hj] [data-d="0.5"]'); page.click('.stepper[data-k=hn] [data-d="0.5"]')
    page.screenshot(path=os.path.join(OUT, 'app-jour.png'))
    page.click('#daySheet .btn-done')
    assert page.inner_text('#tWork') == '20,5', page.inner_text('#tWork')
    assert page.inner_text('#tAbs') == '1,5'
    assert page.inner_text('#tHs') == '1,5'

    # fermeture / réouverture : tout est conservé
    page.reload(); page.wait_for_timeout(500)
    for _ in range(3):
        if page.text_content('#monthName') == 'septembre': break
        page.click('#prev'); page.wait_for_timeout(50)
    assert page.inner_text('#tWork') == '20,5', 'saisie perdue après fermeture'
    page.screenshot(path=os.path.join(OUT, 'app-mois.png'))

    # signature
    page.click('#openSig'); page.wait_for_timeout(300)
    box = page.locator('#pad').bounding_box()
    page.mouse.move(box['x'] + 40, box['y'] + 120); page.mouse.down()
    for i, (x, y) in enumerate([(80, 60), (120, 140), (170, 50), (230, 130), (300, 90)]):
        page.mouse.move(box['x'] + x, box['y'] + y, steps=6)
    page.mouse.up()
    page.screenshot(path=os.path.join(OUT, 'app-signature.png'))
    page.click('#sigOk')
    assert page.inner_text('#sigLabel') == 'Signé'

    # envoi → téléchargement du .xlsx
    page.click('#send'); page.wait_for_selector('#sendOther:visible')
    assert not page.is_visible('#sendGmail'), 'bouton Gmail visible sans ID client'
    with page.expect_download() as dl:
        page.click('#sendOther')
    f = dl.value; path = os.path.join(OUT, 'app-' + f.suggested_filename); f.save_as(path)
    page.wait_for_timeout(300)
    page.screenshot(path=os.path.join(OUT, 'app-envoi.png'))
    assert page.get_attribute('#sendSheet', 'data-mode') == 'other'
    assert f.suggested_filename == 'CRA_izencia_2026-09_Tertereau_Olivier.xlsx', f.suggested_filename
    b.close()

ws = openpyxl.load_workbook(path)['Technicien']
assert ws['C1'].value == 'TERTEREAU OLIVIER' and ws['B2'].value == 9 and ws['D2'].value == 2026
assert ws['C12'].value == 1 and ws['B20'].value == 0.5 and ws['C20'].value == 0.5 and ws['I20'].value == 'Après-midi en congé'
assert ws['G15'].value == 1 and ws['H15'].value == 0.5
assert len(ws._images) == 1
if errs: print('Erreurs console :', errs); sys.exit(1)
print('OK app : saisie, sauvegarde, signature, fichier envoyé conforme')
