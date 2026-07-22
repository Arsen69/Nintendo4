# Nintendo4 — Compteur de points

Appli web pour suivre les scores de jeux de société/cartes. **Wizard** (3 à 6 joueurs)
est le premier jeu disponible ; l'architecture est conçue pour en ajouter d'autres sans
retoucher les jeux existants.

Déployée sur GitHub Pages : https://arsen69.github.io/Nintendo4/

## Fonctionnalités (Wizard)

- Configuration de la partie : nombre de joueurs (3 à 6) et noms, avec vérification des
  doublons et sauvegarde du brouillon de configuration.
- Nombre de manches calculé automatiquement (`60 / nombre de joueurs`).
- À chaque manche : saisie des prédictions de plis (avec la règle du donneur : son
  annonce ne peut pas rendre le total des annonces égal au nombre de cartes distribuées),
  puis des plis réellement remportés (le total doit correspondre au nombre de cartes
  distribuées). Validation visible en direct, pas de correction silencieuse.
- Calcul automatique des scores selon les règles officielles :
  - prédiction correcte : `20 + 10 × plis remportés`
  - prédiction incorrecte : `-10 × écart entre la prédiction et le résultat`
- Tableau récapitulatif des scores manche par manche avec total cumulé — présentation
  responsive (cartes empilées sur petit écran, tableau sur grand écran).
- Annulation de la dernière manche en cas d'erreur de saisie.
- Classement final à la fin de la partie (avec égalité possible).
- Sauvegarde automatique de la partie en cours dans le navigateur (`localStorage`) :
  un rechargement de page ne fait pas perdre la partie en cours.

## Structure du projet

```
web/            Application Angular (le workspace vit ici, pas à la racine, pour
                 laisser la place à un futur module backend en frère de web/)
  src/app/core/          Abstraction générique multi-jeux (GameDefinition, GameSession,
                          persistance, classement) — voir web/STYLE.md pour les choix de style
  src/app/games/wizard/  Règles et écrans spécifiques à Wizard
  src/app/shared/        Composants réutilisables entre jeux (saisie des joueurs, dialogue
                          de confirmation)
  e2e/                   Tests de bout en bout (Playwright)
.github/workflows/deploy.yml   Déploiement GitHub Pages sur chaque push sur main
```

## Développement

```
cd web
npm install
npm start        # serveur de dev (ng serve)
npm test         # tests unitaires (Vitest, via le builder Angular)
npm run e2e      # tests de bout en bout (Playwright, démarre son propre serveur)
npm run build    # build de production
```
