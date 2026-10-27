# CRA IZENCIA — PWA

Remplir son compte rendu d'activité mensuel sur téléphone et l'envoyer au format Excel izencia.

## Contenu du zip
- `web/` : l'application. **Son contenu** va à la racine du dépôt GitHub.
- `web/config.js` : ID client Google pour « Envoyer via Gmail » (voir `GUIDE_GMAIL.md`).
- `web/modele/CRA_izencia.xlsx` : le modèle izencia d'origine, sans nom ni client.
- `verif/` : tests (sur PC, facultatif). Ne pas mettre dans le dépôt.

## Hébergement
Organisation GitHub dédiée, dépôt nommé `<orga>.github.io` → app à l'adresse `https://<orga>.github.io/`.
(Fonctionne aussi dans un sous-dossier, ex. `https://<orga>.github.io/CRA/`, mais alors **aucun autre dépôt de l'organisation
ne doit être publié sur GitHub Pages** : ils partageraient la mémoire du téléphone avec l'app, voir `PIEGES.md`.)

## Installation sur le téléphone
**Android** : ouvrir l'adresse dans Chrome → menu ⋮ → **Ajouter à l'écran d'accueil** → Installer.

**iPhone** : ouvrir l'adresse dans **Safari** → bouton **Partager** (carré avec flèche) → **Sur l'écran d'accueil** → Ajouter.
Toujours remplir le CRA depuis l'icône installée : sur iPhone, l'app installée et Safari ont des mémoires séparées.

Au premier lancement : nom, client, destinataire.

## Utilisation
- Appuyer sur un jour pour le modifier. Tout est enregistré instantanément, et à la fermeture.
- Fin de mois : **Signature** (facultatif) → **Envoyer le CRA** →
  - **Envoyer via Gmail** : envoi direct (après activation, voir `GUIDE_GMAIL.md`) ;
  - **Autre messagerie** : fichier dans Téléchargements + mail pré-rempli, joindre avec le trombone.

## Données
Les saisies restent sur le téléphone, jamais sur GitHub ni chez Google. Elles ne sont effacées que si
on désinstalle l'app ou si on efface les données de Chrome dans les paramètres Android.

## Mise à jour
Remplacer les fichiers du dépôt par ceux du nouveau zip. Sur le téléphone, fermer puis rouvrir l'app.

## Tests (PC, facultatif)
Tests de non-régression sans dépendance (Node 20+) : `npm test` à la racine du dépôt (`tests/cra.test.mjs` : générateur .xlsx, MIME, OAuth, service worker, CSP, pages annexes).

Anciens tests (dans l'historique git, dossier `verif/` retiré du dépôt) :
```
cd verif
npm install
node generer.test.js && python3 fidelite.py && node mail.test.js && python3 mail_check.py
```
Tests navigateur (Python + Playwright, app servie en local) : `app_test.py`, `gmail_test.py`, `horsligne_test.py`.
