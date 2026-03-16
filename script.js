/* ─────────────────────────────────────────────
   AI Creative Studio — Montage Hero + Interactions
   ───────────────────────────────────────────── */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     CONFIGURATION
     ═══════════════════════════════════════════ */
  const CLIP_DURATION = 2000;       // ms each clip stays visible
  const CROSSFADE_MS  = 600;        // matches CSS transition duration
  const PRELOAD_AHEAD = 1;          // preload only next clip to reduce bandwidth

  /* ═══════════════════════════════════════════
     LOADING
     ═══════════════════════════════════════════ */
  document.body.classList.add('loading');
  window.addEventListener('load', () => {
    document.body.classList.remove('loading');
    initScrollAnimations();
    initMontage();
    initLazyVideos();

    document.querySelectorAll('video').forEach((v) => {
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
    });
  });

  /* ═══════════════════════════════════════════
     LAZY-LOAD SECTION VIDEOS
     ═══════════════════════════════════════════ */
  function initLazyVideos() {
    const lazyVideos = document.querySelectorAll('video[data-src]:not(.montage-slide video)');
    if (!lazyVideos.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        if (video.src) return;
        video.src = video.dataset.src;
        video.load();
        observer.unobserve(video);
      });
    }, { rootMargin: '200px' });

    lazyVideos.forEach((v) => observer.observe(v));
  }

  /* ═══════════════════════════════════════════
     CURSOR GLOW (desktop only)
     ═══════════════════════════════════════════ */
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const glow = document.getElementById('cursorGlow');

  if (!isTouch && glow) {
    let glowX = 0, glowY = 0, curX = 0, curY = 0;

    document.addEventListener('mousemove', (e) => {
      glowX = e.clientX;
      glowY = e.clientY;
    });

    (function animateGlow() {
      curX += (glowX - curX) * 0.08;
      curY += (glowY - curY) * 0.08;
      glow.style.left = curX + 'px';
      glow.style.top = curY + 'px';
      requestAnimationFrame(animateGlow);
    })();
  } else if (glow) {
    glow.style.display = 'none';
  }

  /* ═══════════════════════════════════════════
     NAV SCROLL STATE
     ═══════════════════════════════════════════ */
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });

  /* ═══════════════════════════════════════════
     SCROLL ANIMATIONS (Intersection Observer)
     ═══════════════════════════════════════════ */
  function initScrollAnimations() {
    const els = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => entry.target.classList.add('visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    els.forEach((el) => observer.observe(el));
  }

  /* ═══════════════════════════════════════════
     CINEMATIC MONTAGE ENGINE
     ═══════════════════════════════════════════ */
  function initMontage() {
    const slides = Array.from(document.querySelectorAll('.montage-slide'));
    if (slides.length === 0) return;

    let current = 0;
    let timer = null;
    const loaded = new Set();

    function loadSlide(index) {
      if (loaded.has(index)) return;
      const video = slides[index].querySelector('video');
      if (!video) return;
      const src = video.dataset.src;
      if (!src) return;

      video.src = src;
      video.load();
      loaded.add(index);
    }

    function playSlide(index) {
      const video = slides[index].querySelector('video');
      if (!video || !video.src) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    function resetKenBurns(slide) {
      const video = slide.querySelector('video');
      if (!video) return;
      video.style.animation = 'none';
      void video.offsetHeight;
      video.style.animation = '';
    }

    function advance() {
      const next = (current + 1) % slides.length;

      // Preload upcoming clips
      for (let i = 1; i <= PRELOAD_AHEAD + 1; i++) {
        loadSlide((current + i) % slides.length);
      }

      slides[current].classList.remove('active');
      slides[next].classList.add('active');
      resetKenBurns(slides[next]);
      playSlide(next);

      current = next;
    }

    // Load first clip + next one only; rest load on-demand via advance()
    loadSlide(0);
    loadSlide(1);

    const firstVideo = slides[0].querySelector('video');
    if (firstVideo) {
      const tryPlay = () => {
        firstVideo.play().catch(() => {});
        firstVideo.removeEventListener('canplaythrough', tryPlay);
      };
      firstVideo.addEventListener('canplaythrough', tryPlay);
      if (firstVideo.readyState >= 3) firstVideo.play().catch(() => {});
    }

    timer = setInterval(advance, CLIP_DURATION);

    // Pause cycling when tab is hidden to save resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(timer);
        slides.forEach((s) => {
          const v = s.querySelector('video');
          if (v) v.pause();
        });
      } else {
        playSlide(current);
        timer = setInterval(advance, CLIP_DURATION);
      }
    });
  }

  /* ═══════════════════════════════════════════
     SCROLL: Hero Parallax + Montage Reveal
     ═══════════════════════════════════════════ */
  const heroContent  = document.getElementById('heroContent');
  const montageBlur  = document.getElementById('montageBlur');
  const heroSection  = document.getElementById('hero');

  window.addEventListener('scroll', () => {
    const scrollY    = window.scrollY;
    const heroH      = heroSection ? heroSection.offsetHeight : window.innerHeight;
    if (scrollY > heroH) return;

    const ratio = Math.min(scrollY / heroH, 1);

    // Hero text: float up and fade out
    if (heroContent) {
      heroContent.style.transform = `translateY(${scrollY * 0.35}px)`;
      heroContent.style.opacity   = Math.max(0, 1 - ratio * 1.5);
    }

    // Montage blur: reduce as user scrolls (6px → 0px)
    if (montageBlur) {
      const blur = Math.max(0, 3 - ratio * 6);
      montageBlur.style.backdropFilter       = `blur(${blur}px)`;
      montageBlur.style.webkitBackdropFilter  = `blur(${blur}px)`;
      // Also lighten the blur layer opacity to reveal more
      montageBlur.style.opacity = Math.max(0, 1 - ratio * 2);
    }
  }, { passive: true });

  /* ═══════════════════════════════════════════
     SMOOTH ANCHOR SCROLLING
     ═══════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ═══════════════════════════════════════════
     SCROLL-DRIVEN TRANSITIONS ENGINE
     ═══════════════════════════════════════════ */
  const snapSections = document.querySelectorAll('.scroll-snap-section');
  const wH = () => window.innerHeight;

  function updateScrollSections() {
    const viewH = wH();

    snapSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const ratio = (center - viewH / 2) / viewH;

      // State: active (in view), above (scrolled past), below (not yet)
      if (rect.top < viewH * 0.85 && rect.bottom > viewH * 0.15) {
        section.classList.add('ss-active');
        section.classList.remove('ss-above', 'ss-below');
      } else if (rect.bottom <= viewH * 0.15) {
        section.classList.add('ss-above');
        section.classList.remove('ss-active', 'ss-below');
      } else {
        section.classList.add('ss-below');
        section.classList.remove('ss-active', 'ss-above');
      }

      // Parallax for phone frames and stat panels
      if (rect.top < viewH && rect.bottom > 0) {
        const progress = (viewH - rect.top) / (viewH + rect.height);
        const offset = (progress - 0.5) * 50;

        const phone = section.querySelector('.ap-phone-frame');
        const stats = section.querySelector('.ap-stats');

        if (phone) {
          const isActive = section.classList.contains('ss-active');
          const scale = isActive ? 1.03 : 1;
          phone.style.transform = `scale(${scale}) translateY(${-offset * 0.8}px)`;
        }
        if (stats) {
          stats.style.transform = `translateY(${offset * 0.4}px)`;
        }
      }

      // Autoplay/pause all videos in section
      const videos = section.querySelectorAll('.ap-video, .fs-video-bg video');
      if (section.classList.contains('ss-active')) {
        section.classList.add('ap-active');
        videos.forEach((v) => v.play().catch(() => {}));
      } else {
        section.classList.remove('ap-active');
        videos.forEach((v) => v.pause());
      }

      // Stagger children
      const staggers = section.querySelectorAll('.ss-stagger');
      if (section.classList.contains('ss-active')) {
        staggers.forEach((el, i) => {
          el.style.transitionDelay = (i * 0.12) + 's';
        });
      } else {
        staggers.forEach((el) => {
          el.style.transitionDelay = '0s';
        });
      }
    });
  }

  // Initialize states
  snapSections.forEach((s) => s.classList.add('ss-below'));
  updateScrollSections();

  // Throttled scroll listener
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateScrollSections();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ═══════════════════════════════════════════
     ANIMATED METRIC COUNTERS (scroll-triggered)
     ═══════════════════════════════════════════ */
  const metricValues = document.querySelectorAll('.metric-value[data-count], .ap-big-number[data-count], .ap-case-num[data-count], .ap-stat-primary[data-count], .ap-countup[data-count]');
  const metricFills  = document.querySelectorAll('.metric-fill[data-width]');
  const animatedMetrics = new Set();

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (target >= 1000) {
        el.textContent = (current / 1000).toFixed(current >= target ? 0 : 1) + 'K' + suffix;
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const metricsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (animatedMetrics.has(el)) return;
      animatedMetrics.add(el);

      if (el.dataset.count) {
        animateCounter(el);
      }
      if (el.dataset.width) {
        setTimeout(() => {
          el.style.width = el.dataset.width + '%';
          el.classList.add('animated');
        }, 200);
      }
    });
  }, { threshold: 0.3 });

  metricValues.forEach((el) => metricsObserver.observe(el));
  metricFills.forEach((el) => metricsObserver.observe(el));

})();
