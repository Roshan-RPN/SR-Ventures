/* =========================================================================
   SR VENTURES — app.js
   Lenis + GSAP ScrollTrigger. Canvas scroll-scrub, intro reveal,
   section choreography, counters, marquee, Umbrella build, FAQ, form,
   testimonial carousel.
   ========================================================================= */
gsap.registerPlugin(ScrollTrigger);

/* Per client direction: the full hero + scroll experience should always play,
   even when the device has "Reduce Motion" enabled (that OS setting was silently
   turning the whole site static on some phones — "no hero / no portfolio
   animation"). We therefore force the animated path on. `PREFERS_REDUCED` keeps
   the real media-query value in case it's ever needed again. */
const PREFERS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const REDUCED = false;
const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

/* Always start the experience from the very beginning (the intro) on every fresh
   load — refresh included. Browser scroll restoration + the back/forward cache
   both resume mid-page with every entrance animation already finished (reads as
   "no animation"), and a leftover #hash makes a refresh jump into the middle of
   the site. So: force manual restoration, strip any in-page hash, and pin scroll
   to the top on load. (A real deep link from elsewhere still works — see below.) */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
// Only treat it as a deep link if the user arrived from a DIFFERENT page/site.
// A same-page refresh (referrer is this page, or no referrer) always restarts.
const _sameOrigin = document.referrer && document.referrer.split('#')[0] === location.href.split('#')[0];
const _deepLink = location.hash && location.hash !== '#top' && !_sameOrigin;
if (!_deepLink) {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
}
window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

/* ---------- 0. Home portfolio — six featured projects ---------- */
(function homePortfolio() {
  const grid = document.getElementById('home-portfolio');
  if (!grid || !window.SR_PROJECTS) return;
  const label = (c) => (window.SR_CAT_LABELS && window.SR_CAT_LABELS[c]) || c;
  grid.innerHTML = window.SR_PROJECTS.slice(0, 6).map(p => `
    <figure class="pf-item" data-cat="${p.category}">
      <img src="${p.img}" alt="${p.alt}" loading="lazy" width="800" height="600" />
      <figcaption><span class="t">${p.title}</span><span class="c">${label(p.category)}</span></figcaption>
    </figure>`).join('');
})();

/* ---------- Year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Header scrolled state + mobile nav ---------- */
const header = document.getElementById('site-header');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false');
}));

/* ---------- FAQ accordion (works regardless of animation) ---------- */
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  const ans = item.querySelector('.faq-a');
  btn.addEventListener('click', () => {
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    if (REDUCED) { ans.style.height = open ? 'auto' : '0'; return; }
    gsap.to(ans, { height: open ? ans.querySelector('p').offsetHeight : 0, duration: 0.4, ease: 'power3.out' });
  });
});

/* ---------- Contact form ---------- */
(function form() {
  const form = document.getElementById('enquiry-form');
  if (!form) return;
  const success = document.getElementById('form-success');
  const fields = form.querySelectorAll('input[required], select[required]');

  const validateField = (el) => {
    const wrap = el.closest('.field');
    const ok = el.checkValidity();
    wrap.classList.toggle('show-err', !ok);
    return ok;
  };
  fields.forEach(el => el.addEventListener('blur', () => validateField(el)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let allOk = true;
    fields.forEach(el => { if (!validateField(el)) allOk = false; });
    if (!allOk) {
      form.querySelector('.field.show-err input, .field.show-err select')?.focus();
      return;
    }
    // Demo: no backend — show success state. (Wire to endpoint/WhatsApp later.)
    form.classList.add('submitted');
    success.classList.add('show');
    success.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
  });
})();

/* ---------- Testimonial carousel — seamless infinite loop ----------
   True circular: the card set is cloned once, the track advances one card at a
   time, and when the playhead passes the end of the original set it snaps back
   by exactly one set-width (invisible, mid-gap) so it can keep going forever.
   Arrows / keys nudge one card; dots reflect the position within the real set. */
(function initTestiCarousel() {
  const track = document.getElementById('testi-track');
  if (!track) return;
  const originals = Array.from(track.querySelectorAll('.testi'));
  const N = originals.length;
  if (!N) return;
  const dotsWrap = document.getElementById('testi-dots');

  // Clone the whole set once so there is always a full run of cards to the right.
  originals.forEach(card => track.appendChild(card.cloneNode(true)));

  let pos = 0;              // logical card index (can exceed N; we mod it)
  let timer = null, settle, resizeT;
  const step = () => {
    const cards = track.children;
    return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
  };
  const setWidth = () => step() * N;

  // dots: one per real testimonial
  let dots = [];
  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < N; i++) dotsWrap.appendChild(document.createElement('i'));
    dots = Array.from(dotsWrap.children);
    setDots();
  }
  const setDots = () => { const real = ((pos % N) + N) % N; dots.forEach((d, i) => d.classList.toggle('on', i === real)); };

  // pos grows/shrinks without bound; the track always animates to the true offset
  // (-pos*step). Because the set is cloned, offset -N*step looks identical to 0, so
  // after each eased move settles we silently rebase pos into [0,N) — no visible jump.
  // Result: a one-direction conveyor that wraps 8→1→2… forever, always entering from
  // the right.
  function apply(smooth) {
    track.style.transition = smooth && !REDUCED ? 'transform 0.85s cubic-bezier(0.22,1,0.36,1)' : 'none';
    track.style.transform = `translate3d(${-(pos * step())}px,0,0)`;
    setDots();
  }
  function rebase() {
    // snap pos into [0,N) with NO transition — visually identical thanks to the clones
    const norm = ((pos % N) + N) % N;
    if (norm === pos) return;
    pos = norm;
    track.style.transition = 'none';
    track.style.transform = `translate3d(${-(pos * step())}px,0,0)`;
    // force reflow so the next transition takes effect cleanly
    void track.offsetWidth;
  }
  function go(delta) {
    clearTimeout(settle);
    pos += delta;
    apply(true);
    setDots();
    // rebase just after the eased move finishes (mid-gap, invisible)
    settle = setTimeout(rebase, 900);
  }
  const next = () => go(1);
  const prev = () => go(-1);

  function play() { stop(); if (!REDUCED) timer = setInterval(next, 3000); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // convert the flex track from a native scroller into a transformed marquee
  track.style.overflow = 'visible';
  track.style.scrollSnapType = 'none';
  buildDots();
  apply(false);

  document.getElementById('t-next').addEventListener('click', () => { next(); play(); });
  document.getElementById('t-prev').addEventListener('click', () => { prev(); play(); });
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') { next(); play(); }
    else if (e.key === 'ArrowLeft') { prev(); play(); }
  });
  dots.forEach((d, i) => d.addEventListener('click', () => { pos = i; apply(true); play(); }));

  const wrap = track.parentElement; // .testi-carousel
  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', () => play());

  // touch swipe on the track
  let sx = 0, dragging = false;
  track.addEventListener('touchstart', (e) => { stop(); sx = e.touches[0].clientX; dragging = true; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (!dragging) return; dragging = false;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    play();
  }, { passive: true });

  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => apply(false), 150); });

  // autoplay only while the carousel is on screen
  const io = new IntersectionObserver(
    (ents) => ents.forEach((en) => (en.isIntersecting ? play() : stop())),
    { threshold: 0.2 }
  );
  io.observe(track);
})();

/* ---------- Umbrella SVG geometry — runs in all modes ----------
   Builds the 7 canopy panels (one per stage) + a dashed blueprint ghost.
   Default DOM state = fully built umbrella, so reduced-motion needs no JS. */
const UMB = (function buildUmbrellaSvg() {
  const svg = document.getElementById('u-svg');
  if (!svg) return null;
  const NS = 'http://www.w3.org/2000/svg';
  const AX = 300, AY = 72, RIM = 300, X0 = 60, X1 = 540, N = 7;
  const step = (X1 - X0) / N;
  const xs = Array.from({ length: N + 1 }, (_, i) => X0 + i * step);
  const ctrl = (x) => `${(AX + (x - AX) * 0.72).toFixed(1)} 132`; // apex→rim bow
  const canopy = document.getElementById('u-canopy');
  const bp = document.getElementById('u-blueprint');
  const panels = [], foldRots = [];
  for (let i = 0; i < N; i++) {
    const a = xs[i], b = xs[i + 1], mid = (a + b) / 2;
    const d = `M ${AX} ${AY} Q ${ctrl(a)} ${a.toFixed(1)} ${RIM}` +
              ` Q ${mid.toFixed(1)} ${RIM - 14} ${b.toFixed(1)} ${RIM}` +
              ` Q ${ctrl(b)} ${AX} ${AY} Z`;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'u-panel rib-' + i);
    p.style.fill = `url(#uRib${i})`;
    canopy.appendChild(p);
    panels.push(p);
    // start angle when "folded" against the pole (degrees from vertical)
    foldRots.push(-(Math.atan2(mid - AX, RIM - AY) * 180 / Math.PI));
    const g = document.createElementNS(NS, 'path');
    g.setAttribute('d', d);
    bp.appendChild(g);
  }
  const bpole = document.createElementNS(NS, 'path');
  bpole.setAttribute('d', document.getElementById('u-pole').getAttribute('d'));
  bp.appendChild(bpole);
  // canopy dome surface: y for a given x (parabola apex→rim)
  const domeY = (x) => AY + (RIM - AY) * Math.pow((x - AX) / (AX - X0), 2);
  return {
    panels, foldRots, domeY,
    pole: document.getElementById('u-pole'),
    glow: document.getElementById('u-glow'),
    rainG: document.getElementById('u-rain')
  };
})();

/* =========================================================================
   REDUCED MOTION — draw everything statically, skip the scroll engine
   ========================================================================= */
if (REDUCED) {
  // Show first canvas frame statically, then bail out of all scroll animation.
  const loader = document.getElementById('loader');
  const canvas = document.getElementById('canvas');
  const img = new Image();
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  };
  img.src = 'frames/frame_0090.webp';
  // counters shown at final value
  document.querySelectorAll('.stat-number').forEach(el => {
    const d = parseInt(el.dataset.decimals || '0');
    el.textContent = parseFloat(el.dataset.value).toFixed(d);
  });
  header.classList.remove('nav-hidden'); // no scroll engine — show the nav
  if (loader) loader.classList.add('hidden');
} else {
  bootAnimated();
}

/* =========================================================================
   FULL ANIMATED EXPERIENCE
   ========================================================================= */
function bootAnimated() {
  /* ---- Lenis smooth scroll ---- */
  // Lighter default feel: shorter duration + fuller wheel multiplier so normal
  // scrolling tracks the wheel closely instead of drifting (the old 1.5s / 0.85x
  // read as laggy).
  const lenis = new Lenis({ duration: 1.05, wheelMultiplier: 1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // anchor links go through Lenis. Give the jump its OWN snappy duration that
  // scales gently with distance — a fixed slow glide across the whole film (e.g.
  // Home → hero) is what felt like "lag". Cap it so long jumps stay quick.
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const dist = Math.abs(target.getBoundingClientRect().top);
      const dur = Math.min(1.1, 0.45 + dist / 9000); // ~0.45s near, ~1.1s cap far
      lenis.scrollTo(id, { offset: -40, duration: dur, easing: (t) => 1 - Math.pow(1 - t, 3) });
    });
  });

  /* ---- Header shrink ---- */
  ScrollTrigger.create({ start: 'top -80', onUpdate: (self) => header.classList.toggle('scrolled', self.scroll() > 80) });

  /* ---- Nav visibility: hidden across intro + film, drops in at the hero copy ---- */
  ScrollTrigger.create({
    trigger: '#home-hero', start: 'top 78%', end: 'bottom top',
    onEnter: () => header.classList.remove('nav-hidden'),
    onLeaveBack: () => header.classList.add('nav-hidden')
  });

  /* ---- Canvas frame scrub ---- */
  const FRAME_COUNT = 184;
  // Slowness comes from the taller 680vh scrub zone (more scroll distance per
  // frame), NOT from this multiplier. Keep FRAME_SPEED just above 1 so the film
  // still reaches its final frame near the end; the brief black fade (94–100%)
  // overlaps the tail so there's no long dead pause.
  const FRAME_SPEED = 1.03;
  const IMAGE_SCALE = 0.86;
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const frames = new Array(FRAME_COUNT);
  let currentFrame = -1;
  let bgColor = '#070707';
  const framePath = (i) => `frames/frame_${String(i + 1).padStart(4, '0')}.webp`;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function sizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  sizeCanvas();

  function sampleBg(img) {
    try {
      const t = document.createElement('canvas'); t.width = 8; t.height = 8;
      const tc = t.getContext('2d'); tc.drawImage(img, 0, 0, 8, 8);
      const d = tc.getImageData(0, 0, 1, 1).data;
      bgColor = `rgb(${d[0]},${d[1]},${d[2]})`;
    } catch (e) { /* ignore */ }
  }
  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ---- Two-phase preload ---- */
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loader-bar');
  const pct = document.getElementById('loader-percent');
  let loaded = 0;
  function markLoaded() {
    loaded++;
    const p = Math.round((loaded / FRAME_COUNT) * 100);
    bar.style.width = p + '%'; pct.textContent = p + '%';
    if (loaded === FRAME_COUNT) finishLoad();
  }
  function loadFrame(i) {
    const img = new Image();
    img.onload = () => { if (i === 0) sampleBg(img); markLoaded(); };
    img.onerror = markLoaded;
    img.src = framePath(i);
    frames[i] = img;
  }
  // first 10 fast, rest after
  for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) loadFrame(i);
  let started = false;
  function startRest() { if (started) return; started = true; for (let i = 10; i < FRAME_COUNT; i++) loadFrame(i); }
  setTimeout(startRest, 200);

  let booted = false;
  function finishLoad() {
    if (booted) return; booted = true;
    drawFrame(0);
    loader.classList.add('hidden');
    introReveal();          // play the intro choreography now the loader is gone
    initScrollScene();
    ScrollTrigger.refresh();
  }
  // Safety: don't let a stalled frame hang the loader forever
  setTimeout(() => { if (!booted) { startRest(); } }, 1200);
  setTimeout(() => { if (!booted) finishLoad(); }, 6000);

  window.addEventListener('resize', () => { sizeCanvas(); if (currentFrame >= 0) drawFrame(currentFrame); ScrollTrigger.refresh(); });

  /* ---- Intro letter reveal — runs when the loader hides, NOT at boot.
     (It used to fire immediately, so the whole animation finished behind the
     loader curtain and the intro looked static by the time it was visible.) ---- */
  gsap.set('.intro-title .ch', { yPercent: 118, rotate: 5 });
  gsap.set('.intro-label, .intro-tagline, .intro-meta, .scroll-indicator', { y: 28, opacity: 0 });
  gsap.set('.hero-bg', { scale: 1.16 });
  let introPlayed = false;
  function introReveal() {
    if (introPlayed) return; introPlayed = true;
    const tl = gsap.timeline({ delay: 0.25 });
    tl.fromTo('.hero-bg', { opacity: 0 }, { opacity: 0.28, scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
      .to('.intro-title .ch', { yPercent: 0, rotate: 0, stagger: 0.06, duration: 1.3, ease: 'power4.out' }, 0.3)
      .to('.intro-label, .intro-tagline, .intro-meta, .scroll-indicator',
        { y: 0, opacity: 1, stagger: 0.16, duration: 1.0, ease: 'power3.out' }, 1.0);
  }

  function initScrollScene() {
    const scrollContainer = document.getElementById('scroll-container');
    const canvasWrap = document.getElementById('canvas-wrap');
    const heroSection = document.getElementById('hero');
    const overlay = document.getElementById('dark-overlay');

    /* ---- Frame scrub bound to scroll container ---- */
    ScrollTrigger.create({
      trigger: scrollContainer, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const accel = Math.min(self.progress * FRAME_SPEED, 1);
        const index = Math.min(Math.floor(accel * FRAME_COUNT), FRAME_COUNT - 1);
        if (index !== currentFrame) { currentFrame = index; requestAnimationFrame(() => drawFrame(index)); }
      }
    });

    /* ---- Hero fade + circle-wipe reveal of canvas ---- */
    ScrollTrigger.create({
      trigger: scrollContainer, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        heroSection.style.opacity = Math.max(0, 1 - p * 14);
        const wipe = Math.min(1, Math.max(0, (p - 0.008) / 0.06));
        canvasWrap.style.clipPath = `circle(${wipe * 78}% at 50% 50%)`;
      }
    });

    /* ---- End-of-film fade: the frame dips to black right at the very end ----
       Held later + snappier so the black screen after the bedroom frame is brief,
       not a long dead pause before the hero copy. */
    ScrollTrigger.create({
      trigger: scrollContainer, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        overlay.style.opacity = p <= 0.94 ? 0 : Math.min(1, (p - 0.94) / 0.05);
      }
    });

    /* ---- Counters ----
       Desktop: fire once when the section is nearly centred (top 48%), so the
       numbers roll up while the reader is looking at them — not before arrival.
       Mobile: scrub each number to the scroll so it counts UP as the section
       travels in and lands on its final value only once #trust is fully in view
       (user complaint: "15+ etc. already finished before I reach the section"). */
    const statNumbers = document.querySelectorAll('.stat-number');
    if (IS_MOBILE) {
      statNumbers.forEach(el => {
        const target = parseFloat(el.dataset.value);
        const decimals = parseInt(el.dataset.decimals || '0');
        const obj = { v: 0 };
        gsap.to(obj, { v: target, ease: 'none',
          scrollTrigger: { trigger: '#trust', start: 'top 82%', end: 'top 30%', scrub: 0.6 },
          onUpdate: () => { el.textContent = obj.v.toFixed(decimals); } });
      });
    } else {
      let countersRun = false;
      ScrollTrigger.create({ trigger: '#trust', start: 'top 48%', once: true, onEnter: () => {
        if (countersRun) return; countersRun = true;
        statNumbers.forEach(el => {
          const target = parseFloat(el.dataset.value);
          const decimals = parseInt(el.dataset.decimals || '0');
          const obj = { v: 0 };
          gsap.to(obj, { v: target, duration: 1.8, ease: 'power1.out',
            onUpdate: () => { el.textContent = obj.v.toFixed(decimals); } });
        });
      } });
    }

    /* ---- Umbrella concept: the umbrella, built live ---- */
    initUmbrella();

    /* ---- Flowing-section reveals (umbrella head, portfolio, testimonials, faq, contact, closing) ----
       NOTE: .stat and .faq-item are handled by their own batches below, so we exclude
       them here — animating the same element from two triggers can leave it stuck
       at opacity:0 if only one fires. fromTo + immediateRender guards the same way. */
    document.querySelectorAll('.flow .reveal, .closing .reveal').forEach(el => {
      if (el.classList.contains('stat') || el.classList.contains('faq-item')) return;
      if (el.classList.contains('stats-lead')) return; // trust copy staggers its own children below
      if (el.closest('#home-hero')) return; // hero has its own choreography below
      if (IS_MOBILE) {
        // mobile: reveal is scrubbed to the scroll, so it plays slower and only
        // completes once the block is fully in view (no blur — cheaper to paint)
        gsap.fromTo(el, { y: 42, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 62%', scrub: 0.6 } });
      } else {
        gsap.fromTo(el,
          { y: 46, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%' } }
        );
      }
    });

    /* ---- Hero (home-hero) — richer scroll choreography ----
       Label, heading, body and CTAs rise in sequence as the section enters;
       the photo figure lifts and un-clips. Layered on top of the base reveal. */
    (function heroScene() {
      const hero = document.getElementById('home-hero');
      if (!hero) return;
      // heading is word-animated by the global loop below — stagger the rest
      const copyKids = hero.querySelectorAll('.hero2-copy > *:not(.section-heading)');
      gsap.set(copyKids, { y: 34, opacity: 0 });
      const fig = hero.querySelector('.hero2-fig');
      if (IS_MOBILE) {
        // mobile: reveal the copy (incl. the two buttons) once, early enough that
        // the CTAs are fully visible while the hero is on screen — a scrub that
        // only completed near the bottom of the section left "View our work"
        // still faded out by the time the photo below pushed it off-screen.
        // A once-safety guarantees the buttons can never stay hidden.
        ScrollTrigger.create({ trigger: hero, start: 'top 82%', once: true,
          onEnter: () => gsap.to(copyKids, { y: 0, opacity: 1, stagger: 0.14, duration: 1.0, ease: 'power3.out', overwrite: true }) });
        ScrollTrigger.create({ trigger: hero, start: 'top 45%', once: true,
          onEnter: () => gsap.to(copyKids, { y: 0, opacity: 1, duration: 0.4, overwrite: 'auto' }) });
      } else {
        gsap.fromTo(copyKids, { y: 34, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.18, duration: 1.3, ease: 'power3.out',
            scrollTrigger: { trigger: hero, start: 'top 72%' } });
      }
      if (fig) {
        const figTrig = IS_MOBILE
          ? { trigger: fig, start: 'top 96%', end: 'top 45%', scrub: 0.7 }
          : { trigger: hero, start: 'top 74%' };
        gsap.fromTo(fig, { clipPath: 'inset(14% 0% 0% 0%)', y: 60, opacity: 0.4 },
          { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1, duration: 1.6,
            ease: IS_MOBILE ? 'none' : 'power3.out', scrollTrigger: figTrig });
        // photo zoom-settles inside its frame as it unmasks (lands on the
        // 1.14 baseline the parallax scrub expects)
        const img = fig.querySelector('img');
        if (img) gsap.fromTo(img, { scale: 1.32 },
          { scale: 1.14, duration: 1.9, ease: IS_MOBILE ? 'none' : 'power2.out',
            scrollTrigger: IS_MOBILE ? { trigger: fig, start: 'top 96%', end: 'top 45%', scrub: 0.7 } : { trigger: hero, start: 'top 74%' } });
        // caption badge pops in last
        gsap.fromTo('.hero2-tag', { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: IS_MOBILE ? fig : hero, start: IS_MOBILE ? 'top 55%' : 'top 52%' } });
      }
      // subtle scrub tie so the whole block breathes with the scroll
      gsap.to('.hero2-copy', { y: -24, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
    })();

    /* ---- Trust copy: label → heading → body → 15+ stagger up as a sequence ---- */
    const trustKids = '.stats-lead > *:not(.section-heading)'; // heading animates word-by-word below
    gsap.set(trustKids, { y: 38, opacity: 0 });
    if (IS_MOBILE) {
      // mobile: scrubbed — copy staggers up slowly and completes only once the
      // section has fully arrived in the viewport
      gsap.to(trustKids, { y: 0, opacity: 1, stagger: 0.24, ease: 'none',
        scrollTrigger: { trigger: '#trust', start: 'top 90%', end: 'top 25%', scrub: 0.7 } });
    } else {
      ScrollTrigger.create({ trigger: '#trust', start: 'top 72%', once: true,
        onEnter: () => gsap.to(trustKids, { y: 0, opacity: 1, stagger: 0.16, duration: 1.15, ease: 'power3.out', overwrite: true }) });
      ScrollTrigger.create({ trigger: '#trust', start: 'top 45%', once: true,
        onEnter: () => gsap.to(trustKids, { y: 0, opacity: 1, duration: 0.5, overwrite: 'auto' }) });
    }

    /* ---- Section headings: rise word by word ---- */
    function splitWords(h) {
      if (h.dataset.split) return;
      h.dataset.split = '1';
      let lastSpan = null; // punctuation-only "words" glue onto the previous span
      const wrapWords = (node, into) => {
        node.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { into.appendChild(document.createTextNode(' ')); return; }
          if (/^[,.;:!?)\]»”']+$/.test(w) && lastSpan) { lastSpan.textContent += w; return; }
          const s = document.createElement('span');
          s.className = 'wi'; s.textContent = w;
          into.appendChild(s);
          lastSpan = s;
        });
      };
      const out = document.createDocumentFragment();
      Array.from(h.childNodes).forEach(n => {
        if (n.nodeType === 3) wrapWords(n, out);
        else if (n.nodeType === 1) { const el = n.cloneNode(false); wrapWords(n, el); out.appendChild(el); }
      });
      h.innerHTML = '';
      h.appendChild(out);
    }
    document.querySelectorAll('.section-heading, .closing h2, .contact-info h2').forEach(h => {
      if (h.closest('.hero-standalone')) return;         // intro handles its own
      splitWords(h);
      gsap.fromTo(h.querySelectorAll('.wi'), { y: '0.85em', opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: IS_MOBILE ? 'none' : 'power4.out', stagger: 0.05,
          scrollTrigger: IS_MOBILE
            ? { trigger: h, start: 'top 96%', end: 'top 55%', scrub: 0.6 }
            : { trigger: h, start: 'top 90%' } });
    });

    /* ---- Section labels: the eyebrow slides in from its rule line ---- */
    document.querySelectorAll('.section-label').forEach(l => {
      if (l.closest('.hero-standalone')) return;
      if (l.closest('#home-hero') || l.closest('.stats-lead')) return; // already staggered as children
      gsap.fromTo(l, { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: l, start: 'top 94%' } });
    });

    /* ---- Stats count-block: stagger the cards in ----
       gsap.set primes the hidden state; the batch animates to visible. A safety
       ScrollTrigger forces them visible if the batch is ever skipped, so the
       200+/98%/Skilled/Quality block can never stay blank. ---- */
    gsap.set('.stats-grid .stat', { opacity: 0, y: 40 });
    if (IS_MOBILE) {
      gsap.to('.stats-grid .stat', { y: 0, opacity: 1, stagger: 0.18, ease: 'none',
        scrollTrigger: { trigger: '.stats-grid', start: 'top 96%', end: 'top 45%', scrub: 0.7 } });
    } else {
      ScrollTrigger.batch('.stats-grid .stat', {
        start: 'top 92%',
        onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, stagger: 0.14, duration: 1.1, ease: 'power3.out', overwrite: true })
      });
      ScrollTrigger.create({ trigger: '#trust', start: 'top 60%', once: true,
        onEnter: () => gsap.to('.stats-grid .stat', { opacity: 1, y: 0, duration: 0.5, overwrite: 'auto' }) });
    }

    /* ---- FAQ rows: stagger as they enter (same safety net) ---- */
    gsap.set('.faq-item', { opacity: 0, x: -28 });
    ScrollTrigger.batch('.faq-item', {
      start: 'top 94%',
      onEnter: (els) => gsap.to(els, { x: 0, opacity: 1, stagger: 0.12, duration: 0.95, ease: 'power3.out', overwrite: true })
    });
    ScrollTrigger.create({ trigger: '#faq', start: 'top 60%', once: true,
      onEnter: () => gsap.to('.faq-item', { opacity: 1, x: 0, duration: 0.5, overwrite: 'auto' }) });

    /* ---- Contact fields: gentle stagger ---- */
    ScrollTrigger.batch('#enquiry-form .field, #enquiry-form .btn', {
      start: 'top 90%',
      onEnter: (els) => gsap.from(els, { y: 24, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power2.out', overwrite: true })
    });

    // portfolio items: each card slides + rises + fades in as it enters.
    // The umbrella section above is PINNED (huge scroll spacer), which shifts the
    // measured start of everything below it. Per-card `once` triggers created
    // before the pin refreshed were mis-measured and silently never fired, so the
    // cards stayed at opacity 0 until a blunt safety snapped them all on at once —
    // which read as "no animation". ScrollTrigger.batch() re-measures correctly on
    // every refresh (incl. after the pin resizes) and is the resilient pattern for
    // this. Odd cards enter from the left, even from the right (a clear directional
    // slide), staggered. A LATE, gentle safety only catches a card if the batch is
    // ever skipped entirely — it no longer pre-empts the real reveal.
    const pfCards = gsap.utils.toArray('#home-portfolio .pf-item');
    const fromX = (i) => (i % 2 === 0 ? -1 : 1) * (IS_MOBILE ? 42 : 54);
    pfCards.forEach((el, i) => gsap.set(el, { x: fromX(i), y: IS_MOBILE ? 40 : 60, opacity: 0, scale: 0.94 }));
    ScrollTrigger.batch(pfCards, {
      start: 'top 88%',
      onEnter: (els) => gsap.to(els, {
        x: 0, y: 0, opacity: 1, scale: 1,
        duration: IS_MOBILE ? 1.0 : 1.1, ease: 'power3.out',
        stagger: 0.12, overwrite: true,
        onComplete: () => gsap.set(els, { clearProps: 'transform' })
      })
    });
    // LATE safety: only if a card is somehow still hidden once the section is
    // fully centred does it get forced on — the real per-card reveal fires first.
    ScrollTrigger.create({ trigger: '#portfolio', start: 'top 20%', once: true,
      onEnter: () => {
        const stuck = pfCards.filter(el => +gsap.getProperty(el, 'opacity') < 0.05);
        if (stuck.length) gsap.to(stuck, { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.08,
          overwrite: 'auto', onComplete: () => gsap.set(stuck, { clearProps: 'transform' }) });
      } });

    // testimonial cards fan in once when the section arrives
    gsap.set('#testi-track .testi', { y: 44, opacity: 0 });
    ScrollTrigger.create({ trigger: '#testimonials', start: 'top 70%', once: true,
      onEnter: () => gsap.to('#testi-track .testi', { y: 0, opacity: 1, stagger: 0.08, duration: 0.9, ease: 'power3.out', overwrite: true }) });
    ScrollTrigger.create({ trigger: '#testimonials', start: 'top 45%', once: true,
      onEnter: () => gsap.to('#testi-track .testi', { y: 0, opacity: 1, duration: 0.5, overwrite: 'auto' }) });

    // footer columns rise in a gentle stagger
    gsap.from('.footer-grid > div', { y: 30, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.site-footer', start: 'top 94%' } });

    /* ---- Parallax: images drift slower than the page ----
       (trust wings are excluded — their CSS transform handles centering) ---- */
    const parallax = [
      { sel: '.hero2-fig img', amt: -60 },
      { sel: '.closing-bg', amt: -80 }
    ];
    parallax.forEach(({ sel, amt }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      // oversize a touch so the vertical drift never exposes an edge
      gsap.set(el, { scale: 1.14, transformOrigin: '50% 50%' });
      gsap.to(el, {
        yPercent: amt / 10, ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });
  }

  /* ---- The Umbrella Concept — the umbrella, built live ----
     ALL viewports pin the section: scroll draws the pole, then fans the 7
     canopy panels open ONE AT A TIME — and the stage readout swaps in sync
     with each rib, so every rib IS its step. Finale: glow + rain that dies
     on the canopy, then the whole scene lifts away before the pin releases. */
  function initUmbrella() {
    if (!UMB) return;
    const umb = document.getElementById('umb');
    const numEl = document.getElementById('u-num');
    const stageEls = gsap.utils.toArray('.u-stage');
    const ticksWrap = document.getElementById('u-ticks');
    if (!ticksWrap.children.length) stageEls.forEach(() => ticksWrap.appendChild(document.createElement('i')));
    const ticks = Array.from(ticksWrap.children);
    const { panels, foldRots, pole, glow, rainG, domeY } = UMB;
    const N = panels.length;
    // scrub-timeline layout: pole draw, one slot per panel/stage, finale glow,
    // a hold, then a graceful EXIT that lifts the whole umbrella away before
    // the pin releases into the light portfolio section.
    const POLE = 0.9, PER = 1.2, FIN = 0.8, HOLD = 0.6, EXIT = 1.4;
    const TOTAL = POLE + PER * N + FIN + HOLD + EXIT;

    // Stage text reveals IN STEP with its rib, then HOLDS fully visible while
    // that rib rests open. Only when the NEXT rib starts opening does the current
    // stage fade out (as the next stage fades in) — so text only ever transitions
    // while a rib is actively opening, never during the rest. On desktop/tablet
    // the stages are absolutely stacked, so we drive opacity/y directly and keep
    // them all `visibility:visible`; the number/tick/live state is flipped by a
    // callback at each rib's midpoint. `cur` only tracks the number/tick/live readout.
    let cur = -1;
    // desktop/tablet: crossfade requires all stages painted; opacity drives show/hide
    const STACKED = window.matchMedia('(min-width: 981px)').matches;
    stageEls.forEach((el) => el.classList.remove('is-on'));
    if (STACKED) gsap.set(stageEls, { opacity: 0, y: 26, visibility: 'visible' });
    // flips the number, ticks and live-rib highlight to stage `idx` (state only —
    // the text opacity is animated by the scrub timeline, not here)
    function markStage(idx) {
      idx = Math.max(-1, Math.min(N - 1, idx));
      if (idx === cur) return;
      cur = idx;
      stageEls.forEach((el, i) => el.classList.toggle('is-on', i === idx));
      numEl.textContent = String(Math.max(0, idx) + 1).padStart(2, '0');
      ticks.forEach((t, i) => t.classList.toggle('on', i === idx));
      panels.forEach((p, i) => p.classList.toggle('live', i === idx));
    }

    // one pinned build, desktop and mobile — only the scroll distance differs
    function buildPinned(endDist) {
      const poleLen = pole.getTotalLength();
      gsap.set(pole, { strokeDasharray: poleLen, strokeDashoffset: poleLen });

      // finale rain — drops die exactly where they meet the canopy dome
      const NS = 'http://www.w3.org/2000/svg';
      const rainTl = gsap.timeline({ paused: true });
      for (let i = 0; i < 12; i++) {
        const x = 80 + Math.random() * 440;
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', x); line.setAttribute('x2', x);
        line.setAttribute('y1', -46); line.setAttribute('y2', -20);
        rainG.appendChild(line);
        rainTl.fromTo(line, { y: 0, opacity: 0 },
          { y: domeY(x) + 16, opacity: 0.55, duration: 0.7 + Math.random() * 0.5, ease: 'none', repeat: -1 },
          Math.random());
      }

      // rain plays only during the finale window (after canopy is open, before exit)
      const rainStart = (POLE + PER * N) / TOTAL;
      const rainEnd = (POLE + PER * N + FIN + HOLD) / TOTAL;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: umb, start: 'top top', end: '+=' + endDist,
          pin: true, scrub: 1, anticipatePin: 1,
          onUpdate: (self) => {
            if (self.progress > rainStart && self.progress < rainEnd && self.isActive) rainTl.play();
            else rainTl.pause();
          },
          onLeave: () => rainTl.pause()
        }
      });
      tl.to(pole, { strokeDashoffset: 0, duration: POLE, ease: 'none' }, 0);
      const RIB_DUR = PER * 0.85;
      // Text moves only while a rib is opening: it reveals/exits over the FIRST
      // part of each rib's fold, then HOLDS while the rib rests. TXT_DUR is that
      // active-transition slice (a bit shorter than the fold so the stage settles
      // fully visible before the rest begins).
      const TXT_DUR = RIB_DUR * 0.7;
      // scrubbing back above rib #1's midpoint clears the readout to empty
      tl.call(markStage, [-1], POLE);
      panels.forEach((p, i) => {
        const at = POLE + PER * i;
        // the rib folds open across [at, at + RIB_DUR]
        tl.from(p, { svgOrigin: '300 72', rotation: foldRots[i], opacity: 0, duration: RIB_DUR, ease: 'power2.out' }, at);
        // STACKED (desktop/tablet): as THIS rib starts opening, the previous stage
        // fades OUT and this stage fades IN together, over the first TXT_DUR of the
        // fold. Then this stage HOLDS fully visible until the NEXT rib opens.
        if (STACKED) {
          if (i > 0) tl.to(stageEls[i - 1], { opacity: 0, y: -18, duration: TXT_DUR, ease: 'power2.in' }, at);
          tl.fromTo(stageEls[i], { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: TXT_DUR, ease: 'power2.out' }, at);
        }
        // flip number/tick/live highlight partway through the reveal (state only)
        tl.call(markStage, [i], at + TXT_DUR * 0.5);
      });
      // after the LAST rib, the final stage simply holds — nothing fades it out.
      // FINALE — glow blooms while everything is still on screen
      const finAt = POLE + PER * N;
      tl.to(glow, { opacity: 0.5, duration: FIN * 0.7 }, finAt);

      // EXIT — after a brief hold, the whole umbrella lifts + fades away and the
      // glow dies, so the pin releases into empty space and the portfolio rises
      // into a clean gap instead of being shoved against a frozen dark block.
      const exitAt = finAt + FIN + HOLD;
      tl.to('.umbrella-head', { y: -70, opacity: 0, duration: EXIT * 0.8, ease: 'power2.in' }, exitAt);
      tl.to('.umb-inner', { y: -90, opacity: 0, duration: EXIT, ease: 'power2.in' }, exitAt + 0.05);
      tl.to(glow, { opacity: 0, duration: EXIT * 0.6 }, exitAt + 0.1);
      return () => {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill(); rainTl.kill(); rainG.innerHTML = '';
        gsap.set(['.umbrella-head', '.umb-inner'], { clearProps: 'transform,opacity' });
        gsap.set(stageEls, { clearProps: 'opacity,transform,visibility' });
        gsap.set(pole, { clearProps: 'strokeDasharray,strokeDashoffset' });
      };
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 981px)', () => buildPinned(4200));
    mm.add('(max-width: 980px)', () => buildPinned(2800));
  }
}
