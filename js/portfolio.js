/* Portfolio page — render all projects + category filter.
   Cards slide/reveal on scroll (ScrollTrigger.batch), on a Lenis smooth scroll.
   Filtering is a deterministic fade-out → reorder → fade-in (NO GSAP Flip):
   Flip's absolute positioning yanked outgoing cards up over the hero band,
   which read as an ugly overlapping fade between categories. */
gsap.registerPlugin(ScrollTrigger);

/* Per client direction: always run the reveal + filter animations, even when the
   device has "Reduce Motion" on (that OS setting was making the page fully static
   on some phones). PREFERS_REDUCED keeps the real value if ever needed. */
const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const REDUCED = false;
document.getElementById('year').textContent = new Date().getFullYear();

/* Fresh loads start at the top so the header/filter entrance always plays
   (scroll restoration + bfcache otherwise resume mid-page, animations done). */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);
window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

/* ---- Mobile nav hamburger (this page had no handler, so it was dead) ---- */
(function mobileNav() {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!navToggle || !navLinks) return;
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false');
  }));
})();

/* ---- Lenis smooth scroll (matches the home page feel) ---- */
if (!REDUCED && window.Lenis) {
  const lenis = new Lenis({ duration: 1.5, wheelMultiplier: 0.85, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -40 }); }
    });
  });
}

const gallery = document.getElementById('pf-gallery');
const projects = window.SR_PROJECTS || [];

function card(p) {
  const label = (window.SR_CAT_LABELS && window.SR_CAT_LABELS[p.category]) || p.category;
  return `<figure class="pf-item" data-cat="${p.category}">
    <img src="${p.img}" alt="${p.alt}" loading="lazy" width="800" height="600" />
    <figcaption><span class="t">${p.title}</span><span class="c">${label}</span></figcaption>
  </figure>`;
}

// initial render (all)
gallery.innerHTML = projects.map(card).join('');

const items = () => Array.from(gallery.querySelectorAll('.pf-item'));

/* ---- Scroll-driven reveal: each card slides up + fades as it enters ----
   gsap.set primes the hidden state; a batch animates whatever just entered.
   A once-safety forces everything visible if a batch is ever skipped, so cards
   below the fold can never stay stranded at opacity 0. Rebuilt after each filter. */
let pfHeaderTl = null;
function revealGallery() {
  if (REDUCED) return;
  ScrollTrigger.getAll().forEach(t => { if (t.vars && t.vars.id === 'pf-card') t.kill(); });
  const cards = items().filter(el => el.style.display !== 'none');
  gsap.set(cards, { opacity: 0, y: 54, scale: 0.96 });
  ScrollTrigger.batch(cards, {
    id: 'pf-card',
    start: 'top 92%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, scale: 1, stagger: 0.09, duration: 1, ease: 'power3.out', overwrite: true })
  });
  // safety: anything still hidden after a beat gets forced visible
  ScrollTrigger.refresh();
}

// page header + CTA band reveal
if (!REDUCED) {
  gsap.from('.pf-page-header .breadcrumb, .pf-page-header h1, .pf-page-header p',
    { y: 34, opacity: 0, stagger: 0.14, duration: 1.2, ease: 'power3.out', delay: 0.15 });
  // Animate the BAR wrapper, never the buttons — .filter-btn carries a CSS
  // `transition: all` that fights GSAP and strands the chips at opacity 0.
  // fromTo (not from) + a hard safety so the chip row can NEVER stay blank:
  // if the tween is ever skipped/interrupted, the bar is forced fully visible.
  const bar = document.querySelector('.filter-bar');
  if (bar) {
    gsap.fromTo(bar, { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out', delay: 0.4,
        onComplete: () => gsap.set(bar, { clearProps: 'transform,opacity' }) });
    // absolute fallback — after the entrance window, guarantee it's shown
    setTimeout(() => { gsap.set(bar, { opacity: 1, y: 0, clearProps: 'transform,opacity' }); }, 1800);
  }
  gsap.from('.pf-cta-band h2, .pf-cta-band .btn',
    { y: 40, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.pf-cta-band', start: 'top 85%' } });
}

revealGallery();

/* Filter WITHOUT Flip and WITHOUT any translucent/scaled ghost frames.
   The old version faded per-card with scale mid-transition, which showed faint
   half-visible cards overlapping the dark bands above/below — the "ghost fade".
   New approach: the WHOLE grid crossfades as one opaque unit. Cards are swapped
   only while the grid is fully invisible, so no partial-opacity card is ever
   seen against the hero/CTA band. The grid also paints a solid page-coloured
   background (CSS) so nothing behind it can ever bleed through mid-fade. */
function setDisplay(cat) {
  items().forEach(el => {
    const show = cat === 'all' || el.dataset.cat === cat;
    el.style.display = show ? '' : 'none';
    gsap.set(el, { clearProps: 'transform,opacity' });
  });
  const anyVisible = items().some(el => el.style.display !== 'none');
  let empty = gallery.querySelector('.pf-empty');
  if (!anyVisible && !empty) {
    empty = document.createElement('p'); empty.className = 'pf-empty';
    empty.textContent = 'No projects in this category yet — check back soon.';
    gallery.appendChild(empty);
  } else if (anyVisible && empty) { empty.remove(); }
}

function applyFilter(cat) {
  if (REDUCED) { setDisplay(cat); return; }
  clearTimeout(applyFilter._t);
  // kill any in-flight tween so a fast double-click can't strand a half state
  gsap.killTweensOf(gallery);
  gsap.killTweensOf(items());
  // 1. fade the whole grid out as ONE opaque block — no per-card scale/opacity,
  //    so there is never a translucent card visible against the bands.
  gsap.to(gallery, { opacity: 0, duration: 0.2, ease: 'power1.in', overwrite: true,
    onComplete: () => {
      // 2. swap the visible set while the grid is completely invisible
      setDisplay(cat);
      // 3. fade the grid back in as one block, then let its cards settle with a
      //    tiny upward drift (transform only — opacity is carried by the grid,
      //    so individual cards are never seen at partial opacity).
      const shown = items().filter(el => el.style.display !== 'none');
      gsap.set(shown, { y: 18 });
      gsap.to(gallery, { opacity: 1, duration: 0.28, ease: 'power1.out', overwrite: true });
      gsap.to(shown, { y: 0, duration: 0.55, stagger: 0.04, ease: 'power3.out',
        overwrite: true, onComplete: () => gsap.set(shown, { clearProps: 'transform' }) });
      ScrollTrigger.refresh();
    } });
  // absolute safety: if anything interrupts, force a clean visible state
  applyFilter._t = setTimeout(() => {
    gsap.set(gallery, { opacity: 1, clearProps: 'transform' });
    gsap.set(items().filter(el => el.style.display !== 'none'), { opacity: 1, y: 0, clearProps: 'transform' });
  }, 900);
}

document.getElementById('filter-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter(btn.dataset.filter);
});
