# Écran CRC

Widget d'affichage (5 styles : panneau LED, tableau de bord, quai de gare, terminal rétro, néon) (horloge, météo, fête du jour, avancement de la semaine du lundi au samedi, messages, fun facts) avec une page d'admin.

- `index.html` : l'écran, à ouvrir en plein écran sur le poste du CRC
- `admin.html` : la page pour modifier ce qui s'affiche
- `data.json` : le contenu de l'écran, réécrit par l'admin
- `config.js` : réglages et valeurs par défaut

## Mise en ligne avec GitHub Pages

1. Settings, Pages, Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`
2. L'écran est sur `https://<pseudo>.github.io/<repo>/` et l'admin sur `https://<pseudo>.github.io/<repo>/admin.html`

## Accès admin

L'admin enregistre directement dans `data.json` via l'API GitHub. Il faut une clé :

1. github.com/settings/personal-access-tokens/new
2. Repository access : **Only select repositories**, ce repo uniquement
3. Permissions, Repository : **Contents, Read and write**
4. Colle la clé sur la page admin, elle reste dans ce navigateur seulement

L'écran relit `data.json` toutes les 2 minutes.

## Apparence

Tout se règle dans l'admin : style, disposition (carrousel ou liste), résolution (auto, tuile 435 × 430, HD, Full HD, vertical, personnalisée), taille du texte, cadre façon carte et horloge. Un aperçu en direct montre le rendu avant d'enregistrer.
