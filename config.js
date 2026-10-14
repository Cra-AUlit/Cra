/* Réglage commun à tous les utilisateurs de l'app.
 * googleClientId : l'« ID client OAuth » créé dans Google Cloud (voir GUIDE_GMAIL.md).
 * Ce n'est PAS un secret : il est fait pour être public.
 * Laisser vide ('') pour désactiver l'envoi via Gmail (seule l'option « Autre messagerie » reste).
 */
window.CRA_CONFIG = {
  googleClientId: '',
};
