# CRA IZENCIA — brief de design (identité réelle)

## Direction
« Carnet de pointage » : encre marine, papier chaud, sarcelle izencia. Bandeau sombre en haut, cartes claires arrondies,
calendrier en pastilles colorées par type de journée. Thème sombre automatique (`prefers-color-scheme`).

## Couleurs (`style.css`, `:root`)
| Rôle | Clair | Sombre |
|---|---|---|
| Fond papier / carte | `--paper` #F2EFE8 / `--card` #FFFDF9 | #0B1A23 / #11242F |
| Encre | `--ink` #0E2A3B, secondaire `--ink-2` #4A5E6B | #EAF1F2 / #9DB0B8 |
| Bandeau | `--slab` #0E2A3B | #071219 |
| Travaillé (accent) | `--teal` #12B3A0, texte `--teal-t` #0C7A6D | texte #12B3A0 |
| Congé payé | `--cp` #F0A43A | |
| Maladie | `--mal` #C94D44, texte `--mal-t` #B0443B | texte #F07A70 |
| Exceptionnel / sans solde | `--exc` #7E62DA / `--css` #8A949B | |
| Férié | `--fer` #006A90 | #00B0F0 |

## Typographie (fichiers locaux)
- Interface : **Bricolage Grotesque** (500 à 800).
- Chiffres, totaux : **JetBrains Mono** (500 à 700).

## Formes
Rayon 16 px, ombre douce, boutons pleine largeur en bas d'écran, feuilles avec poignée, icônes SVG au trait.

## Accessibilité
Contraste AA (jamais de texte blanc sur sarcelle / orange / gris), `<h1>` masqué visuellement, `<main>`, `aria-label` sur les boutons-icônes,
toasts annoncés (`role="status"`).
