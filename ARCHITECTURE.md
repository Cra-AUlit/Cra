# CRA IZENCIA — architecture

PWA statique (GitHub Pages), sans serveur. Tout est dans le navigateur du téléphone.

## Modules
- `index.html` : écran unique + feuilles (jour, réglages, signature, envoi). CSP en balise meta.
- `app.js` : calendrier, saisie, réglages, signature, envoi (option A « Autre messagerie », option B Gmail).
- `cra-xlsx.js` : génération du .xlsx à partir de `modele/CRA_izencia.xlsx` (JSZip, `lib/`).
- `mail.js` : MIME, URL OAuth Google (redirection, jeton dans le fragment), envoi API Gmail, révocation.
- `config.js` : `googleClientId` (public ; vide = Gmail désactivé).
- `sw.js` : hors ligne. Réseau d'abord (4 s) puis cache `VERSION` uniquement ; polices dans `VERSION-fonts`.
- `confidentialite.html` : règles de confidentialité (écran de consentement Google).

## Données (localStorage, origine https://cra-aulit.github.io)
- `cra.settings` (nom, client, destinataires, objet, message), `cra.m.AAAA-MM` (jours, signature, date d'envoi),
  `cra.pending` (state OAuth pendant la redirection, 15 min max), `cra.gtoken` (jeton Gmail, effacé dès que possible).

## Sécurité
- OAuth : portée `gmail.send` seule, `state` aléatoire vérifié au retour, fragment effacé de l'URL.
- Jeton : effacé après envoi réussi, à expiration, sur 401, ou par « Se déconnecter de Gmail » (révocation Google).
- Service worker : ne lit et ne purge que ses propres caches.
- CSP : scripts et styles du site seulement (+ Google Fonts), connexions vers Gmail et la révocation OAuth.
- Limite connue : l'origine est partagée avec les autres dépôts Pages de l'organisation (voir PIEGES.md).
