Real storefront marks, lifted from the Shipmate prototype. Never redraw these.

```jsx
<PlatformIcon platform="ios" well />
<PlatformIcon platform="steam" size={18} />
```

The SVG marks inherit `currentColor`, so they sit on any surface. Set `base` when your page is not two directories deep, e.g. `base="assets"` at the project root. `PLATFORMS` exports the id → label map ("App Store", "Google Play", "Nintendo eShop"…) — use those exact names.
