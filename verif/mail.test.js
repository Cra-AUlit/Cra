// node verif/mail.test.js → vérifie le message MIME (lu ensuite par mail_check.py)
const fs = require('fs'), path = require('path'), assert = require('assert');
const M = require('../web/mail.js');
const a = M.parseAddresses('paie@izencia.fr; rh@izencia.fr , x');
assert.deepStrictEqual(a.list, ['paie@izencia.fr', 'rh@izencia.fr']); assert.deepStrictEqual(a.bad, ['x']);
assert.deepStrictEqual(M.parseAddresses('').list, []);
const r = M.parseReturn('#state=abc&access_token=ya29.T&token_type=Bearer&expires_in=3599&scope=https://www.googleapis.com/auth/gmail.send');
assert.strictEqual(r.token, 'ya29.T'); assert.strictEqual(r.expiresIn, 3599); assert.strictEqual(r.state, 'abc');
assert.strictEqual(M.parseReturn('#error=access_denied&state=s').error, 'access_denied');
assert.strictEqual(M.parseReturn('#foo'), null);
const u = new URL(M.authUrl({ clientId: 'id.apps.googleusercontent.com', redirectUri: 'https://aulit42369.github.io/CRA/', state: 's1' }));
assert.strictEqual(u.searchParams.get('response_type'), 'token');
assert.strictEqual(u.searchParams.get('scope'), 'https://www.googleapis.com/auth/gmail.send');
assert.strictEqual(u.searchParams.get('redirect_uri'), 'https://aulit42369.github.io/CRA/');
const xlsx = fs.readFileSync(path.join(__dirname, 'sortie/CRA_2026-09.xlsx'));
const subject = 'CRA septembre 2026 – Tertereau Olivier — compte rendu d\'activité très détaillé avec accents éèàç';
const body = 'Bonjour,\n\nVeuillez trouver ci-joint mon CRA de septembre 2026.\n\nCordialement,\nOlivier Tertereau';
const mime = M.buildMime({ to: ['paie@izencia.fr', 'rh@izencia.fr'], cc: ['moi@gmail.com'], subject, body, filename: 'CRA_izencia_2026-09_Tertereau_Olivier.xlsx', data: new Uint8Array(xlsx) });
assert.ok(/^[\x00-\x7f]*$/.test(mime), 'MIME non ASCII');
assert.ok(mime.split('\r\n').every((l) => l.length <= 998), 'ligne trop longue');
// le "raw" envoyé à Gmail se décode à l'identique
const raw = M.b64url(mime);
assert.ok(/^[A-Za-z0-9_-]+$/.test(raw));
assert.strictEqual(Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('latin1'), mime);
fs.writeFileSync(path.join(__dirname, 'sortie/message.eml'), mime);
fs.writeFileSync(path.join(__dirname, 'sortie/message.json'), JSON.stringify({ subject, body }));
// send() : succès, 401, réseau
(async () => {
  let seen;
  const ok = await M.send({ token: 'T', mime, fetchImpl: async (url, o) => { seen = { url, o }; return { ok: true, status: 200, json: async () => ({ id: 'm1' }) }; } });
  assert.deepStrictEqual(ok, { ok: true, id: 'm1' });
  assert.strictEqual(seen.url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  assert.strictEqual(seen.o.headers.Authorization, 'Bearer T');
  assert.strictEqual(JSON.parse(seen.o.body).raw, raw);
  const e401 = await M.send({ token: 'T', mime, fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'x' } }) }) });
  assert.strictEqual(e401.ok, false); assert.strictEqual(e401.status, 401);
  const eNet = await M.send({ token: 'T', mime, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
  assert.strictEqual(eNet.status, 0);
  console.log('OK mail : adresses, connexion, MIME, envoi');
})().catch((e) => { console.error(e); process.exit(1); });
