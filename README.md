# SR Ventures — Website

A static marketing website for **SR Ventures**, a turnkey home builder and interior design studio based in Kerala, India. The site features a scroll-scrubbed hero (WebP frame sequence), a pinned "Umbrella Concept" section that fans open across 7 service stages (Plan → Design → Estimate → Build → Curate → Greens → Care), and a portfolio grid.

## Tech

- Plain **HTML / CSS / JavaScript** — no build step
- [GSAP 3](https://gsap.com/) + **ScrollTrigger** for scroll animations (loaded via CDN)
- [Lenis](https://github.com/darkroomengineering/lenis) for smooth scrolling (via CDN)

## Running locally

The site uses `fetch`/module scripts and an image sequence, so it must be served over HTTP (opening `index.html` directly via `file://` will not work correctly).

From this folder, start any static server, e.g.:

```bash
# Python 3
python -m http.server 8000
```

Then open <http://localhost:8000/index.html>.

## Structure

```
index.html          # Home (hero scrub, umbrella concept, services, contact)
portfolio.html      # Portfolio grid
css/style.css       # All styles
js/app.js           # Home animations (GSAP/ScrollTrigger, umbrella, hero scrub)
js/portfolio.js     # Portfolio rendering
js/portfolio-data.js # Portfolio items (Sanity-ready data shape)
Images/             # Photos, logo, WebP variants (web/)
frames/             # WebP frame sequence for the scroll-scrub hero
robots.txt, sitemap.xml, llms.txt
```
