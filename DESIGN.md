# Design System Document: The Artful Keepsake
 
## 1. Overview & Creative North Star
 
**Creative North Star: "The Curated Scrapbook"**
This design system moves away from the cold, clinical precision of traditional tech interfaces. Instead, it embraces the warmth of a high-end art monograph mixed with the intimate, joyful soul of a personal scrapbook. We are not just building a portfolio; we are creating a digital home for the "personalities" of our subjects.
 
The system breaks the "template" look through **Intentional Asymmetry** and **Organic Overlap**. Rather than placing images in rigid boxes, elements should feel as if they were placed by hand on a studio table. We use high-contrast typography scales—pairing a statuesque serif with a breathing sans-serif—to signal professional quality, while handwritten callouts provide the "artist’s touch" that builds immediate trust and approachability.
 
---
 
## 2. Colors & Tonal Depth
 
The palette is rooted in the warmth of a sun-drenched studio. It avoids pure whites and harsh blacks to maintain a tactile, "paper-like" quality.
 
### Surface Hierarchy & The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or containment. Boundaries must be defined through background color shifts.
*   **The Layering Principle:** Treat the UI as physical layers of fine paper. 
    *   Use `surface` (#fefcf4) as your primary canvas.
    *   Use `surface-container-low` (#fbfaef) for large structural sections (e.g., a "Process" section).
    *   Use `surface-container-highest` (#e8ead7) for high-emphasis interactive areas.
*   **The Glass & Gradient Rule:** To add "soul" to the digital experience, use subtle gradients on primary actions, transitioning from `primary` (#845e00) to `primary-container` (#fcb812). This mimics the way light hits a thick stroke of oil paint.
*   **Signature Textures:** Floating elements (like navigation bars or "Artist Note" pop-ups) should utilize Glassmorphism. Apply a semi-transparent `surface` color with a 20px backdrop-blur to allow the organic background shapes to peek through, creating a sense of integrated depth.
 
---
 
## 3. Typography
 
The typography strategy is a conversation between "The Artist" (the serif) and "The Friend" (the sans-serif).
 
*   **Display & Headlines (Noto Serif):** Use `display-lg` through `headline-sm` for all major storytelling moments. The serif provides the "High-End Editorial" feel, suggesting the artist’s work is gallery-worthy.
*   **Body & Titles (Plus Jakarta Sans):** Use `title-lg` for subheaders and `body-lg/md` for all descriptive text. This font is chosen for its high x-height and friendly apertures, ensuring readability and a modern, approachable tone.
*   **Artist Notes (Be Vietnam Pro / Label Scale):** Use `label-md` and `label-sm` for "Artist Notes." While these are functional labels in the code, they should be styled with a "handwritten" spirit—perhaps rotated by 1–2 degrees or placed inside organic "blob" shapes to look like sticky notes or marginalia.
 
---
 
## 4. Elevation & Depth
 
We achieve hierarchy through **Tonal Layering** rather than structural lines or heavy shadows.
 
*   **Ambient Shadows:** When a card or image needs to "float," use a shadow with a large blur (30px+) and very low opacity (6%). The shadow color must be a tinted version of `on-surface` (#36392c) rather than a neutral grey, ensuring the shadow feels like it is falling on a warm ivory surface.
*   **The "Ghost Border" Fallback:** For accessibility in input fields, use the `outline-variant` (#b9bbaa) at 20% opacity. It should feel like a faint pencil sketch, not a hard ink line.
*   **The "Cuddle" Effect (Overlapping):** Encourage elements to overlap. A photo container should slightly "tuck" under a text block or sit atop an organic background blob. This breaks the grid and makes the layout feel custom-crafted.
 
---
 
## 5. Components
 
### Buttons
*   **Primary:** High-pill shape (`rounded-full`). Use the signature gradient (Primary to Primary-Container). No border. Label should be `title-sm` in `on-primary`.
*   **Secondary:** `surface-container-highest` background with `primary` text. Provides a soft, tactile feel.
*   **Hover State:** Increase the `surface-tint` or slightly shift the gradient angle to create a "glow" effect rather than a simple color darken.
 
### Cards & Gallery Items
*   **Construction:** Forbidden: Divider lines or 1px borders. 
*   **Style:** Use `surface-container-lowest` (#ffffff) on a `surface-container` background to create a "lifted paper" look. Apply a `md` (1.5rem) or `lg` (2rem) corner radius.
*   **Spacing:** Use generous vertical white space (32px+) from the spacing scale to separate content types.
 
### Chips (Pet Tags)
*   **Style:** Use `secondary-container` (#ffdad8) with `on-secondary-container` (#912f32) text. These should look like little "love notes" or tags, using `rounded-full` for a soft, friendly appearance.
 
### Input Fields
*   **Style:** Background should be `surface-container-low`. The bottom border is a "Ghost Border" (10% opacity `outline`). When focused, the background shifts to `surface-container-highest` with a 2px `primary` bottom indicator.
 
### Custom Component: "The Artist’s Blob"
*   A non-interactive background element using `surface-variant` or `primary-fixed-dim`. These are organic, non-geometric shapes that sit behind portrait photos or testimonial blocks to soften the layout's edges.
 
---
 
## 6. Do's and Don'ts
 
### Do:
*   **DO** use intentional asymmetry. If a headline is left-aligned, try right-aligning the body text below it to create visual tension.
*   **DO** treat animal photos with a high corner radius (`xl` / 3rem). They should feel like soft "windows" into the pet's life.
*   **DO** use the handwritten callouts (Artist Notes) to explain "The Why" behind a portrait—it builds the "personality" and "love" mentioned in the North Star.
 
### Don't:
*   **DON'T** use 100% black. The "friendly charcoal" `on-background` (#36392c) is your darkest point.
*   **DON'T** ever use a 1px solid border to separate two sections. Use a shift from `surface` to `surface-container-low` instead.
*   **DON'T** use perfectly square corners. Everything must have a minimum of `sm` (0.5rem) rounding to maintain the "approachable" vibe.
*   **DON'T** crowd the elements. This system requires "Editorial Breathing Room"—if in doubt, add more whitespace.