# CRA IZENCIA — schéma des données

**Aucun serveur à nous, aucune base de données, aucun compte.** Les saisies restent dans le navigateur du téléphone
(localStorage de l'origine `https://cra-aulit.github.io`). Seul service extérieur : l'API Gmail de Google, appelée seulement
quand l'utilisateur choisit « Envoyer via Gmail ».

## Stockage local (localStorage)
| Clé | Contenu | Durée |
|---|---|---|
| `cra.settings` | Nom, client, destinataires (À, Cc), objet, message | Jusqu'à désinstallation / effacement des données |
| `cra.m.AAAA-MM` | Jours du mois (colonnes, HS, commentaires), signature (image), date d'envoi | Idem (« Vider le mois » n'efface pas la signature, point à décider) |
| `cra.pending` | `state` OAuth pendant la redirection Google | 15 min max |
| `cra.gtoken` | Jeton Gmail (portée `gmail.send`) | Effacé après envoi réussi, à expiration, sur 401 ou à la déconnexion |

Stockage persistant demandé au navigateur ; sauvegarde à chaque appui et à la mise en arrière-plan.

## Fichier produit
`.xlsx` généré en mémoire depuis `modele/CRA_izencia.xlsx` (seules les cellules de saisie changent), nom `CRA_izencia_AAAA-MM_Nom_Prenom.xlsx`.
Créé seulement au moment d'envoyer ; avec Gmail il n'est pas enregistré sur le téléphone.

## Échanges réseau
| Vers | Quand | Contenu |
|---|---|---|
| `accounts.google.com` (redirection) | Première connexion Gmail | ID client public, `state` |
| `gmail.googleapis.com` | « Envoyer via Gmail » | Mail MIME avec le .xlsx en pièce jointe |
| `oauth2.googleapis.com` | « Se déconnecter de Gmail » | Révocation du jeton |

## Cache hors ligne
Cache du service worker `cra-v8` : fichiers de l'app, aucune donnée de l'utilisateur.

## Limite connue
L'origine est partagée avec tout autre dépôt Pages de l'organisation Cra-AUlit : n'en publier aucun (voir `PIEGES.md`).
