/* CRA — application. Données uniquement sur le téléphone (localStorage). */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const C = window.CraXlsx;
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  // fg = couleur du texte posé sur la couleur du type (contraste WCAG AA ≥ 4,5:1)
  const DARK = '#0E2A3B';
  const TYPES = [ // ordre = colonnes du fichier
    { k: 'w', label: 'Travaillé', color: 'var(--teal)', fg: DARK, code: '', vals: [0, 0.5, 1] },
    { k: 'cp', label: 'Congé payé', color: 'var(--cp)', fg: DARK, code: 'CP', vals: [0, 0.5, 1] },
    { k: 'mal', label: 'Maladie', color: 'var(--mal)', fg: '#fff', code: 'MAL', vals: [0, 1] },
    { k: 'exc', label: 'Congé exceptionnel', color: 'var(--exc)', fg: '#fff', code: 'EXC', vals: [0, 0.5, 1] },
    { k: 'css', label: 'Sans solde', color: 'var(--css)', fg: DARK, code: 'SS', vals: [0, 0.5, 1] },
  ];
  const DEFAULTS = {
    nom: '', client: '', to: '', cc: '',
    subj: 'CRA {mois} {annee} – {nom}',
    body: 'Bonjour,\n\nVeuillez trouver ci-joint mon CRA de {mois} {annee}.\n\nCordialement,\n{nom}',
  };

  /* ---------- Stockage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast('⚠️ Sauvegarde impossible'); return false; } },
  };
  let settings = Object.assign({}, DEFAULTS, store.get('cra.settings', {}));
  let today = new Date();
  let Y = today.getFullYear(), M = today.getMonth() + 1;
  let data; // mois courant
  let H;    // fériés de l'année
  const key = () => 'cra.m.' + Y + '-' + String(M).padStart(2, '0');
  const save = () => store.set(key(), data);
  const saveSettings = () => store.set('cra.settings', settings);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  // dernière sauvegarde à la fermeture / mise en arrière-plan
  const flush = () => { if (data) save(); saveSettings(); };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { flush(); return; }
    // retour au premier plan : si le mois a changé pendant que l'app dormait, on passe au mois en cours
    const n = new Date(), wasCurrent = Y === today.getFullYear() && M === today.getMonth() + 1;
    const changed = n.getMonth() !== today.getMonth() || n.getFullYear() !== today.getFullYear();
    if (changed && wasCurrent && !document.querySelector('.sheet:not([hidden])')) { save(); Y = n.getFullYear(); M = n.getMonth() + 1; loadMonth(); }
    else if (data) render();
  });

  const isFerie = (d) => H.has(M + '-' + d);
  const isWE = (d) => { const w = C.weekday(Y, M, d); return w === 1 || w === 7; };
  const ouvre = (d) => !isWE(d) && !isFerie(d);
  const sum = (o) => TYPES.reduce((s, t) => s + (Number(o[t.k]) || 0), 0);
  const fmt = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',');

  function prefill() {
    const days = {};
    for (let d = 1; d <= C.daysInMonth(Y, M); d++) if (ouvre(d)) days[d] = { w: 1 };
    return days;
  }
  function loadMonth() {
    H = C.holidays(Y);
    data = store.get(key(), null);
    if (!data) { data = { days: prefill(), sig: null, sentAt: null }; save(); }
    render();
  }

  /* ---------- Rendu ---------- */
  function render() {
    today = new Date();
    $('#monthName').textContent = MOIS[M - 1];
    $('#monthYear').textContent = Y;
    const grid = $('#grid'); grid.innerHTML = '';
    const n = C.daysInMonth(Y, M);
    const lead = (C.weekday(Y, M, 1) + 5) % 7; // lundi en premier
    for (let i = 0; i < lead; i++) grid.appendChild(Object.assign(document.createElement('div'), { className: 'day blank' }));
    let tw = 0, ta = 0, th = 0, need = 0, done = 0;
    for (let d = 1; d <= n; d++) {
      const o = data.days[d] || {};
      tw += +o.w || 0; ta += (+o.cp || 0) + (+o.mal || 0) + (+o.exc || 0) + (+o.css || 0); th += (+o.hj || 0) + (+o.hn || 0);
      if (ouvre(d)) { need++; if (sum(o) >= 1) done++; }
      grid.appendChild(dayCell(d, o));
    }
    $('#tWork').textContent = fmt(tw); $('#tAbs').textContent = fmt(ta); $('#tHs').textContent = fmt(th);
    $('#progressFill').style.width = (need ? done / need * 100 : 0) + '%';
    $('#progressText').textContent = done + '/' + need + ' jours ouvrés';
    $('#progress').classList.toggle('done', need > 0 && done >= need);
    $('#sigLabel').textContent = data.sig ? 'Signé' : 'Signature';
    $('#openSig').classList.toggle('ok', !!data.sig);
    $('.btn-send span').textContent = data.sentAt ? 'Renvoyer le CRA' : 'Envoyer le CRA';
  }

  function dayCell(d, o) {
    const b = document.createElement('button');
    b.className = 'day';
    b.setAttribute('aria-label', JOURS[C.weekday(Y, M, d) - 1] + ' ' + d);
    if (isWE(d)) b.classList.add('we');
    if (isFerie(d)) b.classList.add('fer');
    if (Y === today.getFullYear() && M === today.getMonth() + 1 && d === today.getDate()) b.classList.add('today');
    // remplissage en deux moitiés
    const parts = [];
    TYPES.forEach((t) => { const v = +o[t.k] || 0; for (let i = 0; i < Math.round(v * 2); i++) parts.push(t); });
    if (parts.length) {
      b.classList.add('filled');
      b.style.setProperty('--a', parts[0].color);
      b.style.setProperty('--b', parts[1] ? parts[1].color : 'transparent');
      b.style.setProperty('--fa', parts[0].fg);
      if (parts[1]) b.style.setProperty('--fb', parts[1].fg);
      if (!parts[1]) b.classList.add('half-empty');
    }
    const codes = [];
    TYPES.forEach((t) => { const v = +o[t.k] || 0; if (v) codes.push(t.code + (v === 0.5 ? '½' : '')); });
    b.innerHTML = '<span class="n">' + d + '</span><span class="v">' + codes.filter(Boolean).join('·') + '</span>';
    const hs = (+o.hj || 0) + (+o.hn || 0);
    if (hs) b.insertAdjacentHTML('beforeend', '<span class="hsdot">' + fmt(hs) + 'h</span>');
    if (o.com) b.insertAdjacentHTML('beforeend', '<span class="comdot"></span>');
    b.dataset.d = d;
    if (sel.has(d)) b.classList.add('sel');
    b.addEventListener('click', () => tapDay(d));
    return b;
  }

  /* ---------- Édition d'un ou plusieurs jours ---------- */
  let curDays = [];          // jours en cours d'édition
  let cur = null;            // jour unique (navigation ‹ ›)
  const bulk = () => curDays.length > 1;
  const dayObj = (d) => data.days[d] || (data.days[d] = {});
  const JC = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  function openDay(d) { cur = d; openEditor([d]); }
  function openEditor(days) {
    curDays = days.slice().sort((a, b) => a - b);
    const one = !bulk(), d0 = curDays[0];
    $('#daySheet').classList.toggle('bulk', !one);
    if (one) {
      $('#dayTitle').textContent = JOURS[C.weekday(Y, M, d0) - 1] + ' ' + d0 + ' ' + MOIS[M - 1];
      const fer = H.get(M + '-' + d0);
      $('#dayFer').hidden = !fer; $('#dayFer').textContent = fer ? 'Férié · ' + fer : '';
      $('#daySub').hidden = true;
    } else {
      $('#dayTitle').textContent = curDays.length + ' jours sélectionnés';
      $('#dayFer').hidden = true;
      $('#daySub').hidden = false;
      $('#daySub').textContent = curDays.map((d) => JC[C.weekday(Y, M, d) - 1] + ' ' + d).join(' · ');
    }
    const objs = curDays.map((d) => data.days[d] || {});
    const rows = $('#rows'); rows.innerHTML = '';
    TYPES.forEach((t) => {
      const vals = objs.map((o) => +o[t.k] || 0);
      const same = vals.every((v) => v === vals[0]);
      const r = document.createElement('div'); r.className = 'r'; r.style.setProperty('--c', t.color); r.style.setProperty('--fg', t.fg);
      r.innerHTML = '<b><i></i>' + t.label + (same ? '' : ' <em>variable</em>') + '</b><div class="seg"></div>';
      const seg = r.querySelector('.seg');
      t.vals.forEach((v) => {
        const btn = document.createElement('button');
        btn.textContent = v === 0 ? '–' : v === 0.5 ? '½' : '1';
        btn.classList.toggle('on', same && vals[0] === v && v !== 0);
        btn.addEventListener('click', () => {
          curDays.forEach((d) => { const o = dayObj(d); if (v) o[t.k] = v; else delete o[t.k]; });
          commit(); openEditor(curDays);
        });
        seg.appendChild(btn);
      });
      rows.appendChild(r);
    });
    if (one) {
      const o = objs[0];
      document.querySelectorAll('.stepper').forEach((s) => { s.querySelector('output').textContent = fmt(+o[s.dataset.k] || 0); });
      $('#dayCom').value = o.com || '';
    }
    const over = curDays.filter((d) => sum(data.days[d] || {}) > 1);
    const w = $('#dayWarn');
    w.hidden = !over.length;
    w.textContent = one ? 'Total de ' + fmt(sum(objs[0])) + ' jour pour cette date : plus d\'une journée.'
      : over.length + ' jour(s) dépassent une journée : ' + over.join(', ') + '.';
    show('#daySheet');
  }
  function commit() {
    curDays.forEach((d) => { const o = data.days[d]; if (o && !Object.keys(o).length) delete data.days[d]; });
    save(); render();
  }
  const PRESETS = { w1: { w: 1 }, w05: { w: 0.5 }, cp1: { cp: 1 }, cp05: { w: 0.5, cp: 0.5 }, mal1: { mal: 1 }, none: {} };
  $('#presets').addEventListener('click', (e) => {
    const p = e.target.closest('button'); if (!p) return;
    curDays.forEach((d) => { const o = dayObj(d); TYPES.forEach((t) => delete o[t.k]); Object.assign(o, PRESETS[p.dataset.p] || {}); });
    commit(); openEditor(curDays);
    if (bulk()) toast(curDays.length + ' jours modifiés');
  });
  document.querySelectorAll('.stepper').forEach((s) => s.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || bulk()) return;
    const o = dayObj(cur);
    const v = Math.max(0, Math.min(24, (+o[s.dataset.k] || 0) + Number(b.dataset.d)));
    if (v) o[s.dataset.k] = v; else delete o[s.dataset.k];
    s.querySelector('output').textContent = fmt(v); commit();
  }));
  $('#dayCom').addEventListener('input', (e) => {
    if (bulk()) return;
    const o = dayObj(cur);
    const v = e.target.value; if (v.trim()) o.com = v; else delete o.com; commit();
  });
  const step = (dir) => { if (bulk()) return; const n = C.daysInMonth(Y, M); const d = cur + dir; if (d >= 1 && d <= n) openDay(d); };
  $('#dayPrev').addEventListener('click', () => step(-1));
  $('#dayNext').addEventListener('click', () => step(1));

  /* ---------- Sélection de plusieurs jours ---------- */
  let selMode = false; const sel = new Set();
  function enterSel(d) {
    selMode = true; if (d) sel.add(d);
    document.body.classList.add('selecting'); updateSel();
  }
  function exitSel() {
    selMode = false; sel.clear(); curDays = cur ? [cur] : [];
    document.body.classList.remove('selecting'); render();
  }
  function updateSel() {
    $('#selCount').textContent = sel.size ? sel.size + ' jour' + (sel.size > 1 ? 's' : '') : 'Touche les jours';
    $('#selEdit').disabled = !sel.size;
    document.querySelectorAll('#grid .day[data-d]').forEach((b) => b.classList.toggle('sel', sel.has(+b.dataset.d)));
  }
  function tapDay(d) {
    if (selMode) { if (sel.has(d)) sel.delete(d); else sel.add(d); updateSel(); return; }
    openDay(d);
  }
  $('#selStart').addEventListener('click', () => enterSel());
  $('#selCancel').addEventListener('click', exitSel);
  $('#selWork').addEventListener('click', () => {
    const n = C.daysInMonth(Y, M); for (let d = 1; d <= n; d++) if (ouvre(d)) sel.add(d); updateSel();
  });
  $('#selEdit').addEventListener('click', () => { if (sel.size) openEditor([...sel]); });
  // appui long sur un jour → mode sélection
  (() => {
    let timer = null, start = null, fired = false;
    const grid = $('#grid');
    grid.addEventListener('pointerdown', (e) => {
      fired = false; // un nouvel appui annule toujours le clic d'après appui long
      const b = e.target.closest('.day[data-d]'); if (!b || selMode) return;
      start = { x: e.clientX, y: e.clientY };
      timer = setTimeout(() => { fired = true; timer = null; if (navigator.vibrate) navigator.vibrate(15); enterSel(+b.dataset.d); }, 450);
    });
    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
    grid.addEventListener('pointermove', (e) => { if (timer && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) cancel(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => grid.addEventListener(ev, cancel));
    grid.addEventListener('contextmenu', (e) => { if (e.target.closest('.day')) e.preventDefault(); });
    // le clic qui suit un appui long ne doit pas désélectionner le jour
    grid.addEventListener('click', (e) => { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
  })();

  /* ---------- Navigation mois ---------- */
  const moveMonth = (k) => { if (selMode) exitSel(); save(); M += k; if (M < 1) { M = 12; Y--; } if (M > 12) { M = 1; Y++; } loadMonth(); };
  $('#prev').addEventListener('click', () => moveMonth(-1));
  $('#next').addEventListener('click', () => moveMonth(1));

  /* ---------- Feuilles ---------- */
  function show(id) { $(id).hidden = false; }
  function hide(el) { el.hidden = true; }
  document.querySelectorAll('.sheet').forEach((sh) => sh.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { if (sh.dataset.mode === 'sending') return; if (sh.id === 'setSheet') readSettings(); hide(sh); if (sh.id === 'daySheet' && selMode) exitSel(); }
  }));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || sending) return;
    const open = document.querySelectorAll('.sheet:not([hidden])');
    open.forEach(hide);
    if (selMode && (!open.length || [...open].some((s) => s.id === 'daySheet'))) exitSel();
  });

  /* ---------- Réglages ---------- */
  const F = { nom: '#sNom', client: '#sClient', to: '#sTo', cc: '#sCc', subj: '#sSubj', body: '#sBody' };
  function openSettings() { Object.entries(F).forEach(([k, s]) => { $(s).value = settings[k] || ''; }); $('#gmailOut').hidden = !gmailOn(); show('#setSheet'); }
  function readSettings() { Object.entries(F).forEach(([k, s]) => { settings[k] = $(s).value.trim(); }); if (!settings.subj) settings.subj = DEFAULTS.subj; if (!settings.body) settings.body = DEFAULTS.body; saveSettings(); }
  Object.values(F).forEach((s) => $(s).addEventListener('input', readSettings));
  $('#openSettings').addEventListener('click', openSettings);
  $('#refill').addEventListener('click', () => {
    if (!confirmBtn($('#refill'), 'Sûr ? Appuie encore')) return;
    const keep = data.days; data.days = prefill();
    Object.entries(keep).forEach(([d, o]) => { if (o.com || o.hj || o.hn) Object.assign(data.days[d] || (data.days[d] = {}), { com: o.com, hj: o.hj, hn: o.hn }); });
    Object.values(data.days).forEach((o) => Object.keys(o).forEach((k) => o[k] == null && delete o[k]));
    save(); render(); toast('Mois re-rempli');
  });
  $('#clearMonth').addEventListener('click', () => {
    if (!confirmBtn($('#clearMonth'), 'Tout effacer ? Appuie encore')) return;
    data.days = {}; save(); render(); toast('Mois vidé');
  });
  // confirmation en deux appuis (pas de confirm() natif)
  function confirmBtn(btn, msg) {
    if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = btn.dataset.txt; return true; }
    btn.dataset.txt = btn.textContent; btn.dataset.armed = 1; btn.textContent = msg;
    setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = btn.dataset.txt; } }, 3000);
    return false;
  }

  /* ---------- Signature ---------- */
  const pad = $('#pad'); const ctx = pad.getContext('2d'); let drawing = false, last = null, inked = false;
  function sizePad() {
    const r = pad.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    pad.width = r.width * dpr; pad.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#13235A'; ctx.lineWidth = 2.6;
  }
  const pt = (e) => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  pad.addEventListener('pointerdown', (e) => { drawing = true; last = pt(e); pad.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, 7); ctx.fillStyle = '#13235A'; ctx.fill(); inked = true; });
  pad.addEventListener('pointermove', (e) => {
    if (!drawing) return; const p = pt(e);
    const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
    ctx.beginPath(); ctx.moveTo(last.lx || last.x, last.ly || last.y); ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); ctx.stroke();
    last = { x: p.x, y: p.y, lx: mid.x, ly: mid.y }; inked = true;
  });
  ['pointerup', 'pointercancel'].forEach((ev) => pad.addEventListener(ev, () => { drawing = false; }));
  $('#openSig').addEventListener('click', () => {
    $('#sigFor').textContent = 'Pour le CRA de ' + MOIS[M - 1] + ' ' + Y + (settings.client ? ' · ' + settings.client : '');
    show('#sigSheet'); requestAnimationFrame(() => {
      sizePad(); inked = false; cleared = false;
      if (data.sig) { const im = new Image(); im.onload = () => { const r = pad.getBoundingClientRect(); const k = Math.min(r.width / im.width, r.height / im.height) * .9; ctx.drawImage(im, (r.width - im.width * k) / 2, (r.height - im.height * k) / 2, im.width * k, im.height * k); }; im.src = data.sig.data; }
    });
  });
  let cleared = false;
  $('#sigClear').addEventListener('click', () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, pad.width, pad.height); ctx.restore(); inked = false; cleared = true; });
  $('#sigOk').addEventListener('click', () => {
    if (inked) {
      const c = crop(pad); if (c) { data.sig = c; save(); toast('Signature enregistrée'); }
    } else if (cleared) { data.sig = null; save(); toast('Signature retirée'); }
    render(); hide($('#sigSheet'));
  });
  function crop(cv) { // découpe au plus juste, fond transparent
    const { width: w, height: h } = cv; const px = cv.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return null;
    const m = 8; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w, x1 + m); y1 = Math.min(h, y1 + m);
    // taille utile : 2 × la zone de l'Excel (205 × 62 px) → fichier léger, rendu net
    const sw = x1 - x0, sh = y1 - y0, k = Math.min(1, 410 / sw, 124 / sh);
    const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(sw * k)); o.height = Math.max(1, Math.round(sh * k));
    const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
    oc.drawImage(cv, x0, y0, sw, sh, 0, 0, o.width, o.height);
    return { data: o.toDataURL('image/png'), w: o.width, h: o.height };
  }

  /* ---------- Envoi ---------- */
  const CFG = window.CRA_CONFIG || {};
  const MAIL = window.CraMail;
  const gmailOn = () => !!(CFG.googleClientId && MAIL);
  const fill = (s) => s.replace(/\{mois\}/g, () => MOIS[M - 1]).replace(/\{annee\}/g, () => String(Y)).replace(/\{nom\}/g, () => settings.nom);
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const fileName = () => 'CRA_izencia_' + Y + '-' + String(M).padStart(2, '0') + (settings.nom ? '_' + slug(settings.nom) : '') + '.xlsx';
  const redirectUri = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  let lastBlob = null, template = null, sending = false, checked = true;
  /** CRA incomplet : 1er appui = avertissement, 2e appui = envoi quand même (pas de confirm() natif). */
  function confirmIncomplete() {
    if (checked) return true;
    checked = true; toast('CRA incomplet : appuie encore pour l\'envoyer quand même');
    return false;
  }

  async function getTemplate() { if (!template) { const r = await fetch('modele/CRA_izencia.xlsx'); if (!r.ok) throw new Error('Modèle Excel introuvable'); template = await r.arrayBuffer(); } return template; }
  async function makeFile() {
    let signature = null, signatureSize = null;
    if (data.sig) { const b = atob(data.sig.data.split(',')[1]); signature = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) signature[i] = b.charCodeAt(i); signatureSize = { w: data.sig.w, h: data.sig.h }; }
    const u8 = await C.build({ template: await getTemplate(), JSZip: window.JSZip, year: Y, month: M, technicien: settings.nom, client: settings.client, days: data.days, signature, signatureSize });
    return new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  }
  /** Adresses validées ; null + message si problème. */
  function recipients() {
    const to = MAIL.parseAddresses(settings.to), cc = MAIL.parseAddresses(settings.cc);
    if (!to.list.length) return { err: 'Indique l\'adresse du destinataire dans les réglages.' };
    if (to.bad.length || cc.bad.length) return { err: 'Adresse invalide : ' + to.bad.concat(cc.bad).join(', ') };
    return { to: to.list, cc: cc.list };
  }
  const setMode = (m) => { $('#sendSheet').dataset.mode = m; };

  /** Prépare le fichier et ouvre la feuille d'envoi. */
  async function prepareSend() {
    if (!settings.nom) { toast('Renseigne ton nom dans les réglages'); openSettings(); return false; }
    if (!settings.client) { toast('Renseigne le nom du client dans les réglages'); openSettings(); return false; }
    const r = recipients(); if (r.err) { toast(r.err); openSettings(); return false; }
    lastBlob = await makeFile();
    $('#fileName').textContent = fileName();
    $('#fileMeta').textContent = Math.round(lastBlob.size / 1024) + ' Ko · ' + $('#tWork').textContent + ' j travaillés' + (data.sig ? ' · signé' : ' · non signé');
    $('#destTo').textContent = r.to.join(', ');
    $('#destCc').textContent = r.cc.join(', '); $('#destCc').hidden = $('#destCcL').hidden = !r.cc.length;
    $('#destSubj').textContent = fill(settings.subj);
    const n = C.daysInMonth(Y, M); let manquants = 0, trop = 0;
    for (let d = 1; d <= n; d++) { const t = sum(data.days[d] || {}); if (ouvre(d) && t < 1) manquants++; if (t > 1) trop++; }
    const pb = [];
    if (manquants) pb.push(manquants + ' jour(s) ouvré(s) incomplet(s)');
    if (trop) pb.push(trop + ' jour(s) à plus d\'une journée');
    const warn = $('#sendWarn'); warn.hidden = !pb.length;
    warn.textContent = pb.length ? pb.join(' · ') + ' — vérifie avant d\'envoyer.' : '';
    checked = !pb.length; // CRA incomplet : l'envoi demande un 2e appui
    $('#sendGmail').hidden = !gmailOn();
    $('#sendOther').className = gmailOn() ? 'btn-soft btn-wide' : 'btn-done';
    $('#sendOther').textContent = gmailOn() ? 'Autre messagerie (Outlook…)' : 'Préparer le mail';
    $('#gmailNote').textContent = gmailOn() ? 'Le mail part de ton compte Gmail et apparaît dans tes « Messages envoyés ».' : '';
    $('#st1').classList.remove('ok'); $('#st2').classList.remove('ok');
    setMode('choose'); show('#sendSheet');
    return true;
  }
  $('#send').addEventListener('click', async () => {
    const btn = $('#send'); btn.disabled = true;
    try { await prepareSend(); } catch (e) { toast('Erreur : ' + e.message); } finally { btn.disabled = false; }
  });

  /* Option « Autre messagerie » : téléchargement + mail pré-rempli */
  $('#sendOther').addEventListener('click', async () => {
    if (!lastBlob || !confirmIncomplete()) return;
    const file = new File([lastBlob], fileName(), { type: lastBlob.type });
    // si un jour Chrome accepte le partage direct de .xlsx, on l'utilise
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: fill(settings.subj), text: fill(settings.body) }); hide($('#sendSheet')); toast('CRA partagé'); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    download(lastBlob, fileName());
    $('#st1').classList.add('ok'); setMode('other');
  });
  $('#dlAgain').addEventListener('click', () => { if (lastBlob) download(lastBlob, fileName()); });
  $('#openMail').addEventListener('click', () => {
    const r = recipients(); if (r.err) { toast(r.err); return; }
    const q = [];
    if (r.cc.length) q.push('cc=' + r.cc.map(encodeURIComponent).join(','));
    q.push('subject=' + encodeURIComponent(fill(settings.subj)));
    q.push('body=' + encodeURIComponent(fill(settings.body)));
    $('#st2').classList.add('ok');
    location.href = 'mailto:' + r.to.map(encodeURIComponent).join(',') + '?' + q.join('&');
  });

  /* Option Gmail : connexion Google (redirection) puis envoi par l'API Gmail */
  // jeton gardé le moins longtemps possible : l'origine cra-aulit.github.io est partagée avec les autres dépôts de l'organisation
  const tokenGet = () => { const t = store.get('cra.gtoken', null); if (t && t.exp - Date.now() > 120000) return t.t; localStorage.removeItem('cra.gtoken'); return null; };
  $('#gmailOut').addEventListener('click', async () => {
    const t = store.get('cra.gtoken', null);
    localStorage.removeItem('cra.gtoken'); localStorage.removeItem('cra.pending');
    if (t && t.t) await MAIL.revoke({ token: t.t });
    toast(t ? 'Déconnecté de Gmail' : 'Aucune connexion Gmail sur ce téléphone');
  });
  function googleLogin(retry) {
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
    flush();
    store.set('cra.pending', { y: Y, m: M, state, at: Date.now(), retry: !!retry });
    location.replace(MAIL.authUrl({ clientId: CFG.googleClientId, redirectUri: redirectUri(), state }));
  }
  $('#sendGmail').addEventListener('click', () => {
    if (sending || !confirmIncomplete()) return;
    const tok = tokenGet();
    if (tok) gmailSend(tok, false); else googleLogin(false);
  });
  async function gmailSend(token, retried) {
    const r = recipients(); if (r.err) { toast(r.err); setMode('choose'); return; }
    sending = true; setMode('sending'); $('#sendingText').textContent = 'Envoi en cours…';
    try {
      if (!lastBlob) lastBlob = await makeFile();
      const mime = MAIL.buildMime({ to: r.to, cc: r.cc, subject: fill(settings.subj), body: fill(settings.body), filename: fileName(), data: new Uint8Array(await lastBlob.arrayBuffer()) });
      const res = await MAIL.send({ token, mime });
      if (res.ok) {
        localStorage.removeItem('cra.gtoken'); // plus besoin du jeton une fois le CRA parti
        markSent();
        $('#sentText').textContent = 'À ' + r.to.join(', ') + ' · ' + new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
        setMode('sent');
        return;
      }
      if (res.status === 401) { localStorage.removeItem('cra.gtoken'); if (!retried) { sending = false; googleLogin(true); return; } }
      setMode('choose'); showSendError(res.message, res.uncertain !== undefined ? res.uncertain : (res.status === 0 || res.status >= 500));
    } catch (e) {
      setMode('choose'); showSendError('Erreur : ' + e.message, false);
    } finally { sending = false; }
  }
  function showSendError(msg, uncertain) {
    const w = $('#sendWarn'); w.hidden = false;
    w.textContent = msg + (uncertain
      ? ' Envoi incertain : vérifie tes « Messages envoyés » dans Gmail avant de renvoyer.'
      : ' Rien n\'a été envoyé.');
  }

  /** Retour de Google après connexion. */
  async function handleGoogleReturn() {
    const ret = MAIL && MAIL.parseReturn(location.hash);
    if (!ret) return;
    history.replaceState(null, '', location.pathname + location.search);
    const pending = store.get('cra.pending', null);
    localStorage.removeItem('cra.pending');
    if (!pending) return;
    if (pending.state !== ret.state || Date.now() - pending.at > 15 * 60000) { toast('Connexion Google non reconnue, réessaie.'); return; }
    Y = pending.y; M = pending.m; loadMonth();
    if (ret.error || !ret.token) {
      toast(ret.error === 'access_denied' ? 'Connexion Google annulée' : 'Connexion Google impossible (' + ret.error + ')');
      await prepareSend(); return;
    }
    if (ret.scope && ret.scope.indexOf(MAIL.SCOPE) === -1) { await prepareSend(); showSendError('Autorisation d\'envoi non accordée à la connexion Google.', false); return; }
    store.set('cra.gtoken', { t: ret.token, exp: Date.now() + ret.expiresIn * 1000 });
    if (await prepareSend()) await gmailSend(ret.token, pending.retry);
  }

  addEventListener('pageshow', (e) => { if (e.persisted && $('#sendSheet').dataset.mode === 'sending') { sending = false; setMode('choose'); } });

  function markSent() { data.sentAt = new Date().toISOString(); save(); render(); }

  /* ---------- Toast ---------- */
  let tt; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2600); }

  /* ---------- Démarrage ---------- */
  loadMonth();
  handleGoogleReturn().catch((e) => toast('Erreur : ' + e.message));
  if (!settings.nom) setTimeout(() => { openSettings(); toast('Commence par tes informations'); }, 400);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
