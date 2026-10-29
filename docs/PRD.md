# CRA IZENCIA — PRD (cahier des charges produit)

Rédigé le 28/10/2026 d'après le code et les docs du dépôt (`README.md`, `ARCHITECTURE.md`, `A_FAIRE.md`).

## Concept
PWA pour remplir sur téléphone son compte rendu d'activité (CRA) mensuel, jour par jour, et l'envoyer au format Excel
du modèle izencia (`modele/CRA_izencia.xlsx`), par Gmail en direct ou par n'importe quelle messagerie.

## Utilisateurs
- Olivier et ses collègues techniciens izencia : même lien, chacun ses réglages et ses données sur son téléphone.
- Destinataire : service paie / client (reçoit le .xlsx par mail).
- Outil personnel : pas destiné au grand public (`noindex` voulu sur toutes les pages).

## Fonctions (présentes dans le code)
| Fonction | Détail |
|---|---|
| Calendrier du mois | Pré-rempli à 1 en semaine hors jours fériés, navigation mois précédent / suivant |
| Saisie d'un jour | Préréglages (journée, ½ journée, congé payé, ½ travail ½ CP, maladie, vide), colonnes d'absence (CP, maladie, exceptionnel, sans solde), HS jour / nuit par 0,5 h, commentaire |
| Sélection multiple | Appui long ou « Sélection », « Tous les jours ouvrés », modification groupée |
| Totaux | Jours travaillés, jours d'absence, heures sup., barre « jours ouvrés renseignés » |
| Signature client | Au doigt, facultative, insérée dans le .xlsx |
| Envoi | Récapitulatif (destinataires, objet, jours incomplets) ; « Envoyer via Gmail » (OAuth, portée `gmail.send`) ou « Autre messagerie » (fichier téléchargé + mail pré-rempli ; partage iOS avec fichier joint) |
| Réglages | Nom, client, destinataires, copie, objet, message (repères `{mois}` `{annee}` `{nom}`), re-remplir / vider le mois, se déconnecter de Gmail, liens légaux |
| Hors ligne | Service worker (réseau d'abord 4 s, puis cache) |

## Hors périmètre
- Pas d'application Android native, pas d'autre langue que le français.
- Pas de serveur ni de stockage en ligne des CRA ; pas d'envoi direct Outlook (option « Autre messagerie »).
- Pas de référencement, d'analytics ni de cookie.

## Critères de réussite
CRA du mois envoyé sans ressaisie dans Excel ; fichier conforme au modèle izencia. Autres critères proposés : remplir un mois complet en moins de 5 minutes sur téléphone ; envoi par mail réussi du premier coup ; fonctionne hors ligne (proposé par Claude le 29/10/2026, à corriger si besoin).
