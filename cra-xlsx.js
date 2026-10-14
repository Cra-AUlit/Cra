/* CRA izencia — remplissage fidèle du modèle Excel d'origine.
 * On ne reconstruit PAS le classeur : on ouvre le .xlsx d'origine (zip) et on
 * ne touche qu'aux cellules de saisie. Styles, fusions, commentaires, mise en
 * forme conditionnelle, colonnes cachées et mise en page restent identiques.
 * Fonctionne dans le navigateur (window.CraXlsx) et sous Node (tests).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CraXlsx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SHEET = 'xl/worksheets/sheet1.xml';
  const FIRST_ROW = 6;            // 1er jour du mois
  const COLS = ['B', 'C', 'D', 'E', 'F', 'G', 'H']; // travaillé, CP, maladie, exc, sans solde, HS jour, HS nuit
  const KEYS = ['w', 'cp', 'mal', 'exc', 'css', 'hj', 'hn'];

  /* ---------- Dates ---------- */
  const serial = (y, m, d) => (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const weekday = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 1; // WEEKDAY() Excel : dimanche = 1

  function easter(y) { // Meeus/Jones/Butcher
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, month - 1, day));
  }
  /** Jours fériés France métropolitaine → Map "M-D" -> nom */
  function holidays(y) {
    const out = new Map();
    const add = (dt, name) => out.set((dt.getUTCMonth() + 1) + '-' + dt.getUTCDate(), name);
    const fix = (m, d, n) => add(new Date(Date.UTC(y, m - 1, d)), n);
    const e = easter(y), plus = (n) => new Date(e.getTime() + n * 86400000);
    fix(1, 1, "Jour de l'an"); add(plus(1), 'Lundi de Pâques'); fix(5, 1, 'Fête du Travail');
    fix(5, 8, 'Victoire 1945'); add(plus(39), 'Ascension'); add(plus(50), 'Lundi de Pentecôte');
    fix(7, 14, 'Fête nationale'); fix(8, 15, 'Assomption'); fix(11, 1, 'Toussaint');
    fix(11, 11, 'Armistice'); fix(12, 25, 'Noël');
    return out;
  }

  /* ---------- XML ---------- */
  const esc = (s) => String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (n) => String(Math.round(n * 1e6) / 1e6);

  function cellRe(ref) { return new RegExp('<c r="' + ref + '"([^>]*?)(?:/>|>([\\s\\S]*?)</c>)'); }

  /** Remplace une cellule en conservant son style (s="…"). */
  function patch(xml, ref, fn) {
    const re = cellRe(ref);
    const m = xml.match(re);
    if (!m) throw new Error('Cellule introuvable dans le modèle : ' + ref);
    const style = (m[1].match(/\ss="(\d+)"/) || [])[0] || '';
    const formula = ((m[2] || '').match(/<f[^>]*\/>|<f[^>]*>[\s\S]*?<\/f>/) || [''])[0];
    const out = fn(style, formula);
    return xml.replace(re, () => out);
  }
  const setNum = (xml, ref, v) => patch(xml, ref, (s) => v == null || v === 0 || v === ''
    ? '<c r="' + ref + '"' + s + '/>'
    : '<c r="' + ref + '"' + s + '><v>' + num(v) + '</v></c>');
  const setText = (xml, ref, t) => patch(xml, ref, (s) => !t
    ? '<c r="' + ref + '"' + s + '/>'
    : '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + esc(t) + '</t></is></c>');
  /** Met à jour la valeur en cache d'une formule (ce qu'affichent Gmail, aperçus, etc.). */
  const setCache = (xml, ref, v) => patch(xml, ref, (s, f) => typeof v === 'string'
    ? '<c r="' + ref + '"' + s + ' t="str">' + f + '<v>' + esc(v) + '</v></c>'
    : '<c r="' + ref + '"' + s + '>' + f + '<v>' + num(v) + '</v></c>');

  /* ---------- Génération ---------- */
  /**
   * @param {object} o
   * @param {ArrayBuffer|Uint8Array} o.template  le .xlsx d'origine
   * @param {Function} o.JSZip
   * @param {number} o.year, o.month (1-12)
   * @param {string} o.technicien, o.client
   * @param {Object<number,{w,cp,mal,exc,css,hj,hn,com}>} o.days  clé = jour du mois
   * @param {Uint8Array} [o.signature]  PNG
   * @param {{w:number,h:number}} [o.signatureSize]  px
   * @returns {Promise<Uint8Array>}
   */
  async function build(o) {
    const zip = await o.JSZip.loadAsync(o.template);
    let x = await zip.file(SHEET).async('string');
    const { year: y, month: m } = o;
    const n = daysInMonth(y, m);

    x = setText(x, 'C1', (o.technicien || '').toUpperCase());
    x = setText(x, 'H1', o.client || '');
    x = setNum(x, 'B2', m);
    x = setNum(x, 'D2', y);

    const totals = KEYS.map(() => 0);
    for (let d = 1; d <= 31; d++) {
      const r = FIRST_ROW + d - 1;
      const day = d <= n ? (o.days && o.days[d]) || {} : {};
      KEYS.forEach((k, i) => {
        const v = Number(day[k]) || 0;
        totals[i] += v;
        x = setNum(x, COLS[i] + r, v);
      });
      x = setText(x, 'I' + r, d <= n ? (day.com || '').trim() : '');
      // valeurs en cache des formules de date / jour de semaine
      x = setCache(x, 'A' + r, d <= n ? serial(y, m, d) : '');
      x = setCache(x, 'M' + r, d <= n ? weekday(y, m, d) : 0);
    }
    x = setCache(x, 'L6', serial(y, m, n));
    ['B', 'C', 'D', 'E', 'F'].forEach((c, i) => { x = setCache(x, c + '37', totals[i]); });
    x = setCache(x, 'G37', totals[5] + totals[6]);
    x = setCache(x, 'G38', totals[5]);
    x = setCache(x, 'H38', totals[6]);

    x = fixHolidays(x, y);

    if (o.signature) x = await addSignature(zip, x, o.signature, o.signatureSize || { w: 600, h: 200 });
    zip.file(SHEET, x);

    // Excel recalcule tout à l'ouverture (sécurité en plus des caches ci-dessus)
    let wb = await zip.file('xl/workbook.xml').async('string');
    if (!/fullCalcOnLoad/.test(wb)) wb = wb.replace(/<calcPr([^>]*?)\/>/, '<calcPr$1 fullCalcOnLoad="1"/>');
    zip.file('xl/workbook.xml', wb);

    let core = await zip.file('docProps/core.xml').async('string');
    core = core.replace(/<cp:lastModifiedBy>[^<]*<\/cp:lastModifiedBy>/, () => '<cp:lastModifiedBy>' + esc(o.technicien || '') + '</cp:lastModifiedBy>')
      .replace(/(<dcterms:modified[^>]*>)[^<]*/, '$1' + new Date().toISOString().replace(/\.\d+Z$/, 'Z'));
    zip.file('docProps/core.xml', core);

    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Correctif du modèle Izencia : la mise en forme « férié en bleu » de la
   * colonne A ne regarde que la table 2021-2025 (colonnes N à R) ; la colonne S
   * n'était reliée à aucune règle. On écrit les fériés de l'année du CRA dans S
   * (colonne cachée) et on ajoute 11 règles identiques aux autres (même format
   * bleu dxfId 72) qui pointent sur S6:S16. Le bleu marche donc pour toute année.
   */
  function fixHolidays(x, y) {
    x = setNum(x, 'S5', y);
    const H = [...holidays(y).keys()];
    H.forEach((k, i) => { const [m, d] = k.split('-').map(Number); x = setNum(x, 'S' + (6 + i), serial(y, m, d)); });
    if (/\$S\$6/.test(x)) return x;
    const rules = H.map((_, i) => '<cfRule type="cellIs" dxfId="72" priority="' + (74 + i) +
      '" operator="equal"><formula>$S$' + (6 + i) + '</formula></cfRule>').join('');
    return x.replace(/(<conditionalFormatting sqref="A6:A36">[\s\S]*?)(<\/conditionalFormatting>)/, (_, a, b) => a + rules + b);
  }

  /** Image de signature ancrée dans la zone « Signature client » (A39:C43). */
  async function addSignature(zip, sheetXml, png, size) {
    const EMU = 9525;
    // zone utile ≈ 215 × 68 px sous le libellé
    const maxW = 205, maxH = 62;
    const k = Math.min(maxW / size.w, maxH / size.h);
    const cx = Math.round(size.w * k * EMU), cy = Math.round(size.h * k * EMU);
    zip.file('xl/media/cra_signature.png', png);
    zip.file('xl/drawings/drawing1.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
      '<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>' + 6 * EMU + '</xdr:colOff><xdr:row>39</xdr:row><xdr:rowOff>' + 2 * EMU + '</xdr:rowOff></xdr:from>' +
      '<xdr:ext cx="' + cx + '" cy="' + cy + '"/>' +
      '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Signature client"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>' +
      '<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>' +
      '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>' +
      '<xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>');
    zip.file('xl/drawings/_rels/drawing1.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/cra_signature.png"/></Relationships>');

    const relsPath = 'xl/worksheets/_rels/sheet1.xml.rels';
    let rels = await zip.file(relsPath).async('string');
    rels = rels.replace('</Relationships>', '<Relationship Id="rIdCraSig" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>');
    zip.file(relsPath, rels);

    let ct = await zip.file('[Content_Types].xml').async('string');
    if (!/Extension="png"/.test(ct)) ct = ct.replace('<Default Extension="rels"', '<Default Extension="png" ContentType="image/png"/><Default Extension="rels"');
    ct = ct.replace('</Types>', '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');
    zip.file('[Content_Types].xml', ct);

    // <drawing> doit précéder <legacyDrawing> dans le schéma
    return sheetXml.replace('<legacyDrawing', '<drawing r:id="rIdCraSig"/><legacyDrawing');
  }

  return { build, holidays, daysInMonth, weekday, serial, KEYS };
});
