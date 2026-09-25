# The Noctis Society

Observation, Calibration, Continuity.

Static HTML, CSS, and JavaScript site in `public/`. The original PNG crests are preserved in `public/assets/`; optimized WebP copies serve the public interface. No framework, external fonts, analytics, or third-party scripts are required.

The existing Cloudflare Workers Builds integration deploys the production branch `main`. Keep the existing domain and hosting configuration intact. A normal revert of the release commit restores the prior site through the same integration.

The contact console sends briefs from the page through `POST /api/brief` in a Cloudflare Worker. The Worker validates requests, rate-limits submissions, and uses a restricted Send Email binding to deliver to the existing verified support inbox. Briefs are not stored by the site. Direct email remains available as a fallback. Never describe this interface as encrypted intake or a secure document portal.

The opening transition runs once per browser storage profile and is skipped for reduced motion, direct section links, and unavailable storage. Native links, disclosures, and direct email contact remain usable without JavaScript. Reduced-motion rules disable decorative animation and parallax.

Local preview: install dependencies with `pnpm install`, then run `pnpm dev`. Run `pnpm test` and `pnpm check` before publishing. Check all five pages at phone and desktop widths, including native dossier disclosures, archive anchors, the mobile menu, and brief sending/error states. Local Send Email bindings cannot confirm production delivery; verify a live test submission after deployment.
