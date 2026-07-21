## Plan: Export UI for Figma Import

### What I can deliver
React code cannot be imported directly into Figma as editable layers. Instead, I will generate a **Figma handoff kit** — a structured bundle of screenshots, component assets, and design-system specs that lets you rebuild every screen quickly in Figma.

### Deliverables

1. **Full-page screen captures**
   - Public pages: Landing, Programs, Program Details, Course Details, Auth (login/signup).
   - Authenticated pages: Student Dashboard, Program Dashboard, Learning, CBT Exam, Billing, Program Application.
   - Admin pages: Program Management, Enrollments, Ads Manager, Popup Ads Manager, Email/Domain settings.
   - Each screen captured at desktop (1280px) and mobile (375px) where applicable.

2. **Isolated component kit**
   - Key components rendered standalone: program cards, course cards, badges, buttons, modals, forms, tab bars, stats, progress bars, tables, ad popups, floating ads, empty states.
   - Each exported with a transparent or neutral background and annotated with dimensions.

3. **Design system spec document**
   - Colors: hex values for Deep Blue, Gold/Orange, neutrals, semantic states.
   - Typography: DM Sans / Inter scale, sizes, weights, line heights.
   - Spacing: border radius (0.75rem), padding/scale grid.
   - Shadows, elevations, CTA styles.
   - Icon set reference (Lucide icons used).

4. **Brand asset exports**
   - ScraAD logo and MRsoft logo at 2× and 3× resolution.
   - Any custom images/hero assets used in the app.

5. **Output format**
   - A single downloadable bundle (`/mnt/documents/figma-handoff-kit.zip`) containing:
     - `screenshots/` — full pages by section.
     - `components/` — isolated component PNGs.
     - `assets/` — logos and brand images.
     - `design-system.md` — token/spec reference.
     - `screens-map.md` — index of what each screenshot shows.

### Approach
- Use Playwright to navigate the live app at `http://localhost:8080` and capture full-page screenshots.
- For authenticated screens, restore the managed session from `LOVABLE_BROWSER_SUPABASE_*` environment variables.
- For admin screens, verify the current user has admin access first; if not, note that admin screens cannot be captured and ask you to trigger them from the preview.
- Render isolated components in a temporary Vite page or capture them via screenshots of the UI they appear in.
- Collect design tokens from `src/styles/`, `tailwind.config.ts`, `index.css`, and component usage.
- Package everything into a zip and write it to `/mnt/documents/`.

### Questions / Dependencies
- Admin/authenticated screenshots require an active session. If the injected session is not present, I will capture public pages only and flag the authenticated ones for you to provide access.
- Some modals (application form, payment, manual enrollment) require interaction to reveal. I will script those flows where possible.
- If you want me to skip certain screens or add extra states (e.g., empty state, error state, loading state), tell me before I start capturing.

### Estimated result
A ready-to-download ZIP that you can unzip and drag into Figma frames, plus a markdown spec sheet you can paste into a Figma file as reference.