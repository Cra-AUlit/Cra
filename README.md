# CRA IZENCIA — PWA

Remplir son compte rendu d'activité mensuel sur téléphone et l'envoyer au format Excel izencia.

## Contenu du zip
- `web/` : l'application. **Son contenu** va à la racine du dépôt GitHub.
- `web/config.js` : ID client Google pour « Envoyer via Gmail » (voir `GUIDE_GMAIL.md`).
- `web/modele/CRA_izencia.xlsx` : le modèle izencia d'origine, sans nom ni client.
- `verif/` : tests (sur PC, facultatif). Ne pas mettre dans le dépôt.

## Hébergement
Organisation GitHub dédiée, dépôt nommé `<orga>.github.io` → app à l'adresse `https://<orga>.github.io/`.
(Fonctionne aussi dans un sous-dossier, ex. `https://<orga>.github.io/CRA/`.)

## Installation sur le téléphone
1. Ouvrir l'adresse dans Chrome.
2. Menu ⋮ → **Ajouter à l'écran d'accueil** → Installer → icône « CRA IZENCIA ».
3. Au premier lancement : nom, client, destinataire.

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
```
cd verif
npm install
node generer.test.js && python3 fidelite.py && node mail.test.js && python3 mail_check.py
```
Tests navigateur (Python + Playwright, app servie en local) : `app_test.py`, `gmail_test.py`, `horsligne_test.py`.
