# CSS inventory

> Updated 30 September 2026. The stylesheet layout has changed from the older `style.css`-first architecture described in previous documentation.

## Current stylesheet usage

| Consumer | Styles currently used |
|---|---|
| `index.html` | `css/v2-fonts.css`, `css/v2-tailwind.css`, a large amount of generated inline CSS, and utility classes in the static markup |
| `category.html` | `css/v2-tailwind.css` plus inline page styles and utility classes |
| `product.html` | `css/v2-tailwind.css` plus inline page styles and utility classes |
| `admin.html` | Large embedded `<style>` block; does not load the shared CSS files |
| `about.html` / `contact.html` | Page-specific utility/inline styling; no current reference to `style.css` |

## Files

### `style.css`

This is the older handcrafted design system. It contains the original navigation, hero, product-card, cart, toast, mobile-menu, and footer classes. It is currently not referenced by the active HTML pages.

Treat it as legacy until the runtime migration is completed. Editing it will not necessarily affect the deployed homepage, category page, product page, or admin panel.

### `v2-tailwind.css`

Generated/compiled utility stylesheet used by the current homepage, category page, and product page. It is currently the main shared visual dependency for the V2 markup.

The generated file is difficult to maintain directly. Prefer changing the source/template process that produced it, or replace it with a deliberate build pipeline before making extensive visual changes.

### `v2-fonts.css`

Font-variable support for the generated homepage markup. The pages also reference Google Fonts directly.

### Inline styles

Inline styles are present in the generated homepage, product page, category page, and admin page. They create page-specific behavior and make global design changes harder to reason about.

## Current design-system risks

- There are multiple visual systems: legacy `style.css`, generated V2 utilities, inline styles, and admin-only styles.
- Shared header/footer markup is duplicated across pages.
- CSS changes cannot be validated from `style.css` alone because the active pages primarily use V2 utility classes.
- The generated homepage is very large and includes embedded style content.
- There is no CSS build, linting, visual regression test, or unused-style detection.
- Responsive and accessibility behavior is implemented independently by page/runtime.

## Recommended CSS direction

1. Select one active design system and archive the unused alternative.
2. Extract shared layout primitives for header, navigation, footer, cards, buttons, forms, and status badges.
3. Keep product/category/admin styles in versioned external files rather than large inline blocks.
4. Use design tokens for colours, spacing, typography, radii, and focus states.
5. Add visible keyboard focus styles and respect `prefers-reduced-motion` for sliders and animated strips.
6. Add responsive smoke checks for small phones, tablets, and desktop widths.
7. Add a visual regression check before replacing the generated V2 homepage.

## Accessibility checklist

- [ ] Every meaningful product image has a descriptive `alt` value.
- [ ] Decorative SVGs use `aria-hidden="true"`.
- [ ] Icon-only buttons have accessible names.
- [ ] Modal and drawer focus is trapped and restored.
- [ ] Menus work with keyboard input, not only mouse hover.
- [ ] Text and status colours meet contrast requirements.
- [ ] Motion can be reduced or disabled.
- [ ] Layout shifts are limited by image dimensions/aspect ratios.
