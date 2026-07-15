# Wizard — Compteur de points

Petite appli web pour suivre les scores du jeu de société **Wizard** (3 à 6 joueurs).

## Fonctionnalités

- Configuration de la partie : nombre de joueurs (3 à 6) et noms.
- Nombre de manches calculé automatiquement (`60 / nombre de joueurs`).
- À chaque manche : saisie des prédictions de plis, puis des plis réellement remportés
  (avec vérification que le total des plis correspond au nombre de cartes distribuées).
- Calcul automatique des scores selon les règles officielles :
  - prédiction correcte : `20 + 10 × plis remportés`
  - prédiction incorrecte : `-10 × écart entre la prédiction et le résultat`
- Tableau récapitulatif des scores manche par manche avec total cumulé.
- Classement final à la fin de la partie (avec égalité possible).
- Sauvegarde automatique de la partie en cours dans le navigateur (`localStorage`) :
  un rechargement de page ne fait pas perdre la partie en cours.

## Utilisation

Aucune installation ni build n'est nécessaire : c'est une page statique
(HTML/CSS/JS vanilla).

- En local : ouvrez `index.html` dans un navigateur, ou lancez un petit serveur
  statique, par ex. `python3 -m http.server` puis rendez-vous sur
  `http://localhost:8000`.
- En ligne : le dossier peut être publié tel quel sur n'importe quel hébergeur
  de site statique (GitHub Pages, Netlify, etc.).

## Structure du projet

```
index.html      Structure de la page (écrans configuration / jeu / fin)
css/style.css    Styles
js/app.js        Logique de l'application (état de partie, calcul des scores, persistance)
```
