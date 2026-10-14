# CRA IZENCIA — suivi

## Fait
- v1 PWA : saisie jour par jour (calendrier), pré-remplissage 1 en semaine hors fériés
- Préréglages : journée, ½ journée, congé payé, ½ travail ½ CP, maladie, vide
- Absences (CP, maladie, exceptionnel, sans solde), HS jour/nuit en heures, commentaire
- Totaux du mois + barre « jours ouvrés renseignés »
- Sauvegarde à chaque appui + à la fermeture / mise en arrière-plan, stockage persistant demandé
- Signature client au doigt (optionnelle), insérée dans la zone « Signature client »
- Génération du .xlsx à partir du fichier izencia d'origine : seules les cellules de saisie changent
- Correctif fériés en bleu pour toutes les années (colonne cachée S + règles de mise en forme)
- Option A : fichier dans Téléchargements + mail pré-rempli (toute messagerie : Gmail, Outlook…)
- v2 — Option B : « Envoyer via Gmail » en direct (OAuth Google par redirection, portée gmail.send seule)
- v2 — Récapitulatif avant envoi (destinataires, objet, jours incomplets), erreurs claires, envoi « incertain » signalé
- v2 — Nom de l'app : CRA IZENCIA ; manifest relatif (racine d'un domaine d'organisation ou sous-dossier)
- v2 — Hors ligne : délai réseau 4 s puis version en cache ; polices de secours
- v3 — Sélection de plusieurs jours : appui long ou bouton « Sélection », « Tous les jours ouvrés », modification groupée (préréglages et colonnes)
- v2 — Relecture indépendante du code + correctifs ; tests : générateur, fidélité, MIME, app, Gmail simulé, hors ligne

## En cours
- Activation Gmail : projet Google Cloud + ID client dans config.js (GUIDE_GMAIL.md)

## À faire
- (rien de prévu)

## Décisions prises
- PWA seule, pas d'application Android native
- Français uniquement : pas de fichier i18n
- Données uniquement sur le téléphone, rien de personnel dans le dépôt (modèle anonymisé)
- Maladie : 1 uniquement (consigne du fichier izencia) ; autres colonnes 1 ou 0,5 ; HS par pas de 0,5 h
- Chrome Android refuse le partage direct de .xlsx → option A conservée pour toutes les messageries
- Gmail : projet Google « En production » non validé → pas de liste de comptes, écran « non validée » une fois, 100 utilisateurs max
- Outlook : pas d'envoi direct (option A) ; ajout Microsoft seulement si demandé
- Le .xlsx n'est créé qu'au moment d'envoyer : un fichier par mois (aucun avec Gmail)
- Nom du fichier : CRA_izencia_AAAA-MM_Nom_Prenom.xlsx
- Collègues : même lien, chacun ses réglages et ses données
- Changer VERSION dans sw.js à chaque livraison
- Hébergement : organisation Cra-AUlit, dépôt Cra → https://cra-aulit.github.io/Cra/
- Sélection multiple : HS et commentaires restent jour par jour
