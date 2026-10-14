// node verif/generer.test.js  → génère des CRA de test dans verif/sortie/
const fs = require('fs'), path = require('path'), assert = require('assert');
const JSZip = require('jszip');
const Cra = require('../web/cra-xlsx.js');

const tpl = fs.readFileSync(path.join(__dirname, '../web/modele/CRA_izencia.xlsx'));
const out = path.join(__dirname, 'sortie'); fs.mkdirSync(out, { recursive: true });

// fériés : contrôle sur la table du fichier Izencia (2025 et 2026)
const h26 = [...Cra.holidays(2026).keys()];
assert.deepStrictEqual(h26, ['1-1', '4-6', '5-1', '5-8', '5-14', '5-25', '7-14', '8-15', '11-1', '11-11', '12-25']);
const h25 = [...Cra.holidays(2025).keys()];
assert.deepStrictEqual(h25, ['1-1', '4-21', '5-1', '5-8', '5-29', '6-9', '7-14', '8-15', '11-1', '11-11', '12-25']);

function mois(y, m) {
  const days = {}, H = Cra.holidays(y);
  for (let d = 1; d <= Cra.daysInMonth(y, m); d++) {
    const wd = Cra.weekday(y, m, d);
    if (wd !== 1 && wd !== 7 && !H.has(m + '-' + d)) days[d] = { w: 1 };
  }
  return days;
}

(async () => {
  // Septembre 2026 : CP le 7, demi-journée + demi CP le 15, maladie le 22, HS le 10
  const days = mois(2026, 9);
  days[7] = { cp: 1 };
  days[15] = { w: 0.5, cp: 0.5, com: 'Après-midi en congé' };
  days[22] = { mal: 1 };
  days[10] = { w: 1, hj: 2, hn: 1.5, com: 'Mise en prod 20h-23h30 $1 $& test' };
  const sig = fs.existsSync(path.join(__dirname, 'signature-test.png')) ? fs.readFileSync(path.join(__dirname, 'signature-test.png')) : null;
  const buf = await Cra.build({ template: tpl, JSZip, year: 2026, month: 9, technicien: 'Tertereau Olivier', client: 'Sopra Steria projet BNPP', days, signature: sig, signatureSize: { w: 600, h: 200 } });
  fs.writeFileSync(path.join(out, 'CRA_2026-09.xlsx'), buf);

  // Février 2027 (28 jours, année hors table Izencia) sans signature
  const b2 = await Cra.build({ template: tpl, JSZip, year: 2027, month: 2, technicien: 'Test', client: 'Client', days: mois(2027, 2) });
  fs.writeFileSync(path.join(out, 'CRA_2027-02.xlsx'), b2);
  const b3 = await Cra.build({ template: tpl, JSZip, year: 2027, month: 5, technicien: 'Test', client: 'Client', days: mois(2027, 5) });
  fs.writeFileSync(path.join(out, 'CRA_2027-05.xlsx'), b3);
  const b4 = await Cra.build({ template: tpl, JSZip, year: 2026, month: 11, technicien: 'Test', client: 'Client', days: mois(2026, 11) });
  fs.writeFileSync(path.join(out, 'CRA_2026-11.xlsx'), b4);
  console.log('OK générateur — fichiers dans verif/sortie');
})().catch((e) => { console.error(e); process.exit(1); });
