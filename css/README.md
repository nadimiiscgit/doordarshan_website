# css/ — Stylesheet Reference

This directory contains a single file: `style.css` — the complete design system for the Doordarshan Electronics website.

**1,389 lines** | Vanilla CSS | No preprocessors | No Tailwind | No build step

---

## Design System

### Typography
**Font**: [Outfit](https://fonts.google.com/specimen/Outfit) from Google Fonts
Weights loaded: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold), 900 (Black)

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
```

### Colour Palette (CSS Variables)

All colours defined in `:root` and referenced as `var(--name)` throughout the stylesheet:

| Variable | Hex | Usage |
|---|---|---|
| `--primary` | `#0F172A` | Main dark navy — headings, nav background |
| `--primary-light` | `#1E293B` | Slightly lighter navy |
| `--primary-dark` | `#020617` | Deepest dark — announcement bar |
| `--accent` | `#2563EB` | Electric blue — buttons, links, badges |
| `--accent-light` | `#3B82F6` | Hover state for accent |
| `--accent-pale` | `#EFF6FF` | Light blue — badge backgrounds |
| `--bg` | `#F8FAFC` | Page background (off-white) |
| `--surface` | `#FFFFFF` | Card background |
| `--surface-2` | `#F1F5F9` | Secondary surface — input backgrounds |
| `--text` | `#0F172A` | Primary body text |
| `--text-muted` | `#64748B` | Secondary text — prices, labels |
| `--text-light` | `#94A3B8` | Placeholder text |
| `--border` | `#E2E8F0` | Dividers, card borders |
| `--border-light` | `#F1F5F9` | Subtle borders |
| `--success` | `#10B981` | In-stock badge, success states |
| `--warning` | `#F59E0B` | Low-stock badge |
| `--danger` | `#EF4444` | Out-of-stock, error states |

### Spacing & Shadows

| Variable | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 2px ...` | Subtle lift |
| `--shadow-sm` | `0 2px 8px ...` | Cards at rest |
| `--shadow-md` | `0 8px 24px ...` | Cards on hover |
| `--shadow-lg` | `0 16px 40px ...` | Dropdowns, modals |
| `--shadow-xl` | `0 24px 60px ...` | Hero elements |

### Border Radius Scale

| Variable | Value | Usage |
|---|---|---|
| `--radius-xs` | `6px` | Small buttons, badges |
| `--radius-sm` | `10px` | Input fields, small cards |
| `--radius-md` | `16px` | Product cards |
| `--radius-lg` | `24px` | Section containers |
| `--radius-xl` | `32px` | Hero, large panels |

### Transitions
```css
--transition: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
--header-h: 110px; /* Height of the fixed header — used for scroll offset */
```

---

## Stylesheet Sections

`style.css` is divided into 19 named sections, in document order:

---

### 1. CSS Variables (line 8)
The `:root` block described above.

---

### 2. Reset (line 41)
Box-sizing, margin/padding reset, `img` max-width, and `* { box-sizing: border-box }`.

---

### 3. Typography (line 57)
`body` font family, line-height, background, and colour assignments.

---

### 4. Utilities (line 63)
`.container` — max-width `1280px`, centered with horizontal padding.

---

### 5. Badges (line 70)
Small inline labels used on product cards:
- `.badge` — base style (rounded pill, coloured background)
- `.badge-new` — orange gradient ("New 2026")
- `.badge-oled` — dark premium badge
- `.badge-qled` — Samsung blue badge

---

### 6. Top Announcement Bar (line 88)
The dark scrolling ticker at the very top of every page.

Classes:
- `.topbar` — dark background container
- `.topbar-inner` — flex row: scroll track + right links
- `.topbar-scroll` — overflow hidden wrapper
- `.topbar-scroll-track` — the animating `<div>` with `@keyframes scrollTicker`
- `.dot` — small coloured dot between items
- `.topbar-right` — Call / WhatsApp / Location links
- `.lang-switcher` / `.lang-btn` — EN | मराठी toggle buttons

---

### 7. Header (line 178)
The main sticky navigation header.

Classes:
- `.header` — `position: sticky; top: 0; z-index: 1000` with backdrop blur
- `.header-inner` — flex row: logo + search + actions
- `.logo` / `.logo-name` / `.logo-tagline` — store branding
- `.search-bar` — flex input row: category select + text input + search button
- `.header-actions` / `.hdr-btn` — Call, WhatsApp, Cart buttons
- `.cart-badge` — small red counter bubble on cart icon

---

### 8. Main Navigation + Mega Menu (line 316)
The category navigation bar below the header.

Classes:
- `.main-nav` / `.nav-inner` — horizontal flex bar
- `.nav-item` / `.nav-link` — individual category links with dropdown chevron
- `.mega-menu` — absolute-positioned dropdown panel with `opacity` + `transform` transition
- `.mega-col` — column inside mega menu with `h4` heading + `ul` links
- `.count` — small badge showing product count per subcategory
- `.nav-mobile-btn` / `.mobile-menu` — mobile hamburger menu system

---

### 9. Hero Slider (line 444)
Full-width banner slider at the top of the homepage.

Classes:
- `.hero` — relative container, 480px height (reduced on mobile)
- `.hero-slide` — absolute positioned, background-image cover, full width
- `.hero-content` — centred text + CTA buttons with gradient overlay
- `.hero-kicker` — small pill label above the title
- `.hero-title` — large white heading (animated fade-in)
- `.hero-subtitle` — subheading text
- `.hero-actions` — CTA button row
- `.hero-arrow` — prev/next navigation buttons
- `.hero-dots` / `.hero-dot` — slide indicator dots

---

### 10. Offer Strip (line 576)
The horizontally animated deals ticker below the hero.

Classes:
- `.offer-strip` — dark gradient background container
- `.offer-strip-track` — `@keyframes marqueeScroll` infinite scroll
- `.offer-item` — individual deal text
- `.sep` — `|` divider between items

---

### 11. Section Headers (line 605)
Reusable section title + subtitle layout used across all homepage sections.

Classes:
- `.section-header` — flex row: title block + view-all link
- `.section-title h2` — large section heading
- `.section-title p` — smaller subtitle
- `.view-all` — right-aligned "View All →" link

---

### 12. Category Grid (line 643)
The "Shop by Category" cards grid.

Classes:
- `.categories-section` — padded section wrapper
- `.categories-grid` — horizontal scroll container (CSS scroll snap on mobile)
- `.cat-card` — individual category card with hover lift
- `.cat-icon` — large emoji icon
- `.cat-name` — category label
- `.cat-count` — product count

---

### 13. Product Cards (line 693)
The most complex component — used everywhere products appear.

Classes:
- `.product-grid-4` — 4-column grid (responsive down to 1 column)
- `.product-card` — card container with border, shadow, hover-lift animation
- `.product-img-wrap` — fixed-height image container
- `.product-img-placeholder` — brand-coloured fallback when image fails
- `.product-brand-logo` — brand name in placeholder
- `.product-badges` — absolute-positioned badge overlay
- `.product-discount` — red percentage badge (top-right corner)
- `.wishlist-btn` — heart button on image
- `.product-info` — text content below image
- `.product-brand` — small brand label
- `.product-name` — product title link
- `.product-model` — model number
- `.product-rating` / `.stars` — star display
- `.product-price` — price row
- `.price-current` — sale price (large, bold)
- `.price-mrp` — crossed-out original price
- `.price-save` — discount percentage
- `.product-stock` / `.stock-in` / `.stock-low` / `.stock-out` — stock status chips
- `.add-to-cart-btn` — "Add to Cart" + WhatsApp buttons

---

### 14. Horizontal Scroll Strip (line 889)
Makes product grids horizontally scrollable on mobile and desktop.

Classes:
- `.scroll-strip` — `overflow-x: auto; display: flex; gap: 16px`
- Hides scrollbar on webkit / Firefox
- Individual cards inside have `min-width: 260px; flex: 0 0 auto`

---

### 15. Deal of the Day (line 906)
Countdown timer section.

Classes:
- `.deals-section` — dark gradient background
- `.deals-wrapper` / `.deals-header` — layout containers
- `.deal-timer` — flex row of timer blocks
- `.timer-block` — individual H/M/S block
- `.timer-num` — large number display
- `.timer-label` — "Hours" / "Mins" / "Secs" label
- `.timer-sep` — `:` separator

---

### 16. Brand Strip (line 942)
Scrollable brand logo row.

Classes:
- `.brands-section` / `.brands-grid` — horizontal scroll container
- `.brand-card` — individual brand pill with name
- `.brand-img` — brand logo (emoji or image)

---

### 17. Why Us (line 977)
4-card "Why Choose Us" grid.

Classes:
- `.why-grid` — 4-column grid (2 on tablet, 1 on mobile)
- `.why-card` — card with hover lift + top border accent
- `.why-icon` — large emoji icon
- `.why-card h3` — card title
- `.why-card p` — card description

---

### 18. Footer (line 1011)
Site footer with brand, category links, brand links, help links, copyright.

Classes:
- `.footer` — dark background footer
- `.footer-grid` — 4-column grid layout
- `.footer-brand` — logo + description + contact links column
- `.footer-desc` — paragraph description
- `.footer-contact` — call/WhatsApp/address links
- `.footer-col` — standard link column
- `.footer-col h4` — column heading
- `.footer-col ul / li / a` — link items
- `.footer-bottom` — copyright row + social icons
- `.footer-social` / `.social-btn` — Facebook / WhatsApp / Instagram icons
- `.current-year` — JS-updated year span

---

### 19. Toast Notification (line 1085)
Floating toast system managed by `cart.js`.

Classes:
- `.toast-container` — fixed bottom-right stack
- `.toast` — individual notification with slide-in animation
- `.toast.error` — red variant

---

### 20. Mobile Menu Toggle (line 1118)
Hamburger button for mobile navigation.

Classes:
- `.mobile-menu-btn` — 3-bar icon button (visible on mobile)
- `.mobile-menu` — slide-down panel overlay

---

### 21. Section Spacing (line 1139)
`.section`, `.section-light` utility classes for consistent `padding: 60px 0` vertical rhythm.

---

### 22. Touch Device Support & Mobile Visibility (line 1147)
- Touch-action settings for horizontal scroll containers
- `.desktop-only` / `.mobile-only` visibility classes

---

### 23. Universal Horizontal Scrollable Containers (line 1159)
Applied to any element with class `.scroll-x`:
- `overflow-x: auto`
- `-webkit-overflow-scrolling: touch`
- Hidden scrollbar (cross-browser)
- `scroll-snap-type: x mandatory`

Also applied to `.main-nav .nav-inner`, `.topbar-scroll-track`, `.categories-grid`, `.brands-grid`, `.subcat-tabs` for consistent scrollable behaviour.

---

### 24. Responsive Overrides for Mobile (line 1242)
`@media (max-width: 768px)` and `@media (max-width: 480px)` blocks:

| Element | Mobile behaviour |
|---|---|
| Header | Collapses to 2-row layout |
| Search bar | Hides category select on small screens |
| Hero | Height reduced to 340px, font sizes smaller |
| Product grid | 2 columns at 768px, 1 column at 480px |
| Why Us grid | 2 columns at 768px, 1 column at 480px |
| Footer grid | 2 columns at 768px, 1 column at 480px |
| Mega menu | Hidden on mobile (replaced by mobile menu) |

---

## How to Modify the Theme

### Change accent colour
```css
/* In :root */
--accent: #your-colour;
--accent-light: #lighter-shade;
--accent-pale: #very-light-shade;
```

### Add a new section
1. Add HTML to the relevant `.html` file
2. Add a new named section comment block in `style.css`:
   ```css
   /* ══════════════════════════════════════════════
      YOUR SECTION NAME
   ══════════════════════════════════════════════ */
   .your-class { ... }
   ```
3. Add responsive overrides at the bottom of the `@media` block

### Change typography
Replace the Google Fonts import URL and update:
```css
body { font-family: 'YourFont', sans-serif; }
```
