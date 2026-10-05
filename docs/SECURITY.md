# Security and rollout controls

This is a repository-level description, **not proof of deployed Supabase or Vercel settings**. Neither `docs/database-preparation.sql` nor `docs/database-security-hardening.sql` has been applied from this workspace.

## Database release gate

1. In Supabase, inspect `pg_policies`, grants, table columns/types, Auth users and Storage policies. Preserve a verified backup and test both scripts in staging. The additive preparation script creates the projection/allowlist/content editor while leaving old public base reads in place. All existing products start unapproved in the new projection.
2. Create/verify exactly the intended owner Auth account(s) and insert their UUIDs into `public.site_admins` from the trusted SQL Editor. Example shape: `insert into public.site_admins(user_id) values ('<verified-auth-uuid>');`. Do not infer admins from all `authenticated` users or user-editable metadata. Review and approve products while the preview is running.
3. After the new site is live and verified, run the hardening SQL. It removes existing products/categories/site-content policies, revokes and regrants Data API privileges, and restricts image mutations; these are material changes. The old site will no longer work against the locked-down base table. Test Storage policies for any additional broad grants the script did not name.
4. Test signed-out visitor: only `catalogue_products`, category fields and published site content readable; no base `products` access or writes. Test ordinary authenticated user: public projection but no base-table reads/writes or admin content. Test allowlisted owner: product/category/content writes and image upload work, and the trigger syncs approval/unapproval. Run Supabase security advisors.
5. Confirm `products.is_approved` is false for legacy rows before content review. Audit source rates and claims, then approve records one by one. Catalogue CSV imports and bulk image changes unapprove affected rows for re-review.

The browser's publishable key is public. RLS/grants, not the admin login form, protect writes. The admin UI checks the `site_admins` allowlist for UX; this is not a replacement for database policy enforcement. The one-level content restore is transactional through an invoker RPC and inherits update RLS.

## Browser and content boundaries

Public pages insert database strings using `textContent`; images use URL validation and on-error neutral placeholders. URLs resembling brand-logo paths are not shown as product photos. Public queries use the dedicated approved projection and never show snapshot rates or stock. The active admin product/category/bulk tables escape stored text in templates; more inline/legacy admin code remains and needs a complete sink audit. Uploads check MIME, file signature, 5 MB size and, where supported, dimensions; server-side bucket restrictions still matter.

`vercel.json` retains CSP with `unsafe-inline` because the admin uses inline scripts and handlers. It is not a strict CSP. The Supabase CDN version is pinned but not self-hosted or integrity-checked. The enforced image source is still broad (`https:`) because remote product image hosts have not been fully inventoried. The old report-only header with an incomplete image-host list was removed to avoid false-positive console violations. Tighten headers only after browser console and live image tests.

No browser-side action is an order confirmation. The website does not collect payment, reserve inventory, or promise availability; the store handles the enquiry directly.

## GitHub and deployment

CI checks syntax, assets, architecture, public catalogue boundaries and CSV/catalogue tests. GitHub protection is configured on `main` to require pull requests and the `Security, Linting & Architecture Guardrails` check, with bypass disabled for everyone. Separate review approvals are not required, and blocking behavior has not yet been tested with an intentionally failing PR. The previous maintenance workflow committed raw public REST table dumps into the repository; the redesigned branch replaces it with a read-only drift check using a publishable key in the `apikey` header. It needs GitHub's `SUPABASE_URL` variable and `SUPABASE_ANON_KEY` secret; its weekly schedule runs only when the workflow is on the default branch. This check is **not** a backup. Existing historical backups, if present on GitHub, must be reviewed separately and removed through a deliberate data-retention process if sensitive.
