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

## Pages annexes
- `404.html` est servie par GitHub Pages à n'importe quelle profondeur (`/Cra/a/b/c`) : y garder des chemins absolus `/Cra/…`.
  Si le dépôt change de nom ou passe à la racine d'un domaine, corriger ces chemins.
- Couleurs : ne pas remettre du texte blanc sur sarcelle/orange/gris (contraste < 4,5:1), voir `fg` dans `TYPES`.
