# Tailwind build (replaces cdn.tailwindcss.com)

One-time setup (needs Node.js 18+):

    npm install
    npm run build:css      # creates css/tailwind.css  (do this BEFORE uploading index.html)

While editing:  npm run watch:css
After changing index.html classes: run build:css again and commit css/tailwind.css.
If you ever get a service-worker cache, bump the ?v= on the <link> in index.html.
