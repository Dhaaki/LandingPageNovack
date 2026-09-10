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

  initCarousel();
});

function initCarousel() {
  var root = document.querySelector('[data-carousel]');
  if (!root) return;

  var track = root.querySelector('[data-carousel-track]');
  var slides = Array.prototype.slice.call(track.children);
  var dotsWrap = root.querySelector('[data-carousel-dots]');
  var prevBtn = document.querySelector('[data-carousel-prev]');
  var nextBtn = document.querySelector('[data-carousel-next]');
  if (slides.length < 2) return;

  var AUTOPLAY_MS = 5000;
  var index = 0;
  var timer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = slides.map(function (_, i) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', 'Ir para equipamento ' + (i + 1));
    dot.addEventListener('click', function () {
      goTo(i);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

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
    if (reducedMotion) return;
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) { clearInterval(timer); timer = null; }
  }
  function restartAutoplay() { startAutoplay(); }

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartAutoplay(); });

  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);
  root.addEventListener('focusin', stopAutoplay);
  root.addEventListener('focusout', startAutoplay);

  // Swipe / drag support
  var startX = null;
  var deltaX = 0;
  var dragging = false;
  var activePointerId = null;

  track.addEventListener('pointerdown', function (e) {
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
    if (!dragging || e.pointerId !== activePointerId) return;
    deltaX = e.clientX - startX;
  });
  function endDrag(e) {
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
}
