# Stylesheet ownership

`site.css` is the active public design system: warm off-white surfaces, deep blue typography, a restrained warm accent, responsive category/product grids, detail and store layouts, and visible keyboard focus. Public pages use this one stylesheet.

`v2-tailwind.css`, `v2-fonts.css`, and `style.css` remain as unwired legacy assets. `admin.html` still contains its own embedded admin styling; it has not been redesigned with `site.css`. Do not reattach legacy styles to public pages without testing for copied retail patterns and cascade conflicts.
