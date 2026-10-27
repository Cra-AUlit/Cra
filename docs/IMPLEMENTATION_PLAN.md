# CRA IZENCIA — plan de mise en œuvre

## État au 28/10/2026
- PWA en ligne sur `https://cra-aulit.github.io/Cra/` (cache `cra-v8`), 16 tests `npm test` verts.
- Fait : saisie complète, sélection multiple, signature, génération .xlsx fidèle au modèle, envoi « Autre messagerie », code Gmail prêt,
  sécurité (SW cloisonné, jeton effacé, CSP), pages légales LCEN/RGPD, polices locales, `<h1>` + `<main>` (28/10).

## En cours
- Activation Gmail : projet Google Cloud + ID client dans `config.js` (`GUIDE_GMAIL.md`).

## Prochaines étapes (d'après `A_FAIRE.md`)
1. Google Cloud : lien de confidentialité, conditions (`https://cra-aulit.github.io/Cra/conditions.html`) et e-mail d'assistance dans l'écran de consentement ;
   vérification de l'appli OAuth si plus de 100 utilisateurs ou pour retirer l'écran « non validée ».
2. Test sur un vrai iPhone (installation, saisie, appui long, envoi).

## Décisions en attente (Olivier)
- Nom « CRA IZENCIA » (marque d'un tiers) : garder ou renommer partout.
- « Vider le mois » doit-il aussi effacer la signature ?
- Origine : garder `cra-aulit.github.io/Cra/` (aucun autre dépôt Pages dans Cra-AUlit) ou passer au dépôt `cra-aulit.github.io` (app à la racine).
