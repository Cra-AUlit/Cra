# Activer « Envoyer via Gmail » (une seule fois, ~20 min, sur PC)

Sans ce réglage, l'app fonctionne déjà avec « Préparer le mail » (Gmail, Outlook…).
Ce guide ajoute le bouton **Envoyer via Gmail** : envoi direct, pièce jointe incluse.

Remplace partout `<orga>` par le nom de ton organisation GitHub (ex. `cra-izencia`).
Adresse de l'app : `https://<orga>.github.io/`

## 1. Créer le projet Google
1. Va sur https://console.cloud.google.com et connecte-toi avec ton Gmail.
2. En haut à gauche, sélecteur de projet → **Nouveau projet** → nom `CRA IZENCIA` → **Créer**.
3. Vérifie que le projet `CRA IZENCIA` est bien sélectionné en haut.

## 2. Activer l'API Gmail
1. Menu ☰ → **API et services** → **Bibliothèque**.
2. Cherche **Gmail API** → ouvre-la → **Activer**.

## 3. Écran de consentement (Google Auth Platform)
1. Menu ☰ → **API et services** → **Écran de consentement OAuth** (ou **Google Auth Platform**) → **Commencer**.
2. Nom de l'application : `CRA IZENCIA` · Adresse e-mail d'assistance : ton Gmail → **Suivant**.
3. Audience : **Externe** → **Suivant**.
4. Coordonnées : ton Gmail → **Suivant** → coche l'accord → **Créer**.
5. Rubrique **Accès aux données** → **Ajouter ou supprimer des champs d'application** →
   en bas, « Ajouter manuellement » : `https://www.googleapis.com/auth/gmail.send` → **Ajouter au tableau** → **Mettre à jour** → **Enregistrer**.
6. Rubrique **Audience** → **Publier l'application** → **Confirmer**.
   Statut attendu : « En production ». Ne lance **pas** la procédure de validation : inutile.
   → Aucun Gmail à ajouter à la main, pour toi comme pour les collègues (limite : 100 utilisateurs).

## 4. Créer l'ID client
1. Rubrique **Clients** (ou **Identifiants** → **Créer des identifiants** → **ID client OAuth**).
2. Type d'application : **Application Web** · Nom : `CRA IZENCIA`.
3. **Origines JavaScript autorisées** → Ajouter : `https://<orga>.github.io`
   (sans barre finale)
4. **URI de redirection autorisés** → Ajouter : `https://<orga>.github.io/`
   (AVEC la barre finale — doit être exactement l'adresse de l'app)
5. **Créer** → copie l'**ID client** (finit par `.apps.googleusercontent.com`).
   Pas besoin du « code secret du client » : ne le mets nulle part.

## 5. Coller l'ID dans l'app
1. Ouvre `config.js` (à la racine du dépôt) et colle l'ID entre les guillemets :
   ```js
   googleClientId: '123456789-abc.apps.googleusercontent.com',
   ```
2. Commit + push (GitHub Desktop) ou dépose le fichier sur github.com.
3. Attends 1-2 min, ferme complètement l'app sur le téléphone et rouvre-la.

## 6. Première utilisation (toi et chaque collègue)
1. **Envoyer le CRA** → **Envoyer via Gmail**.
2. Google s'ouvre : choisis ton compte.
3. Écran « Google n'a pas validé cette application » → **Paramètres avancés** → **Accéder à CRA IZENCIA (non sécurisé)**.
   C'est normal : l'app n'est pas passée par la validation payante/longue de Google. Elle ne peut **qu'envoyer** des mails, pas lire ta boîte.
4. Autorise **Envoyer des e-mails en votre nom** → l'app revient et envoie le CRA.
5. Vérifie dans Gmail → **Messages envoyés**.

Les fois suivantes : envoi direct (Google redemande parfois de choisir le compte, 1 appui).

## En cas de souci
| Message | Cause | Solution |
|---|---|---|
| `redirect_uri_mismatch` | URI de redirection différente | Étape 4.4 : `https://<orga>.github.io/` avec la barre finale |
| `origin_mismatch` | Origine absente | Étape 4.3 |
| « Google refuse l'envoi » | API Gmail pas activée ou autorisation décochée | Étape 2, puis renvoyer et cocher l'autorisation |
| Bouton Gmail absent | `config.js` vide ou ancienne version en cache | Étape 5, fermer/rouvrir l'app |
| « Envoi incertain » | Coupure réseau pendant l'envoi | Regarder « Messages envoyés » avant de renvoyer |

Pour retirer l'accès plus tard : https://myaccount.google.com/permissions → CRA IZENCIA → Supprimer l'accès.
