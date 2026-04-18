

## What makes AQskill feel "premium" (and us feel dated)

Looking at their hero & site, the wow comes from a few specific things — none of them are technically hard:

1. **Editorial typography** — huge serif/italic accent words ("*dynamic Courses*") mixed with a clean sans. We currently use only DM Sans + a generic gradient.
2. **Hand-drawn doodles & confetti accents** — squiggles, stars, lightning, sparkles scattered around the hero. Adds personality vs. our flat blue gradient.
3. **A real lifestyle photo collage** with floating "stat pills" (26 Instructors / 65 Courses / 50K Students / 4.8 Rating) overlapping organic blob shapes.
4. **A persistent promo bar** with live countdown across the top.
5. **Soft pastel category cards** (lilac, mint, peach, cream) instead of generic muted tones.
6. **Micro-interactions everywhere** — magnetic buttons, cursor-follow blobs, tilt on cards, marquee logo strip, scroll-reveal.
7. **Generous whitespace & oversized headings** (60–80px on desktop).

## The plan — give ScraAd a "wow" pass

A focused visual & motion overhaul of the **landing page first**, then propagate the design language to Courses, Programs, and Course Details. No backend or feature changes.

### Phase 1 — Design tokens & motion library (foundation)

**`src/index.css` + `tailwind.config.ts`**
- Add an **editorial display font**: `Fraunces` (variable serif with italic) for accent words. Keep DM Sans for headings, Inter for body.
- New utility classes:
  - `.magnetic-btn` — JS-free pointer-tracking via CSS `transform`
  - `.tilt-card` — 3D perspective tilt on hover
  - `.marquee` — infinite horizontal scroll
  - `.blob` — organic SVG mask shapes
  - `.cursor-glow` — radial gradient that follows mouse
  - `.aurora-bg` — multi-layer animated mesh gradient (replacing the flat hero gradient)
- Add SVG doodle assets in `src/assets/doodles/` (squiggle, star burst, arrow, sparkle, underline) — reusable inline as decorative accents.
- New keyframes: `marquee`, `tilt`, `blob-morph`, `text-reveal` (mask-based), `bounce-soft`.

### Phase 2 — Landing page rebuild (`src/pages/Index.tsx`)

```text
┌─────────────────────────────────────────┐
│  [Promo Bar] Free trial · ⏱ 02d 14h 22m │  ← new sticky countdown
├─────────────────────────────────────────┤
│  HERO                                   │
│  ✨ doodle  ⚡ doodle                    │
│  Where ambition meets                   │
│  *opportunity* ← Fraunces italic gold   │
│              [photo collage w/ blobs]   │
│  [Search ▸]  [Get Started]              │
│                  ┌─ 10K+ Learners ──┐   │ ← floating stat pills
│                  └─ 95% Completion ─┘   │
├─────────────────────────────────────────┤
│  TRUST MARQUEE  → infinite logo scroll  │
├─────────────────────────────────────────┤
│  CATEGORIES (pastel cards, tilt, doodle│
│   underline on hover)                   │
├─────────────────────────────────────────┤
│  FEATURED COURSES (3D tilt cards w/    │
│   gradient glow on hover, play-icon)   │
├─────────────────────────────────────────┤
│  WHY SCRAAD - alternating split with   │
│   reveal-on-scroll & doodle accents    │
├─────────────────────────────────────────┤
│  TESTIMONIALS - draggable carousel +   │
│   big quote mark in Fraunces           │
├─────────────────────────────────────────┤
│  CTA banner with aurora bg + parallax  │
└─────────────────────────────────────────┘
```

Specific upgrades:
- **Hero headline**: mix DM Sans bold + Fraunces italic for the accent word, with text-reveal mask animation on load.
- **Hero visual**: replace single image with a 2-image collage inside organic blob clip-paths + 3 floating glass stat pills using `animate-float` with staggered delays.
- **Search bar**: glass-morphism with gold focus glow + suggested-search chips below ("UI/UX", "Data Analysis", "Public Speaking").
- **Promo bar**: thin top strip with live countdown (`useEffect` + `setInterval`) — dismissible.
- **Categories**: 6 pastel cards (lilac/mint/peach/cream/sky/rose) with tilt-on-hover, doodle-underline reveal, icon micro-bounce.
- **Course cards**: 3D tilt, image zoom + dark overlay + play-button reveal on hover, gradient ring border on hover.
- **Logo marquee**: "Trusted by" infinite scroll using duplicated track + `animate-marquee`.
- **Scroll reveal**: `IntersectionObserver` hook (`useReveal`) toggles `is-visible` on sections.
- **Cursor glow**: subtle 400px radial gradient follows the cursor on hero only (desktop).

### Phase 3 — Propagate language

Apply the same tokens (Fraunces accents, doodles, tilt cards, aurora CTA blocks) to:
- `src/pages/Courses.tsx` — pastel category chips, hero with editorial heading
- `src/pages/Programs.tsx` — same hero treatment
- `src/pages/CourseDetails.tsx` — Fraunces section accents, sticky enroll card with glass effect
- `src/components/Navbar.tsx` — add subtle scroll-shrink + active-link doodle underline

### Phase 4 — Performance & a11y guardrails
- All new motion respects `prefers-reduced-motion: reduce` (disable cursor-glow, marquee, tilt, parallax).
- Doodles ship as inline SVG (no extra requests).
- Fraunces loaded via `display=swap` with only the weights needed (variable, italic).
- Mobile: disable tilt + cursor-glow, keep reveal + marquee.

### Files that will change

| File | Change |
|---|---|
| `src/index.css` | Add Fraunces import, new utilities, keyframes, aurora bg, cursor-glow |
| `tailwind.config.ts` | Register `font-display`, `marquee`/`tilt`/`blob-morph`/`text-reveal` animations |
| `src/assets/doodles/*.svg` (new) | 5–6 hand-drawn SVG accents |
| `src/hooks/useReveal.ts` (new) | IntersectionObserver scroll-reveal hook |
| `src/hooks/useCursorGlow.ts` (new) | Pointer tracking for hero glow (desktop only) |
| `src/components/PromoBar.tsx` (new) | Sticky top countdown bar |
| `src/components/LogoMarquee.tsx` (new) | Infinite logo scroll |
| `src/components/TiltCard.tsx` (new) | Reusable 3D tilt wrapper |
| `src/pages/Index.tsx` | Full rebuild around new components & language |
| `src/components/CourseCard.tsx` | Tilt + gradient ring + play overlay |
| `src/pages/Courses.tsx` | New editorial hero + pastel chips |
| `src/pages/Programs.tsx` | New editorial hero |
| `src/pages/CourseDetails.tsx` | Editorial accents + glass sticky card |
| `src/components/Navbar.tsx` | Scroll-shrink + doodle active underline |

### What this delivers vs. AQskill
- Editorial typography mixing serif italic + sans → matches their personality
- Doodles + pastel palette → adds warmth and approachability we currently lack
- Tilt, marquee, scroll-reveal, cursor-glow → modern motion that reads as "premium"
- Promo bar + countdown → urgency + the same conversion pattern they use
- Photo collage with floating stat pills → more human than our single hero card

After your approval I'll switch to default mode and ship it in the order above (Phase 1 → 2 → 3 → 4), so the wow is visible after Phase 2.

