# Écran CRC

Widget plein écran style panneau LED (horloge, météo, fête du jour, avancement de la semaine du lundi au samedi, messages, fun facts) avec une page d'admin.

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
