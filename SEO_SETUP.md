# SEO & Deployment Notes

These five files are meant to sit directly in your GitHub repo root:

```
/index.html
/script.js
/styles.css
/sitemap.xml
/robots.txt
```

## 1. Live production domain
`index.html`, `sitemap.xml`, and `robots.txt` are all set to your live URL:

```
https://all-in-one-creator-studio.vercel.app/
```

That covers `index.html`'s `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`, and JSON-LD `url` field; `sitemap.xml`'s `<loc>` entry; and `robots.txt`'s `Sitemap:` line — no placeholder text should remain in any of the four files.

If you ever move to a different domain (a custom domain instead of the `.vercel.app` one, for example), search each of those four files for `all-in-one-creator-studio.vercel.app` and swap it for the new URL.

## 2. Add a real Open Graph image (optional but recommended)
`index.html` currently points `og:image` / `twitter:image` at `/og-image.png`, which doesn't exist yet. Social previews (Twitter/X, LinkedIn, Discord, Slack) will fall back to no image until you add one. Recommended: a 1200×630px PNG or JPG named `og-image.png` dropped in the repo root (so it resolves at `https://all-in-one-creator-studio.vercel.app/og-image.png`).

## 3. Submit to Google Search Console
Once deployed:
1. Add and verify your property (`https://all-in-one-creator-studio.vercel.app/`) in [Search Console](https://search.google.com/search-console).
2. Submit `https://all-in-one-creator-studio.vercel.app/sitemap.xml` under **Sitemaps**.
3. Use **URL Inspection** → **Request Indexing** on the homepage to speed up first crawl.

## 4. Why the sitemap only has one URL
This is a single-page app — Home, Photo Tools, Video Tools, and PDF Tools are tab panels inside `index.html`, not separate pages. One `<url>` entry is correct and expected; there's nothing missing. If you later split tools onto their own routes/pages, add each as its own `<url>` entry.

## 5. Heading structure (already in place)
- One `<h1>` — the page title, "All-in-One Creator."
- `<h2>` for each major panel heading (Creator Calculators & Revenue Tools, Background Eraser & Photo Studio, Video Trim & Resize Suite, PDF Utility Tools).
- `<h3>` for subsections (Revenue & Analytics Calculators, Creator Insights & Daily Guides).
- `<h4>` for individual tool/article card titles.

No changes needed here unless you add new sections — just keep new headings nested under the right level.
