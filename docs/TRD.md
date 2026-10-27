# CRA IZENCIA — TRD (exigences techniques)

## Pile
- HTML + CSS + JavaScript, aucune construction ; une seule bibliothèque embarquée : **JSZip** (`lib/jszip.min.js`) pour écrire le .xlsx.
- Modules : `config.js` (ID client Google, public ; vide = Gmail désactivé) → `lib/jszip.min.js` → `mail.js` (MIME, OAuth, API Gmail, révocation) → `cra-xlsx.js` (génération à partir du modèle) → `app.js` (interface).
- Polices locales : Bricolage Grotesque, JetBrains Mono (`fonts.css`, licences OFL).
- Tests : `npm test` → `node --test "tests/*.test.mjs"` (16 tests, aucune dépendance, Node 20+).

## PWA
- Hébergement : GitHub Pages, `https://cra-aulit.github.io/Cra/` (organisation Cra-AUlit). **Aucun autre dépôt Pages dans cette organisation** (origine partagée, voir `PIEGES.md`).
- `sw.js` : réseau d'abord (4 s) puis cache `VERSION` (`cra-v8` au 28/10/2026) ; ne lit et ne purge que ses propres caches (jamais `caches.match()` global).
- `manifest.json` relatif (racine ou sous-dossier). Installation : Chrome Android « Ajouter à l'écran d'accueil », iPhone Safari « Sur l'écran d'accueil ».

## Sécurité
- CSP en balise meta : `script-src 'self'`, `style-src 'self'` (aucun script ni attribut `style` en ligne), `connect-src` limité à `gmail.googleapis.com` et `oauth2.googleapis.com`.
- OAuth par redirection, `state` aléatoire vérifié, fragment effacé ; jeton effacé après envoi, à expiration, sur 401 ou par « Se déconnecter de Gmail » (révoqué).
- Pages annexes (`confidentialite.html`, `conditions.html`, `mentions-legales.html`) : `default-src 'none'`, aucun script.

## Contraintes
- Accessibilité : `<main class="app">` autour du contenu principal, `<h1>` masqué visuellement (classe `.sr-only`), feuilles en `role="dialog"` avec titre,
  contraste AA (`fg` de `TYPES` dans `app.js`, `--teal-t`, `--mal-t`), thème sombre automatique.
- `noindex, nofollow` voulu sur toutes les pages ; `404.html` en chemins absolus `/Cra/…`.
- Changer `VERSION` dans `sw.js` à chaque livraison ; tout nouveau fichier dans `ASSETS`.
