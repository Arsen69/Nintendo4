# Styling approach

Decision record, so this doesn't get relitigated once more games/screens are added.

## Decision

Plain CSS, no UI framework. Concretely:

- **Design tokens**: the existing dark purple/gold custom-property palette from
  `css/style.css` (`--bg`, `--card-bg`, `--gold`, `--purple`, `--success`, `--danger`,
  `--radius`, etc.) is ported as-is into Angular's global `web/src/styles.css`, under
  `:root`. Any new game gets new component styles built on these same tokens rather than
  inventing a parallel palette.
- **Global vs component-scoped**: tokens, `body` background/typography, and any
  truly-shared primitives (buttons, cards) live in the global stylesheet. Anything
  specific to one screen or one game (e.g. the Wizard score table, the bidding input row)
  is a component's own `.css` file, scoped by Angular's default `ViewEncapsulation.Emulated`.
- **No preprocessor**: plain CSS is sufficient at this app's size; custom properties
  already give us variables and theming without Sass/Less.

## Why not Angular Material

Material brings its own visual language (typography scale, elevation, ripple, component
shapes) that would actively fight the existing hand-rolled dark purple/gold identity —
every themed component would need overrides to look like the current app rather than a
generic Material app. It also adds non-trivial bundle weight for an app that only needs
buttons, inputs, and a table.

## Why not Tailwind

Tailwind adds a build-time step (PostCSS pipeline, content-scanning config) and a new
utility-class syntax that isn't justified at this app's size — a handful of screens with
already-defined custom-property tokens. Plain CSS with those tokens gets the same
consistency with less machinery.
