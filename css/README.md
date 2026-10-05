# Styles — current `main` branch

`css/style.css` is the shared public stylesheet for `index.html`, `category.html` and `product.html`. The pages also include inline styles. `admin.html` has its own embedded styling. This branch does not load the redesign's `css/site.css`.

The stylesheet uses custom properties and responsive rules, but the older storefront's visual language and layout are separate from `vijay-sales-theme`. Do not combine both stylesheets for the one-site release; choose and verify one version. CSS changes need desktop/mobile and keyboard-focus review because CI currently checks syntax/config/core files only, not rendered appearance.
