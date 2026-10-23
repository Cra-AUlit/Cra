/* CRA — envoi via Gmail.
 * Connexion Google par redirection (OAuth 2.0, jeton d'accès, portée gmail.send
 * uniquement : l'app peut ENVOYER des mails, pas les lire). Aucun secret :
 * l'ID client est public par nature. Le jeton reste sur le téléphone.
 * Fonctionne dans le navigateur (window.CraMail) et sous Node (tests).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CraMail = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCOPE = 'https://www.googleapis.com/auth/gmail.send';
  const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
  const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
  const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

  /* ---------- Adresses ---------- */
  /** "a@x.fr; b@y.fr" → { list: [...], bad: [...] } */
  function parseAddresses(s) {
    const parts = String(s || '').split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
    return { list: parts.filter((p) => EMAIL.test(p)), bad: parts.filter((p) => !EMAIL.test(p)) };
  }

  /* ---------- Encodages ---------- */
  function utf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    return Uint8Array.from(Buffer.from(str, 'utf8'));
  }
  function b64(u8) {
    if (typeof Buffer !== 'undefined' && typeof btoa === 'undefined') return Buffer.from(u8).toString('base64');
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const wrap = (s) => s.replace(/.{1,76}/g, '$&\r\n').replace(/\r\n$/, '');
  /** En-tête non ASCII (RFC 2047), découpé en mots encodés ≤ 75 caractères. */
  function header(str) {
    if (/^[\x20-\x7e]*$/.test(str)) return str;
    const words = []; let chunk = '';
    for (const ch of Array.from(str)) {
      if (utf8(chunk + ch).length > 45) { words.push(chunk); chunk = ''; }
      chunk += ch;
    }
    if (chunk) words.push(chunk);
    return words.map((w) => '=?UTF-8?B?' + b64(utf8(w)) + '?=').join('\r\n ');
  }

  /** Construit le message MIME complet (ASCII uniquement). */
  function buildMime({ to, cc, subject, body, filename, data }) {
    const boundary = 'cra_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const safeName = String(filename).replace(/[^A-Za-z0-9._-]/g, '_');
    const lines = [
      'To: ' + to.join(', '),
      ...(cc && cc.length ? ['Cc: ' + cc.join(', ')] : []),
      'Subject: ' + header(subject),
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="' + boundary + '"',
      '',
      '--' + boundary,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrap(b64(utf8(String(body).replace(/\r?\n/g, '\r\n')))),
      '--' + boundary,
      'Content-Type: ' + XLSX + '; name="' + safeName + '"',
      'Content-Disposition: attachment; filename="' + safeName + '"',
      'Content-Transfer-Encoding: base64',
      '',
      wrap(b64(data)),
      '--' + boundary + '--',
      '',
    ];
    return lines.join('\r\n');
  }
  const b64url = (ascii) => b64(utf8(ascii)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  /* ---------- Connexion Google (redirection) ---------- */
  function authUrl({ clientId, redirectUri, state, hint }) {
    const p = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri, response_type: 'token',
      scope: SCOPE, include_granted_scopes: 'true', state,
    });
    if (hint) p.set('login_hint', hint);
    return AUTH_URL + '?' + p.toString();
  }
  /** Lit le retour de Google dans le fragment (#access_token=…). */
  function parseReturn(hash) {
    const h = String(hash || '').replace(/^#/, '');
    if (!/(^|&)(access_token|error)=/.test(h)) return null;
    const p = new URLSearchParams(h);
    return {
      token: p.get('access_token'), expiresIn: Number(p.get('expires_in')) || 0,
      state: p.get('state'), error: p.get('error'), scope: p.get('scope') || '',
    };
  }

  /* ---------- Envoi ---------- */
  /** @returns {Promise<{ok:true,id:string}|{ok:false,status:number,uncertain:boolean,message:string}>}
   *  uncertain = Gmail a peut-être envoyé malgré l'erreur (coupure réseau, erreur serveur). */
  async function send({ token, mime, fetchImpl, timeoutMs }) {
    const f = fetchImpl || fetch;
    let res;
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const tm = ac ? setTimeout(() => ac.abort(), timeoutMs || 45000) : null;
    try {
      res = await f(SEND_URL, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: b64url(mime) }),
        signal: ac ? ac.signal : undefined,
      });
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      return offline ? { ok: false, status: 0, uncertain: false, message: 'Pas de connexion Internet.' }
        : { ok: false, status: 0, uncertain: true, message: 'Connexion interrompue.' };
    } finally { if (tm) clearTimeout(tm); }
    if (res.ok) { const j = await res.json().catch(() => ({})); return { ok: true, id: j.id || '' }; }
    let detail = '';
    try { const j = await res.json(); detail = (j.error && j.error.message) || ''; } catch (e) { /* vide */ }
    const d = detail ? ' (' + detail.replace(/\.$/, '') + ')' : '';
    const msg = res.status === 401 ? 'Connexion Google expirée.'
      : res.status === 403 ? 'Google refuse l\'envoi' + d + '.'
      : 'Erreur Gmail ' + res.status + d + '.';
    return { ok: false, status: res.status, uncertain: res.status >= 500, message: msg };
  }

  /** Retire l'autorisation donnée à l'app (au mieux : hors ligne, on ignore l'erreur). */
  async function revoke({ token, fetchImpl }) {
    if (!token) return false;
    try {
      const res = await (fetchImpl || fetch)(REVOKE_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'token=' + encodeURIComponent(token),
      });
      return res.ok;
    } catch (e) { return false; }
  }

  return { SCOPE, parseAddresses, buildMime, authUrl, parseReturn, send, revoke, b64url, header };
});
