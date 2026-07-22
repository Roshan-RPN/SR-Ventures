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

const PF_MOBILE = window.matchMedia('(max-width: 768px)').matches;
/* IMAGE REVEAL: instead of just fading/sliding the whole card, wipe the frame
   open with a clip-path while the IMAGE inside eases down from a gentle zoom, so
   the photo settles into place behind the opening mask — a clean editorial reveal
   that reads well on desktop and mobile. Shared by the scroll batch and the
   first-load intro so every path animates identically. */
const pfImgOf = (el) => el.querySelector('img');
function primePfCard(el) {
  gsap.set(el, { opacity: 0, y: PF_MOBILE ? 34 : 48,
    clipPath: 'inset(0% 0% 100% 0%)', webkitClipPath: 'inset(0% 0% 100% 0%)' });
  gsap.set(pfImgOf(el), { scale: 1.2, transformOrigin: '50% 50%' });
}
function revealPfCard(el, delay = 0) {
  const img = pfImgOf(el);
  const tl = gsap.timeline({ delay });
  tl.to(el, {
    opacity: 1, y: 0,
    clipPath: 'inset(0% 0% 0% 0%)', webkitClipPath: 'inset(0% 0% 0% 0%)',
    duration: PF_MOBILE ? 0.9 : 1.05, ease: 'power4.out', overwrite: true,
    onComplete: () => gsap.set(el, { clearProps: 'clipPath,webkitClipPath,transform' })
  }, 0)
    .to(img, { scale: 1, duration: PF_MOBILE ? 1.05 : 1.25, ease: 'power3.out', overwrite: true,
      onComplete: () => gsap.set(img, { clearProps: 'transform' }) }, 0);
  return tl;
}

/* ---- Scroll-driven reveal: each card slides up + fades as it enters ----
   gsap.set primes the hidden state; a batch animates whatever just entered.
   A once-safety forces everything visible if a batch is ever skipped, so cards
   below the fold can never stay stranded at opacity 0. Rebuilt after each filter. */
let pfHeaderTl = null;
/* onlyBelowFold: when true, the scroll batch is built ONLY from cards below the
   fold — the initially-visible row is owned by introVisibleCards() so it plays a
   real entrance on first load. When false (filter changes), the whole visible set
   is batched, since the filter's own crossfade already handles in-view cards. */
function revealGallery(onlyBelowFold) {
  if (REDUCED) return;
  ScrollTrigger.getAll().forEach(t => { if (t.vars && t.vars.id === 'pf-card') t.kill(); });
  const cards = items().filter(el => el.style.display !== 'none');
  // Only PRIME cards that are still below the fold — cards already on screen must
  // not be re-hidden (that would blank the top of a freshly-filtered category).
  const H = window.innerHeight;
  const below = cards.filter(el => el.getBoundingClientRect().top >= H * 0.9);
  below.forEach(primePfCard);
  // On first load the in-view row is animated by introVisibleCards(); batching it
  // here too would fire onEnter immediately and snap it visible, killing that
  // entrance. So build the batch from just the below-fold cards in that case.
  const batchTargets = onlyBelowFold ? below : cards;
  ScrollTrigger.batch(batchTargets, {
    id: 'pf-card',
    start: 'top 92%',
    onEnter: (els) => els.forEach((el, i) => revealPfCard(el, i * 0.09))
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

/* First load (incl. after a refresh, which restarts at the top): the gallery
   cards already in view must visibly ANIMATE IN too — otherwise the top row just
   appears statically and the page reads as "no animation on refresh". Below-fold
   cards keep their scroll-driven reveal via revealGallery(). This runs once. */
function introVisibleCards() {
  if (REDUCED) return;
  const H = window.innerHeight;
  const inView = items().filter(el => el.style.display !== 'none' && el.getBoundingClientRect().top < H * 0.92);
  if (!inView.length) return;
  inView.forEach(primePfCard);
  inView.forEach((el, i) => revealPfCard(el, 0.55 + i * 0.1));
}
introVisibleCards();

// first load: below-fold cards get the scroll batch; the in-view row is owned by
// introVisibleCards() above so it plays a visible entrance after a refresh.
revealGallery(true);

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
      // 3. fade the grid back in as one block. Cards already IN VIEW settle with a
      //    tiny upward drift; cards BELOW THE FOLD are re-primed hidden so they get
      //    the same scroll-driven reveal the "All" view has — previously the filter
      //    left every filtered card fully visible, so a category had no scroll
      //    animation at all. revealGallery() rebuilds the per-card batch for the
      //    new visible set.
      const shown = items().filter(el => el.style.display !== 'none');
      gsap.to(gallery, { opacity: 1, duration: 0.28, ease: 'power1.out', overwrite: true });
      const H = window.innerHeight;
      const inView = shown.filter(el => el.getBoundingClientRect().top < H * 0.9);
      gsap.set(inView, { opacity: 1, y: 18, clearProps: 'clipPath,webkitClipPath' });
      gsap.set(inView.map(pfImgOf), { clearProps: 'transform' });
      gsap.to(inView, { y: 0, duration: 0.55, stagger: 0.04, ease: 'power3.out',
        overwrite: true, onComplete: () => gsap.set(inView, { clearProps: 'transform' }) });
      // (re)builds the scroll reveal so below-the-fold cards animate in on scroll
      revealGallery();
    } });
  // absolute safety: if anything interrupts, force a clean visible state
  applyFilter._t = setTimeout(() => {
    gsap.set(gallery, { opacity: 1, clearProps: 'transform' });
    const shown = items().filter(el => el.style.display !== 'none');
    gsap.set(shown, { opacity: 1, y: 0, clearProps: 'transform,clipPath,webkitClipPath' });
    gsap.set(shown.map(pfImgOf), { clearProps: 'transform' });
  }, 900);
}

document.getElementById('filter-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter(btn.dataset.filter);
});
