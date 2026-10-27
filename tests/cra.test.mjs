// Tests de non-régression de CRA IZENCIA : node --test tests/   (aucune dépendance : JSZip est dans lib/)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const lire = f => readFileSync(join(racine, f), "utf8");
const JSZip = require("../lib/jszip.min.js");
const Xlsx = require("../cra-xlsx.js");
const Mail = require("../mail.js");

/* ---------- Jours fériés / calendrier ---------- */
test("jours fériés 2026 (Pâques le 5 avril)", () => {
  const h = Xlsx.holidays(2026);
  assert.equal(h.size, 11);
  assert.equal(h.get("4-6"), "Lundi de Pâques");
  assert.equal(h.get("5-14"), "Ascension");
  assert.equal(h.get("5-25"), "Lundi de Pentecôte");
  assert.equal(h.get("12-25"), "Noël");
});
test("jours du mois (février bissextile ou non)", () => {
  assert.equal(Xlsx.daysInMonth(2024, 2), 29);
  assert.equal(Xlsx.daysInMonth(2026, 2), 28);
  assert.equal(Xlsx.daysInMonth(2026, 10), 31);
});
test("jour de semaine façon Excel : dimanche = 1", () => {
  assert.equal(Xlsx.weekday(2026, 10, 25), 1);   // dimanche
  assert.equal(Xlsx.weekday(2026, 10, 27), 3);   // mardi
});

/* ---------- Génération du .xlsx ---------- */
async function generer(extra = {}) {
  const template = readFileSync(join(racine, "modele/CRA_izencia.xlsx"));
  const out = await Xlsx.build({ JSZip, template, year: 2026, month: 10, technicien: "Dupont Jean", client: "ACME & Fils",
    days: { 1: { w: 1, com: "Début <ok>" }, 2: { w: 0.5, cp: 0.5 }, 5: { mal: 1 }, 6: { hj: 2, hn: 1.5 } }, ...extra });
  const zip = await JSZip.loadAsync(out);
  return { zip, sheet: await zip.file("xl/worksheets/sheet1.xml").async("string") };
}
test("le .xlsx généré reste un classeur complet et recalculé à l'ouverture", async () => {
  const { zip } = await generer();
  for (const f of ["xl/workbook.xml", "xl/worksheets/sheet1.xml", "docProps/core.xml"]) assert.ok(zip.file(f), f);
  assert.match(await zip.file("xl/workbook.xml").async("string"), /fullCalcOnLoad="1"/);
});
test("les saisies sont écrites (texte échappé, totaux en cache)", async () => {
  const { sheet } = await generer();
  assert.match(sheet, /DUPONT JEAN/);
  assert.match(sheet, /ACME &amp; Fils/);
  assert.match(sheet, /Début &lt;ok&gt;/);
  assert.doesNotMatch(sheet, /Début <ok>/);
  assert.match(sheet, /<c r="B37"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1\.5<\/v>/);   // 1 + 0,5 jour travaillé
  assert.match(sheet, /<c r="G37"[^>]*>[\s\S]*?<v>3\.5<\/v>/);                 // HS jour 2 + nuit 1,5
});
test("un mois de 30 jours vide la ligne du 31", async () => {
  const { sheet } = await generer({ month: 11, days: { 31: { w: 1 } } });
  assert.match(sheet, /<c r="B36"[^>]*\/>|<c r="B36"[^>]*><v>0<\/v>|<c r="B36"[^>]*>(?!<v>1<\/v>)/);
  assert.doesNotMatch(sheet, /<c r="B36"[^>]*><v>1<\/v>/);
});

/* ---------- Mail ---------- */
test("adresses : séparateurs mixtes, invalides isolées", () => {
  const r = Mail.parseAddresses("a@x.fr; b@y.fr, pas-une-adresse  c@z.com");
  assert.deepEqual(r.list, ["a@x.fr", "b@y.fr", "c@z.com"]);
  assert.deepEqual(r.bad, ["pas-une-adresse"]);
});
test("MIME : ASCII pur, pièce jointe base64, nom de fichier assaini", () => {
  const data = Uint8Array.from([80, 75, 3, 4, 255, 0, 10]);
  const m = Mail.buildMime({ to: ["a@x.fr"], cc: ["b@y.fr"], subject: "CRA octobre é", body: "Bonjour\nà tous", filename: 'CRA "é" 10.xlsx', data });
  assert.match(m, /^To: a@x\.fr\r\nCc: b@y\.fr\r\nSubject: =\?UTF-8\?B\?/);
  assert.ok(/^[\x00-\x7F]*$/.test(m), "tout le message est en ASCII");
  assert.match(m, /filename="CRA_____10\.xlsx"/);
  assert.ok(m.includes(Buffer.from(data).toString("base64")));
});
test("URL OAuth : portée gmail.send seule, state transmis", () => {
  assert.equal(Mail.SCOPE, "https://www.googleapis.com/auth/gmail.send");
  const u = new URL(Mail.authUrl({ clientId: "id", redirectUri: "https://cra-aulit.github.io/Cra/", state: "abc" }));
  assert.equal(u.searchParams.get("scope"), Mail.SCOPE);
  assert.equal(u.searchParams.get("state"), "abc");
  assert.equal(u.searchParams.get("response_type"), "token");
});
test("retour OAuth : jeton lu, refus lu, bruit ignoré", () => {
  assert.deepEqual(Mail.parseReturn("#access_token=T&expires_in=3599&state=s&scope=x").token, "T");
  assert.equal(Mail.parseReturn("#access_token=T&expires_in=3599&state=s").expiresIn, 3599);
  assert.equal(Mail.parseReturn("#error=access_denied&state=s").error, "access_denied");
  assert.equal(Mail.parseReturn("#autre=1"), null);
  assert.equal(Mail.parseReturn(""), null);
});

/* ---------- Garde-fous du dépôt (voir PIEGES.md) ---------- */
test("config.js : aucun secret, seulement l'ID client public", () => {
  const c = lire("config.js");
  assert.doesNotMatch(c, /client_secret|GOCSPX|refresh_token/i);
});
test("service worker : tous les fichiers listés existent, cache limité au préfixe cra-", () => {
  const sw = lire("sw.js");
  const liste = [...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(liste.length > 20);
  for (const f of liste) assert.ok(f === "./" || existsSync(join(racine, f)), `fichier manquant : ${f}`);
  assert.match(sw, /const VERSION = 'cra-v\d+'/);
  assert.doesNotMatch(sw, /^(?!\s*\/\/).*[^.\w]caches\.match\(/m, "jamais de caches.match global (origine partagée)");
  assert.match(sw, /startsWith\('cra-'\)/);
});
test("index.html : scripts locaux existants, CSP sans script ni style en ligne", () => {
  const h = lire("index.html");
  for (const m of h.matchAll(/<script src="([^"]+)"/g)) assert.ok(existsSync(join(racine, m[1])), m[1]);
  const csp = h.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /style-src 'self'(;|$)/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  assert.match(csp, /font-src 'self'/);
  assert.doesNotMatch(h, /fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(h, /<[^>]+\sstyle="/, "pas d'attribut style en ligne");
});
test("pages annexes : noindex, liées au service worker, CSP sans script", () => {
  for (const f of ["index.html", "404.html", "conditions.html", "confidentialite.html", "mentions-legales.html"]) {
    assert.match(lire(f), /name="robots" content="noindex/, f);
  }
  for (const f of ["conditions.html", "confidentialite.html", "mentions-legales.html"]) {
    assert.match(lire(f), /default-src 'none'/, f);
    assert.doesNotMatch(lire(f), /<script/, f);
  }
});
test("404.html : chemins absolus /Cra/", () => {
  const h = lire("404.html");
  for (const m of h.matchAll(/(?:href|src)="([^"#]+)"/g)) if (!/^https?:/.test(m[1])) assert.match(m[1], /^\/Cra\//, m[1]);
});
test("manifest : icônes présentes, portée relative", () => {
  const mf = JSON.parse(lire("manifest.json"));
  for (const i of mf.icons) assert.ok(existsSync(join(racine, i.src)), i.src);
  assert.match(mf.start_url, /^\.|^[^/]/);
});
