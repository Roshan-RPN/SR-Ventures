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
/* The EARLY restart decision (scrollRestoration = manual, strip #hash, scroll to
   top) is made by an inline <script> in <head> so it runs before the browser can
   restore a saved position — see index.html. It sets window.__SR_RESTART. Here we
   only re-assert top at the moments the browser/Lenis might re-apply a position. */
if (window.__SR_RESTART) {
  window.scrollTo(0, 0);
  window.addEventListener('DOMContentLoaded', () => window.scrollTo(0, 0));
  window.addEventListener('load', () => window.scrollTo(0, 0));
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

/* ---------- Testimonial carousel — slow CONTINUOUS auto-scroll ----------
   A constant-velocity conveyor (not a 3-second step). The card set is cloned once
   so the belt can wrap seamlessly: the transform drifts left every frame at a
   gentle speed, and once it has travelled one full set-width it rebases by exactly
   that width (invisible, since the clones are identical) to loop forever. Hover /
   touch pause it; arrows and keys nudge it along the same belt; dots reflect which
   real card is currently front-and-centre. */
(function initTestiCarousel() {
  const track = document.getElementById('testi-track');
  if (!track) return;
  const originals = Array.from(track.querySelectorAll('.testi'));
  const N = originals.length;
  if (!N) return;
  const dotsWrap = document.getElementById('testi-dots');

  // Clone the whole set once so there is always a full run of cards to the right.
  originals.forEach(card => track.appendChild(card.cloneNode(true)));

  // continuous offset in px (always >= 0); we render translateX(-offset).
  let offset = 0;
  let setW = 0;                      // width of one full (un-cloned) set
  const SPEED = 22;                  // px per second — slow, readable drift
  let paused = false, onScreen = true, raf = null, last = 0, resizeT, hovering = false;

  const step = () => {
    const cards = track.children;
    return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
  };
  const measure = () => { setW = step() * N; };

  // dots: one per real testimonial — lit dot = card nearest the left edge
  let dots = [];
  function buildDots() {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < N; i++) dotsWrap.appendChild(document.createElement('i'));
    dots = Array.from(dotsWrap.children);
    setDots();
  }
  const setDots = () => {
    const s = step() || 1;
    const real = ((Math.round(offset / s) % N) + N) % N;
    dots.forEach((d, i) => d.classList.toggle('on', i === real));
  };

  function render() {
    // wrap the offset into [0, setW) so the belt loops forever with no visible jump
    if (setW > 0) { offset %= setW; if (offset < 0) offset += setW; }
    track.style.transform = `translate3d(${-offset}px,0,0)`;
    setDots();
  }

  function tick(now) {
    if (!last) last = now;
    const dt = (now - last) / 1000; last = now;
    if (!paused && onScreen && !REDUCED) { offset += SPEED * dt; render(); }
    raf = requestAnimationFrame(tick);
  }
  function start() { if (raf == null) { last = 0; raf = requestAnimationFrame(tick); } }
  function stopLoop() { if (raf != null) { cancelAnimationFrame(raf); raf = null; } }

  // arrows / keys nudge the belt by one card — but because the belt is drifting
  // continuously, `offset` is almost always mid-card when the click lands. Adding a
  // raw step would leave the card half-cut. So we SNAP to the nearest card boundary
  // first, then advance exactly one card in the pressed direction — the target card
  // always ends perfectly aligned to the edge. The drift pauses during the eased
  // move and resumes right after (arrows already run through this single path).
  let nudgeTween = null;
  function nudge(dir) {
    const s = step();
    if (nudgeTween) nudgeTween.kill();
    // nearest boundary to the current (drifting) offset, then one card further on.
    const target = (Math.round(offset / s) + dir) * s;
    paused = true;                               // freeze the drift while we settle
    nudgeTween = gsap.to({ v: offset }, {
      v: target, duration: 0.7, ease: 'power3.out',
      onUpdate: function () { offset = this.targets()[0].v; render(); },
      onComplete: function () { offset = target; render(); paused = hovering; nudgeTween = null; }
    });
  }
  function goTo(i) {
    const s = step();
    // shortest move to bring real card i to the left edge, staying on the belt
    const cur = offset / s;
    let delta = i - (((cur % N) + N) % N);
    if (delta > N / 2) delta -= N; else if (delta < -N / 2) delta += N;
    const target = offset + delta * s;
    gsap.to({ v: offset }, { v: target, duration: 0.8, ease: 'power3.out',
      onUpdate: function () { offset = this.targets()[0].v; render(); } });
  }

  // convert the flex track from a native scroller into a transformed marquee
  track.style.overflow = 'visible';
  track.style.scrollSnapType = 'none';
  track.style.transition = 'none';
  measure();
  buildDots();
  render();
  start();

  document.getElementById('t-next').addEventListener('click', () => nudge(1));
  document.getElementById('t-prev').addEventListener('click', () => nudge(-1));
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') nudge(1);
    else if (e.key === 'ArrowLeft') nudge(-1);
  });
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  const wrap = track.parentElement; // .testi-carousel
  wrap.addEventListener('mouseenter', () => { hovering = true; paused = true; });
  wrap.addEventListener('mouseleave', () => { hovering = false; if (!nudgeTween) paused = false; });

  // touch swipe drags the belt directly, then resumes the drift
  let sx = 0, sOff = 0, dragging = false;
  track.addEventListener('touchstart', (e) => { paused = true; sx = e.touches[0].clientX; sOff = offset; dragging = true; }, { passive: true });
  track.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    offset = sOff - (e.touches[0].clientX - sx); render();
  }, { passive: true });
  track.addEventListener('touchend', () => { dragging = false; paused = false; }, { passive: true });

  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { measure(); render(); }, 150); });

  // only drift while the carousel is on screen (saves work off-screen)
  const io = new IntersectionObserver(
    (ents) => ents.forEach((en) => { onScreen = en.isIntersecting; }),
    { threshold: 0.15 }
  );
  io.observe(track);
})();

/* ---------- Umbrella SVG geometry — runs in all modes ----------
   Builds the 9 canopy panels (one per stage) + a dashed blueprint ghost.
   Default DOM state = fully built umbrella, so reduced-motion needs no JS. */
const UMB = (function buildUmbrellaSvg() {
  const svg = document.getElementById('u-svg');
  if (!svg) return null;
  const NS = 'http://www.w3.org/2000/svg';
  const AX = 300, AY = 72, RIM = 300, X0 = 60, X1 = 540, N = 9;
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
  // On a fresh load / refresh, force Lenis itself to the very top so the intro
  // always plays from frame 0 — the browser can otherwise hand Lenis a restored
  // mid-page offset before the first frame paints.
  if (window.__SR_RESTART) {
    lenis.scrollTo(0, { immediate: true, force: true });
    requestAnimationFrame(() => lenis.scrollTo(0, { immediate: true, force: true }));
  } else if (location.hash && location.hash.length > 1) {
    // Genuine cross-page deep link (e.g. Home / breadcrumb on portfolio.html →
    // index.html#home-hero). __SR_RESTART is false so we DON'T force the top;
    // instead drive Lenis to the target once layout + ScrollTrigger have settled,
    // otherwise the native hash jump lands imprecisely against the tall film zone.
    const goHash = () => {
      const target = document.querySelector(location.hash);
      if (target) lenis.scrollTo(target, { offset: -40, immediate: true, force: true });
    };
    window.addEventListener('load', () => {
      requestAnimationFrame(() => { ScrollTrigger.refresh(); goHash(); });
      setTimeout(goHash, 300);
    });
  }
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
  gsap.set('.intro-logo', { opacity: 0, scale: 0.78, y: -26, filter: 'blur(6px)' });
  gsap.set('.hero-bg', { scale: 1.16 });
  let introPlayed = false;
  function introReveal() {
    if (introPlayed) return; introPlayed = true;
    const tl = gsap.timeline({ delay: 0.25 });
    tl.fromTo('.hero-bg', { opacity: 0 }, { opacity: 0.28, scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
      // logo crowns the intro first — settles in with a soft de-blur + scale
      .to('.intro-logo', { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out' }, 0.1)
      .to('.intro-title .ch', { yPercent: 0, rotate: 0, stagger: 0.06, duration: 1.3, ease: 'power4.out' }, 0.7)
      .to('.intro-label, .intro-tagline, .intro-meta, .scroll-indicator',
        { y: 0, opacity: 1, stagger: 0.16, duration: 1.0, ease: 'power3.out' }, 1.4);
    // gentle continuous float once it has landed
    gsap.to('.intro-logo', { y: -10, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.8 });
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
        // completes once the block is fully in view (no blur — cheaper to paint).
        // A little more travel + a gentle scale so blocks clearly settle in.
        gsap.fromTo(el, { y: 56, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 60%', scrub: 0.6 } });
      } else {
        gsap.fromTo(el,
          { y: 64, opacity: 0, scale: 0.97, filter: 'blur(8px)' },
          { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
            onComplete: () => gsap.set(el, { clearProps: 'filter' }) }
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
      let lastInner = null; // punctuation-only "words" glue onto the previous word
      const wrapWords = (node, into) => {
        node.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) { into.appendChild(document.createTextNode(' ')); return; }
          if (/^[,.;:!?)\]»”']+$/.test(w) && lastInner) { lastInner.textContent += w; return; }
          // .wi is a per-word CLIP (overflow:hidden); .wi-in is the piece that
          // transforms — so a word can rise from fully below its own line box
          // without ever poking into the line above/below during the reveal.
          const s = document.createElement('span');
          s.className = 'wi';
          const inner = document.createElement('span');
          inner.className = 'wi-in'; inner.textContent = w;
          s.appendChild(inner);
          into.appendChild(s);
          lastInner = inner;
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
      const words = h.querySelectorAll('.wi-in');
      if (IS_MOBILE) {
        // mobile: scrubbed so it reveals as the heading travels in — each word rises
        // a full line-height from inside its clip so it clearly lifts into place.
        gsap.fromTo(words,
          { yPercent: 118, opacity: 0 },
          { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.06,
            scrollTrigger: { trigger: h, start: 'top 94%', end: 'top 52%', scrub: 0.6 } });
      } else {
        // desktop: each word swings up from fully below its own line box with a
        // longer, springier stagger — a clear, characterful reveal instead of the
        // old barely-visible 0.85em nudge.
        gsap.fromTo(words,
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1,
            duration: 1.05, ease: 'power4.out', stagger: 0.07,
            scrollTrigger: { trigger: h, start: 'top 88%' } });
      }
    });

    /* ---- Section labels: the eyebrow slides in from its rule line ---- */
    document.querySelectorAll('.section-label').forEach(l => {
      if (l.closest('.hero-standalone')) return;
      if (l.closest('#home-hero') || l.closest('.stats-lead')) return; // already staggered as children
      gsap.fromTo(l, { x: -34, opacity: 0, letterSpacing: '0.62em' },
        { x: 0, opacity: 1, letterSpacing: '0.28em', duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: l, start: 'top 94%' },
          onComplete: () => gsap.set(l, { clearProps: 'letterSpacing' }) });
    });

    /* ---- Stats count-block: stagger the cards in ----
       gsap.set primes the hidden state; the batch animates to visible. A safety
       ScrollTrigger forces them visible if the batch is ever skipped, so the
       200+/98%/Skilled/Quality block can never stay blank. ---- */
    gsap.set('.stats-grid .stat', { opacity: 0, y: 56, scale: 0.9 });
    if (IS_MOBILE) {
      gsap.to('.stats-grid .stat', { y: 0, opacity: 1, scale: 1, stagger: 0.18, ease: 'none',
        scrollTrigger: { trigger: '.stats-grid', start: 'top 96%', end: 'top 45%', scrub: 0.7 } });
    } else {
      ScrollTrigger.batch('.stats-grid .stat', {
        start: 'top 92%',
        onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, scale: 1, stagger: 0.14, duration: 1.1, ease: 'back.out(1.5)', overwrite: true })
      });
      ScrollTrigger.create({ trigger: '#trust', start: 'top 60%', once: true,
        onEnter: () => gsap.to('.stats-grid .stat', { opacity: 1, y: 0, scale: 1, duration: 0.5, overwrite: 'auto' }) });
    }

    /* ---- FAQ rows: stagger as they enter (same safety net) ---- */
    gsap.set('.faq-item', { opacity: 0, x: -44 });
    ScrollTrigger.batch('.faq-item', {
      start: 'top 94%',
      onEnter: (els) => gsap.to(els, { x: 0, opacity: 1, stagger: 0.14, duration: 1.0, ease: 'power3.out', overwrite: true })
    });
    ScrollTrigger.create({ trigger: '#faq', start: 'top 60%', once: true,
      onEnter: () => gsap.to('.faq-item', { opacity: 1, x: 0, duration: 0.5, overwrite: 'auto' }) });

    /* ---- Contact form: NO reveal animation (both views, per client). The fields
       and submit button sit fully visible from the start — no fade/slide/stagger. */

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
    // IMAGE REVEAL (both views): the card frame stays put — no rotate, no sideways
    // slide (those skewed the clipped/rounded figure and its image looked wrong).
    // Instead each card is revealed with a clean editorial wipe: a clip-path opens
    // the frame top→bottom while the IMAGE inside eases from a gentle zoom (1.22)
    // down to 1, so the photo settles into place behind the opening mask. The frame
    // also rises + fades a touch. This is the polished "photo reveal" look and reads
    // identically well on desktop and mobile.
    const pfImg = (el) => el.querySelector('img');
    const primeCard = (el) => {
      gsap.set(el, { y: IS_MOBILE ? 40 : 56, opacity: 0,
        clipPath: 'inset(0% 0% 100% 0%)', webkitClipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(pfImg(el), { scale: 1.22, transformOrigin: '50% 50%' });
    };
    const revealCard = (el, delay = 0) => {
      const tl = gsap.timeline({ delay });
      tl.to(el, {
        y: 0, opacity: 1,
        clipPath: 'inset(0% 0% 0% 0%)', webkitClipPath: 'inset(0% 0% 0% 0%)',
        duration: IS_MOBILE ? 0.95 : 1.1, ease: 'power4.out', overwrite: true,
        onComplete: () => gsap.set(el, { clearProps: 'clipPath,webkitClipPath,transform' })
      }, 0)
        .to(pfImg(el), {
          scale: 1, duration: IS_MOBILE ? 1.1 : 1.3, ease: 'power3.out', overwrite: true,
          onComplete: () => gsap.set(pfImg(el), { clearProps: 'transform' })
        }, 0);
      return tl;
    };
    pfCards.forEach(primeCard);
    if (IS_MOBILE) {
      // Mobile: reveal each card ONE AT A TIME as it individually crosses into view.
      pfCards.forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: 'top 88%', once: true,
          onEnter: () => revealCard(el)
        });
      });
    } else {
      // Desktop: batch whatever entered together and stagger the wipe.
      ScrollTrigger.batch(pfCards, {
        start: 'top 86%',
        onEnter: (els) => els.forEach((el, i) => revealCard(el, i * 0.12))
      });
    }
    // LATE safety: only if a card is somehow still hidden once the section is
    // fully centred does it get forced on — the real per-card reveal fires first.
    ScrollTrigger.create({ trigger: '#portfolio', start: 'top 20%', once: true,
      onEnter: () => {
        const stuck = pfCards.filter(el => +gsap.getProperty(el, 'opacity') < 0.05);
        stuck.forEach(el => revealCard(el));
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
    // scrub-timeline layout: an INTRO beat where the heading sits alone (the title
    // moment) before anything draws, then pole draw, one slot per panel/stage,
    // finale glow, a hold, then a graceful EXIT that lifts the whole umbrella away
    // before the pin releases into the light portfolio section.
    const INTRO = 0.7, POLE = 0.9, PER = 1.2, FIN = 0.8, HOLD = 0.6, EXIT = 1.4;
    const TOTAL = INTRO + POLE + PER * N + FIN + HOLD + EXIT;

    // Stage text reveals IN STEP with its rib, then HOLDS fully visible while
    // that rib rests open. Only when the NEXT rib starts opening does the current
    // stage fade out (as the next stage fades in) — so text only ever transitions
    // while a rib is actively opening, never during the rest. On desktop/tablet
    // the stages are absolutely stacked, so we drive opacity/y directly and keep
    // them all `visibility:visible`; the number/tick/live state is flipped by a
    // callback at each rib's midpoint. `cur` only tracks the number/tick/live readout.
    let cur = -1;
    // desktop/tablet: stages are absolutely stacked. We DO NOT crossfade them with
    // overlapping opacity tweens on the scrub timeline — under a fast flick/scrubbed
    // reverse those tweens lag and leave 2-3 stage texts painted on top of each
    // other (the "overlapping text" glitch). Instead the active stage is chosen
    // deterministically in markStage() via the .is-on class, and CSS transitions
    // handle a clean single fade. At any playhead time exactly ONE stage is shown.
    const STACKED = window.matchMedia('(min-width: 981px)').matches;
    stageEls.forEach((el) => el.classList.remove('is-on'));
    if (STACKED) gsap.set(stageEls, { clearProps: 'opacity,transform,visibility' });
    // flips the number, ticks, live-rib highlight AND the visible stage text to
    // stage `idx` — all driven from the deterministic playhead, so nothing ghosts.
    const countEl = numEl.closest('.umb-count');
    // start hidden explicitly: markStage(-1) early-returns on the first call (cur is
    // already -1), so the counter must begin without .is-live on its own.
    if (countEl) countEl.classList.remove('is-live');
    function markStage(idx) {
      idx = Math.max(-1, Math.min(N - 1, idx));
      if (idx === cur) return;
      cur = idx;
      stageEls.forEach((el, i) => el.classList.toggle('is-on', i === idx));
      // idx === -1 is the empty intro/pre-build state: keep the counter hidden so
      // "01 / 09" only appears once the first stage is actually live.
      if (countEl) countEl.classList.toggle('is-live', idx >= 0);
      if (idx >= 0) numEl.textContent = String(idx + 1).padStart(2, '0');
      ticks.forEach((t, i) => t.classList.toggle('on', i === idx));
      panels.forEach((p, i) => p.classList.toggle('live', i === idx));
    }

    // one pinned build, desktop and mobile — only the scroll distance differs
    function buildPinned(endDist, scrubVal) {
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
      const rainStart = (INTRO + POLE + PER * N) / TOTAL;
      const rainEnd = (INTRO + POLE + PER * N + FIN + HOLD) / TOTAL;

      const RIB_DUR = PER * 0.85;
      // Text moves only while a rib is opening: it reveals/exits over the FIRST
      // part of each rib's fold, then HOLDS while the rib rests. TXT_DUR is that
      // active-transition slice (a bit shorter than the fold so the stage settles
      // fully visible before the rest begins).
      const TXT_DUR = RIB_DUR * 0.7;

      // The readout (number/tick/live rib) is a pure function of the playhead's
      // absolute time — NOT one-shot .call() markers. .call() fires asymmetrically
      // on a scrubbed reverse (e.g. after 09/09 the number stayed at 09 while ribs
      // folded back), so instead we recompute the active stage on every scrub tick
      // in both directions. Stage `i` becomes current once the playhead passes rib
      // `i`'s reveal midpoint; below rib 0's midpoint the readout clears to empty.
      const stageAt = (t) => {
        for (let i = N - 1; i >= 0; i--) {
          if (t >= INTRO + POLE + PER * i + TXT_DUR * 0.5) return i;
        }
        return -1;
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: umb, start: 'top top', end: '+=' + endDist,
          pin: true, scrub: scrubVal, anticipatePin: 1,
          onUpdate: (self) => {
            markStage(stageAt(tl.time()));
            if (self.progress > rainStart && self.progress < rainEnd && self.isActive) rainTl.play();
            else rainTl.pause();
          },
          onLeave: () => rainTl.pause()
        }
      });
      // INTRO beat: heading holds alone on screen; the pole only begins drawing
      // once this title moment has passed.
      tl.to(pole, { strokeDashoffset: 0, duration: POLE, ease: 'none' }, INTRO);

      panels.forEach((p, i) => {
        const at = INTRO + POLE + PER * i;
        // the rib folds open across [at, at + RIB_DUR]
        tl.from(p, { svgOrigin: '300 72', rotation: foldRots[i], opacity: 0, duration: RIB_DUR, ease: 'power2.out' }, at);
        // STACKED stage text is NOT tweened here — markStage() (driven from the
        // deterministic playhead in onUpdate) swaps the .is-on stage, and CSS
        // handles the single clean fade. This guarantees exactly one stage is ever
        // visible, even during a fast flick or scrubbed reverse.
      });
      // after the LAST rib, the final stage simply holds — nothing fades it out.
      // FINALE — glow blooms while everything is still on screen
      const finAt = INTRO + POLE + PER * N;
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
    mm.add('(min-width: 981px)', () => buildPinned(5660, 1));
    // Mobile: longer pin distance (~410px per rib, up from ~300) + higher scrub
    // smoothing so a single touch flick can't snap the playhead through 2-3 ribs
    // at once — the ribs now open one at a time as you scroll.
    mm.add('(max-width: 980px)', () => buildPinned(5200, 1.4));
  }
}
