# CRA IZENCIA — parcours (écran par écran)

Un seul écran (`<main class="app">`) et des feuilles qui montent du bas (`.sheet`, `role="dialog"`).

1. **Premier lancement** → feuille **Réglages** : nom du technicien, client, destinataire (obligatoires).
2. **Écran du mois** : bandeau (mois précédent / suivant, Réglages), totaux (jours travaillés, absences, heures sup.),
   barre « jours ouvrés renseignés », calendrier coloré + légende, aide « Appuie sur un jour… · appui long… », bouton **Sélection**.
   Barre du bas : **Signature** et **Envoyer le CRA**.
3. **Feuille Jour** (appui sur un jour) : jour précédent / suivant, préréglages, colonnes de saisie, HS jour / nuit, commentaire, avertissement, **Terminé**.
4. **Mode sélection** (appui long ou « Sélection ») : barre de sélection (annuler, nombre de jours, « Tous les jours ouvrés », **Modifier**) → feuille Jour en mode groupé (sans HS ni commentaire).
5. **Feuille Signature** : zone de signature au doigt, Effacer / Valider.
6. **Feuille Envoi** : fichier `CRA_izencia_AAAA-MM_Nom_Prenom.xlsx`, destinataires, objet, avertissement si CRA incomplet (2e appui obligatoire)
   - **Envoyer via Gmail** → redirection Google (première fois) → retour → « Envoi en cours… » → **CRA envoyé** ;
   - **Autre messagerie** → étapes : fichier dans Téléchargements, Ouvrir le mail, Joindre (Re-télécharger possible) ; sur iPhone : partage iOS avec le fichier joint.
7. **Réglages** (icône) : champs, re-remplir / vider le mois, se déconnecter de Gmail, liens Confidentialité · Conditions · Mentions légales, **Enregistrer**.
8. **Pages annexes** : `confidentialite.html`, `conditions.html`, `mentions-legales.html` (lien « Retour à l'application »), `404.html`.
