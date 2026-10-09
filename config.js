// Repo GitHub qui stocke data.json
// Laisse vide pour une détection automatique sur GitHub Pages (pseudo.github.io/nom-du-repo)
window.CRC_CONFIG = {
  GITHUB_OWNER: "",
  GITHUB_REPO: "",
  BRANCH: "main"
};
(function(){
  const c = window.CRC_CONFIG, h = location.hostname;
  if(!c.GITHUB_OWNER && h.endsWith(".github.io")) c.GITHUB_OWNER = h.split(".")[0];
  if(!c.GITHUB_REPO && h.endsWith(".github.io")) c.GITHUB_REPO = location.pathname.split("/").filter(Boolean)[0] || (c.GITHUB_OWNER + ".github.io");
})();

// Valeurs par défaut si data.json est vide ou injoignable
window.CRC_DEFAULTS = {
  titre: "Infos CRC",
  sous_titre: "Aujourd'hui",
  affichage: "auto",
  reload: null,
  ville: "Montpellier",
  lat: 43.6108,
  lon: 3.8767,
  ouverture: "08:30",
  fermeture: "18:30",
  blocs: { meteo: true, fete: true, semaine: true, funfacts: true },
  messages: [
    { badge: "Info", texte: "Bienvenue sur l'écran du CRC", couleur: "ambre", actif: true },
    { badge: "Info", texte: "Pensez à faire une pause toutes les heures", couleur: "vert", actif: true }
  ],
  funfacts_perso: [],
  vitesse: 60,
  rotation: 10
};
