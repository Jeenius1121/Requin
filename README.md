# Le requin corail

Site éducatif pour l'école primaire (du CP au CM2) : une plongée interactive à la découverte du **requin corail** (*Triaenodon obesus*), aussi appelé requin à pointes blanches de récif.

La page est une plongée de la surface jusqu'à 40 mètres. Une jauge de profondeur, comme un ordinateur de plongée, suit l'élève de palier en palier.

## Les paliers

| Profondeur | Palier | Activité |
|---|---|---|
| 0 m | Surface | Présentation, requin animé |
| −5 m | Qui est-il ? | Fiche d'identité, carte à retourner « le mystère du nom » |
| −10 m | Son corps | Requin à explorer : 10 points à toucher |
| −14 m | Sa taille | L'élève entre sa taille et se compare au requin |
| −18 m | Où vit-il ? | Carte du monde avec 10 lieux à visiter (dont l'outre-mer français) |
| −22 m | Jour et nuit | Scène animée du récif, de jour et de nuit |
| −26 m | Super-sens | Les 4 sens du requin + jeu « Chasse de nuit » |
| −30 m | Les bébés | Étapes de la vie + curseur d'âge (0 à 25 ans) |
| −33 m | Détective | Reconnaître le requin corail parmi d'autres requins |
| −36 m | Dangereux ? | Mythe ou réalité |
| −38 m | Le protéger | Liste rouge de l'UICN, menaces, engagements |
| −40 m | Grand quiz | 10 questions, brevet d'explorateur à partir de 8/10 |

Chaque activité réussie rapporte un badge dans le **carnet de plongée** (10 badges). Les boutons « Écouter » lisent les textes à voix haute pour les plus jeunes lecteurs.

## Ouvrir le site

Aucune installation n'est nécessaire : ouvrez `index.html` dans un navigateur.

Pour le mettre en ligne, n'importe quel hébergement de pages statiques convient (GitHub Pages, par exemple). Une connexion internet sert uniquement à charger les polices de caractères ; sans elle, le site fonctionne avec les polices du système.

## Organisation des fichiers

```
index.html        la page
css/style.css     la mise en forme
js/shark.js       les illustrations de requins (dessinées en SVG)
js/map-data.js    la carte du monde (Natural Earth, domaine public)
js/main.js        les activités, le carnet de badges, la jauge de profondeur
js/hunt.js        le jeu « Chasse de nuit »
```

La progression (badges, lieux visités…) est gardée dans le navigateur de l'élève. Le bouton « Effacer ma progression », dans le carnet, la remet à zéro.

## Sources

FishBase (fiche *Triaenodon obesus*), Liste rouge de l'UICN (évaluation 2020), Florida Museum of Natural History, Aquarium of the Pacific. Carte : Natural Earth.
