
The user wants the "Product of MRsoft" attribution more visible but still professional. Currently it only lives in the footer's bottom strip. Let me think through the best additional placements without making it look like an ad.

**Where it makes sense (professional, subtle, recurring):**

1. **Auth page (`src/pages/Auth.tsx`)** — Login/signup screens are high-trust moments. A small "Product of [MRsoft logo]" under the form builds credibility (think: "Powered by Stripe" on checkouts).

2. **Navbar (very subtle)** — A tiny "by MRsoft" tagline next to the ScraAD logo on desktop only. Risky — could clutter. I'll make it optional / behind a small divider.

3. **About section on the homepage** — One line in `AboutCourseSection` or near the bottom of the hero: "A product of MRsoft / M-R International" with the logo. Visible to every visitor but contextual.

4. **Loading splash / PWA install prompt** — Already exists (`PWAInstallPrompt.tsx`). Adding "by MRsoft" there reinforces ownership when users install.

5. **Email/transactional surfaces** — Out of scope for now (no email templates being touched).

**My recommendation — pick the 3 highest-impact, lowest-clutter spots:**

### Plan: Add "Product of MRsoft" in 3 strategic places

**1. Auth page (`src/pages/Auth.tsx`)**
- Add a small centered attribution below the auth card: `Product of [MRsoft logo]` linking to m-rinternational.com.
- Pattern: muted text + small logo, same as footer.
- High visibility: every user sees this when logging in/signing up.

**2. Homepage hero — bottom of hero section (`src/pages/Index.tsx`)**
- Add a tiny inline attribution under the hero CTAs or just above the LogoMarquee: "A product of [MRsoft logo]".
- Subtle, professional, doesn't compete with the main hero message.

**3. Dashboard sidebar footer (`src/components/DashboardSidebar.tsx`)**
- Add the attribution at the very bottom of the sidebar (below nav items, above collapse button if any).
- Logged-in users see it persistently across all dashboard pages — reinforces ownership without ever being intrusive.

**Consistent styling across all placements:**
- Same "Product of" text + white-bg rounded logo container as footer
- Logo height: `h-4` to `h-5` (smaller than footer for subtlety)
- Always linked to `https://m-rinternational.com/` with `target="_blank"` and `rel="noopener noreferrer"`
- Muted text color matching surrounding context

**Skipped on purpose:**
- Navbar: too crowded already with logo, search, nav links, CTA
- Every page footer: already has it (would be redundant)
- Course/program cards: would look like ads

**Files to edit:**
- `src/pages/Auth.tsx` — attribution under auth card
- `src/pages/Index.tsx` — attribution above LogoMarquee section
- `src/components/DashboardSidebar.tsx` — attribution at sidebar bottom

After approval I'll implement all three with consistent styling matching the footer pattern.
