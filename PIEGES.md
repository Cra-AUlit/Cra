# CRA IZENCIA — pièges

## Origine partagée (GitHub Pages)
- L'app est servie à `https://cra-aulit.github.io/Cra/`. Le navigateur cloisonne localStorage, caches et service workers
  **par origine** (`https://cra-aulit.github.io`), pas par dossier. Tout autre dépôt Pages de l'organisation Cra-AUlit
  (dont un dépôt `cra-aulit.github.io`) pourrait lire `cra.settings`, `cra.m.*` (signature comprise), `cra.gtoken`,
  écrire dans les caches `cra-*` ou enregistrer son propre service worker sur `/Cra/`. Le code ne peut pas l'empêcher.
- Règle : **ne publier aucun autre dépôt sur Pages dans Cra-AUlit**, et n'y donner l'accès en écriture qu'à des personnes de confiance.
- Dans le service worker : ne jamais utiliser `caches.match()` global, toujours `caches.open(VERSION)` puis `match`.

## Jeton Gmail
- Le jeton (`cra.gtoken`, portée gmail.send) est effacé après un envoi réussi, à expiration, sur un 401 et par
  Réglages → « Se déconnecter de Gmail » (qui le révoque aussi chez Google). Ne pas le garder plus longtemps.

## CSP
- `index.html` a une CSP en balise meta. Tout nouveau domaine (police, API, image) doit y être ajouté, sinon il est bloqué.
  Pas de script ni d'attribut `style="…"` en ligne dans index.html (bloqués) ; `element.style.setProperty` reste permis.
- Changer VERSION dans sw.js à chaque livraison.
- Polices locales (`fonts.css`) : une nouvelle graisse hors de 500–800 (Bricolage) ou 500–700 (JetBrains Mono) serait simulée par le navigateur ;
  ne jamais remettre de lien Google Fonts (transfert d'IP vers Google, CSP `font-src 'self'`). Nouveau fichier de police → `ASSETS` de sw.js.

## Pages annexes
- `404.html` est servie par GitHub Pages à n'importe quelle profondeur (`/Cra/a/b/c`) : y garder des chemins absolus `/Cra/…`.
  Si le dépôt change de nom ou passe à la racine d'un domaine, corriger ces chemins.
- Couleurs : ne pas remettre du texte blanc sur sarcelle/orange/gris (contraste < 4,5:1), voir `fg` dans `TYPES`.

## Identités d'appli (manifest `id`) — NE JAMAIS CHANGER (29/10)
Chrome identifie une PWA installée par son `id` ; en changer = une autre appli, l'ancienne reste orpheline. Valeurs en ligne des 5 apps :
ÉCHO `/` (echo-jeu.github.io depuis le 29/10 ; avant : `/Echo/` sur aulit42369.github.io) · LUMEN `/` (lumen-jeu.github.io) · Fragments `/fragments/` (fragments-jeu.github.io, volontairement différent de `/`) · Résonance `/` (resonance-jeu.github.io) · CRA `/Cra/` (cra-aulit.github.io/Cra/).
`tests/manifest-sw.test.js` (identique dans les 5 projets) fige ces valeurs : si tu le modifies, copie-le à l'identique dans les 4 autres.
