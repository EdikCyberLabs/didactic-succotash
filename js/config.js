/* Connexion à Supabase pour synchroniser plusieurs téléphones d'une même entreprise.
   - url : adresse du projet (Supabase › Project Settings › Data API), ex. https://abcdefgh.supabase.co
   - key : clé « publishable » (sb_publishable_…). Elle est faite pour être visible dans l'application :
     la protection des données vient des règles de sécurité de supabase/schema.sql.
   Laisser url vide désactive la synchronisation : l'application fonctionne alors seule sur le téléphone. */
window.GESTIO_SUPABASE = {
  url: 'https://sktrzibeinhbblnovrct.supabase.co',
  key: 'sb_publishable_3foU7MKb22wV2-9-2xJhaw_1IaCek8m',
};
