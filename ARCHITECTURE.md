# CRA IZENCIA — architecture

PWA statique (GitHub Pages), sans serveur. Tout est dans le navigateur du téléphone.

## Modules
- `index.html` : écran unique + feuilles (jour, réglages, signature, envoi). CSP en balise meta.
- `app.js` : calendrier, saisie, réglages, signature, envoi (option A « Autre messagerie », option B Gmail).
- `cra-xlsx.js` : génération du .xlsx à partir de `modele/CRA_izencia.xlsx` (JSZip, `lib/`).
- `mail.js` : MIME, URL OAuth Google (redirection, jeton dans le fragment), envoi API Gmail, révocation.
- `config.js` : `googleClientId` (public ; vide = Gmail désactivé).
- `sw.js` : hors ligne. Réseau d'abord (4 s) puis cache `VERSION` uniquement ; polices dans `VERSION-fonts`.
- `confidentialite.html` : règles de confidentialité (écran de consentement Google). `conditions.html` : conditions d'utilisation.
  Les deux sont liées depuis Réglages et ont un lien « Retour à l'application ».
- `404.html` : page introuvable (chemins absolus `/Cra/…`, servie à toute profondeur). `pages.css` : style partagé des pages annexes.
- Toutes les pages : `noindex` (outil personnel, pas de robots.txt possible : il ne serait lu qu'à la racine du domaine), aucun cookie.

## Données (localStorage, origine https://cra-aulit.github.io)
- `cra.settings` (nom, client, destinataires, objet, message), `cra.m.AAAA-MM` (jours, signature, date d'envoi),
  `cra.pending` (state OAuth pendant la redirection, 15 min max), `cra.gtoken` (jeton Gmail, effacé dès que possible).

## Sécurité
- OAuth : portée `gmail.send` seule, `state` aléatoire vérifié au retour, fragment effacé de l'URL.
- Jeton : effacé après envoi réussi, à expiration, sur 401, ou par « Se déconnecter de Gmail » (révocation Google).
- Service worker : ne lit et ne purge que ses propres caches.
- CSP : scripts et styles du site seulement (+ Google Fonts), connexions vers Gmail et la révocation OAuth.
  Pages annexes : `default-src 'none'`, styles `'self'` (pages.css), aucun script.
- Envoi : nom, client et destinataire obligatoires ; CRA incomplet (jour ouvré < 1 ou jour > 1) → 2e appui pour envoyer.
- Contraste WCAG AA : texte sur couleur de type = `fg` dans `TYPES` (app.js) ; teintes de texte `--teal-t`, `--mal-t` (style.css).
- Limite connue : l'origine est partagée avec les autres dépôts Pages de l'organisation (voir PIEGES.md).
