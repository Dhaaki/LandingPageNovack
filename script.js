document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;

  toggle.addEventListener('click', function () {
    var isOpen = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.querySelectorAll('.mobile-nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  var desktopQuery = window.matchMedia('(min-width: 961px)');
  function closeOnDesktop(e) {
    if (e.matches) {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }
  desktopQuery.addEventListener('change', closeOnDesktop);

  initMainCarousel();
  initGalleries();
});

// Generic swipeable carousel: pointer-capture drag, optional autoplay,
// optional arrows/dots. Used for the top-level product carousel and for
// each product's nested photo gallery.
function createCarousel(config) {
  var root = config.root;
  var track = config.track;
  if (!track) return null;
  var slides = Array.prototype.slice.call(track.children);
  if (slides.length < 2) return null;

  var dotsWrap = config.dotsWrap || null;
  var prevBtn = config.prevBtn || null;
  var nextBtn = config.nextBtn || null;
  var autoplay = !!config.autoplay;
  var autoplayMs = config.autoplayMs || 5000;
  var stopPropagationOnDrag = !!config.stopPropagationOnDrag;
  var dotAriaLabel = config.dotAriaLabel || 'Ir para item ';

  var index = 0;
  var timer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = [];
  if (dotsWrap) {
    dots = slides.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', dotAriaLabel + (i + 1));
      dot.addEventListener('click', function (e) {
        if (stopPropagationOnDrag) e.stopPropagation();
        goTo(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });
  }

  function render() {
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); });
    slides.forEach(function (slide, i) { slide.setAttribute('aria-hidden', i === index ? 'false' : 'true'); });
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function startAutoplay() {
    if (!autoplay || reducedMotion) return;
    stopAutoplay();
    timer = setInterval(next, autoplayMs);
  }
  function stopAutoplay() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function restartAutoplay() { startAutoplay(); }

  if (prevBtn) prevBtn.addEventListener('click', function (e) {
    if (stopPropagationOnDrag) e.stopPropagation();
    prev();
    restartAutoplay();
  });
  if (nextBtn) nextBtn.addEventListener('click', function (e) {
    if (stopPropagationOnDrag) e.stopPropagation();
    next();
    restartAutoplay();
  });

  if (autoplay && root) {
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);
  }

  if (stopPropagationOnDrag && root) {
    // Arrows and dots live in `root` but outside `track`, so their own
    // pointerdown still bubbles past this carousel straight to the outer
    // one — which then calls setPointerCapture on itself and hijacks the
    // button's pointerup, so its synthesized click never fires. Stopping
    // propagation at the root catches every pointer event from any child
    // (track, arrows, dots) before it can reach an ancestor carousel.
    ['pointerdown', 'pointerup', 'pointercancel'].forEach(function (type) {
      root.addEventListener(type, function (e) { e.stopPropagation(); });
    });
  }

  // Swipe / drag support
  var startX = null;
  var deltaX = 0;
  var dragging = false;
  var activePointerId = null;

  track.addEventListener('pointerdown', function (e) {
    // A gallery nested inside another carousel must stop this event from
    // bubbling to the outer track's own pointerdown — otherwise one touch
    // drag would drive both carousels at once.
    if (stopPropagationOnDrag) e.stopPropagation();
    dragging = true;
    startX = e.clientX;
    deltaX = 0;
    activePointerId = e.pointerId;
    // Pointer capture keeps move/up events targeted at the track even if the
    // finger drifts outside its bounds mid-swipe — without it, touch drags
    // fire a premature pointerleave/cancel before reaching the threshold.
    if (track.setPointerCapture) {
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    }
    stopAutoplay();
  });
  track.addEventListener('pointermove', function (e) {
    if (stopPropagationOnDrag) e.stopPropagation();
    if (!dragging || e.pointerId !== activePointerId) return;
    deltaX = e.clientX - startX;
  });
  function endDrag(e) {
    if (stopPropagationOnDrag && e) e.stopPropagation();
    if (!dragging) return;
    if (e && e.pointerId !== activePointerId) return;
    dragging = false;
    if (track.releasePointerCapture && activePointerId !== null) {
      try { track.releasePointerCapture(activePointerId); } catch (err) {}
    }
    activePointerId = null;
    var threshold = 50;
    if (deltaX > threshold) prev();
    else if (deltaX < -threshold) next();
    startX = null;
    deltaX = 0;
    restartAutoplay();
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  render();
  startAutoplay();

  return { goTo: goTo, next: next, prev: prev };
}

function initMainCarousel() {
  var root = document.querySelector('[data-carousel]');
  if (!root) return;
  createCarousel({
    root: root,
    track: root.querySelector('[data-carousel-track]'),
    dotsWrap: root.querySelector('[data-carousel-dots]'),
    prevBtn: document.querySelector('[data-carousel-prev]'),
    nextBtn: document.querySelector('[data-carousel-next]'),
    autoplay: true,
    autoplayMs: 5000,
    stopPropagationOnDrag: false,
    dotAriaLabel: 'Ir para equipamento '
  });
}

function initGalleries() {
  document.querySelectorAll('[data-gallery]').forEach(function (galleryRoot) {
    createCarousel({
      root: galleryRoot,
      track: galleryRoot.querySelector('[data-gallery-track]'),
      dotsWrap: galleryRoot.querySelector('[data-gallery-dots]'),
      prevBtn: galleryRoot.querySelector('[data-gallery-prev]'),
      nextBtn: galleryRoot.querySelector('[data-gallery-next]'),
      autoplay: false,
      stopPropagationOnDrag: true,
      dotAriaLabel: 'Ir para foto '
    });
  });
}
