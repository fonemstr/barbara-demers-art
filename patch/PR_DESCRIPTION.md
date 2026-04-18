# Integrate the "Curated Scrapbook" design system

Ports the site chrome + landing page to the design system defined in
`DESIGN.md` ("The Curated Scrapbook"). Replaces the placeholder
Inter/Fraunces palette with the real token layer (Noto Serif + Plus
Jakarta Sans + Be Vietnam Pro, ochre/paw-pink/sage palette, layered
paper surfaces, organic blobs, Artist Notes), and introduces a small set
of reusable UI primitives.

Everything ships as one commit per your ask.

---

## What changed

### 1. Design tokens — `src/app/globals.css`
- Full token layer from `DESIGN.md` / `colors_and_type.css`: surface
  hierarchy (no-line rule), friendly-charcoal content scale, ochre
  primary + signature gradient, paw-pink secondary, sage tertiary,
  ghost-pencil outline, tinted ambient shadows, motion easings, glass
  blur.
- Tailwind v4 `@theme inline` mapping so every token is a utility class:
  `bg-surface`, `text-on-surface-muted`, `bg-surface-container-low`,
  `rounded-xl` (48px), `shadow-lifted`, etc.
- Legacy aliases (`--background`, `--foreground`, `--muted`, `--accent`,
  `--border`, `--card`) are preserved and remapped, so existing
  routes (about, gallery, commissions, blog, checkout) keep compiling
  unchanged until they're migrated in a follow-up PR.
- Base styles for html/body + headings set the new font stack.
- `.artist-note`, `.blob`, `.btn-primary-face` utility primitives.

### 2. Fonts — `src/app/(site)/layout.tsx`
- Drop `next/font` imports for Inter + Fraunces.
- Add `Noto Serif` (serif, "The Artist"), `Plus Jakarta Sans` (sans,
  "The Friend"), and `Be Vietnam Pro` (note labels). CSS variables
  `--font-noto-serif`, `--font-plus-jakarta`, `--font-be-vietnam` flow
  through Tailwind's `font-serif`, `font-sans`, `font-note`.
- Nav: glass-blurred paper background over the hero (no hairline), adds
  a "Commission a piece" primary CTA button inline with the nav items.
- Footer: uses a surface-container-low fill instead of a 1px divider
  (DESIGN.md §6 Don't: never use 1px borders to separate sections).

### 3. New UI primitives — `src/components/ui/`
- `button.tsx` — `<Button>` + `<ButtonLink>` with `primary`
  (signature ochre gradient), `secondary` (surface-container-highest
  with primary text), `dark` (inverted), `ghost` variants; `sm`/`md`/
  `lg` sizes. All rounded-full per DESIGN.md §5.
- `chip.tsx` — paw-pink "love note" tag.
- `eyebrow.tsx` — small-caps editorial label above headlines.
- `artist-note.tsx` — rotated sticky-note badge for marginalia.
- `blob.tsx` — organic background shape for photo/testimonial backings.

### 4. Components refreshed — `src/components/`
- `painting-card.tsx` — lifted-paper image with 48px rounded corners
  (the "soft window into the pet's life"), ambient tinted shadow,
  gentle hover scale, removed the grey `bg-muted` placeholder in favour
  of `bg-surface-container`.
- `newsletter-form.tsx` — inline pill form (input + button merged into
  one rounded-full container on a lifted white paper tile). Uses the
  new `<Button>`.
- Neither component's public API changed — they still take the same
  props, so nothing else has to move.

### 5. Landing page — `src/app/(site)/page.tsx`
Full rewrite into five sections per the prototype:
1. **Hero** — asymmetric grid, overlapping "Currently on the easel"
   mini-card tucked under the hero image, ArtistNote pill, two organic
   blobs in the background, italic "wags" word accent in the headline.
2. **Gallery of Personalities** — featured paintings on a
   `surface-container-low` section so the cards feel lifted.
3. **A lover first, an artist second** — 2-col block with a rotated
   ochre testimonial card and a secondary painting image.
4. **Process** — 4 numbered steps on lifted-paper tiles (italic serif
   numerals in primary ochre).
5. **Join the pack** — centered newsletter with a rotated ArtistNote
   ("Two emails a month, max.") above the pill form.

Data: consumes the existing Payload-backed `getFeaturedPaintings` and
`getAllPaintings` — no changes to the data layer, no new collections.
The hero image is the first featured painting; the "lover first" block
uses the second. When paintings are added/removed in Payload admin, the
landing picks them up.

---

## What didn't change

- `src/data/paintings.ts`, `src/collections/Paintings.ts`, all Payload
  config, API routes, Stripe/Resend plumbing, blog/gallery/commissions
  pages. Untouched.
- `next.config.ts`, `tsconfig.json`, `package.json` (no new deps —
  Noto Serif, Plus Jakarta Sans, and Be Vietnam Pro are Google Fonts
  already available via `next/font`).

---

## Out of scope for this PR (flagged as follow-ups)

- **Gallery, painting-detail, commissions, about, blog, checkout
  pages** — still render with the old chrome via the legacy token
  aliases. They'll look fine (same palette underneath) but won't use
  the new editorial layout system until a follow-up pass.
- **Real paintings** — `next.config.ts` still has
  `dangerouslyAllowSVG: true` and the seed falls back to `/paintings/
  placeholder-N.svg`. Once real photos are uploaded to Payload /
  Vercel Blob, both can go. The current DB-backed pipeline already
  works for real images without code changes.
- **Logo / wordmark** — still plain text. Explored signature/monogram
  options in prototype but settled on pure text for now.

---

## Review checklist

- [ ] `pnpm dev` starts cleanly, landing page renders without console
      errors.
- [ ] `pnpm build` passes (all old pages still compile against the
      legacy aliases).
- [ ] Fonts load: Noto Serif for display/headings, Plus Jakarta Sans
      for body, Be Vietnam Pro visible in Artist Notes.
- [ ] Hero overlap, blobs, and mini-card layout correct at
      375 / 768 / 1280 / 1920 breakpoints.
- [ ] Featured paintings show from Payload when available, seed when
      not.
- [ ] Newsletter pill form posts to `/api/newsletter` and shows the
      success message.
- [ ] No 1px section dividers anywhere (see DESIGN.md §6 Don't).
- [ ] Lighthouse contrast — Artist Notes (paw-pink on pink) and
      on-surface-subtle captions both pass WCAG AA.

## Screenshots to attach to the PR

- Landing hero (desktop + mobile)
- Gallery of Personalities section
- "Lover first" block with rotated testimonial
- Process section
- Newsletter closer
- Before/after of nav + footer
