const stops = [...document.querySelectorAll('.stop')];
const hero = document.querySelector('.hero');
const portrait = document.querySelector('.hero-scene img');
const display = document.querySelector('#floor-display');
const floorNav = [...document.querySelectorAll('.lift nav a')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0;
let activeStop = -1;

function drawElevator() {
  frame = 0;
  const viewport = document.documentElement.clientHeight;
  const scrollRange = Math.max(1, document.documentElement.scrollHeight - viewport);
  const progress = Math.min(1, Math.max(0, window.scrollY / scrollRange));
  const marker = viewport * 0.47;
  let nextStop = 0;

  stops.forEach((stop, index) => {
    if (stop.getBoundingClientRect().top <= marker) nextStop = index;
  });

  document.documentElement.style.setProperty('--travel', progress.toFixed(3));
  if (nextStop !== activeStop) {
    display.value = stops[nextStop].dataset.floor;
    floorNav.forEach((link, index) => {
      if (index === nextStop) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    activeStop = nextStop;
  }

  const heroTravel = Math.min(hero.offsetHeight, Math.max(0, window.scrollY));
  portrait.style.setProperty('--portrait-shift', reducedMotion.matches ? '0px' : heroTravel * 0.19 + 'px');
}

function scheduleDraw() {
  if (!frame) frame = window.requestAnimationFrame(drawElevator);
}

window.addEventListener('scroll', scheduleDraw, { passive: true });
window.addEventListener('resize', scheduleDraw, { passive: true });
window.addEventListener('pageshow', scheduleDraw);
reducedMotion.addEventListener('change', scheduleDraw);
drawElevator();
