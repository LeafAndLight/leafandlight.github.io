const heroBackground = document.querySelector('.hero-bg');
const slideDots = document.querySelector('.slide-dots');
const heroImages = Array.isArray(window.HERO_IMAGES) ? window.HERO_IMAGES : [];

heroImages.forEach((image, index) => {
  const slide = document.createElement('div');
  slide.className = `hero-slide${index === 0 ? ' active' : ''}`;

  const img = document.createElement('img');
  img.src = image.src;
  img.alt = image.alt || '';
  img.style.objectPosition = image.position || 'center';
  slide.appendChild(img);
  heroBackground?.appendChild(slide);

  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = index === 0 ? 'active' : '';
  dot.dataset.index = String(index);
  dot.setAttribute('aria-label', `Show slide ${index + 1}`);
  slideDots?.appendChild(dot);
});

const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dots = Array.from(document.querySelectorAll('.slide-dots button'));
let activeIndex = 0;

function showSlide(index) {
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  activeIndex = index;
}

dots.forEach(dot => {
  dot.addEventListener('click', () => showSlide(Number(dot.dataset.index)));
});

if (slides.length > 1) {
  setInterval(() => showSlide((activeIndex + 1) % slides.length), 5000);
}

const emailAddress = 'leafandlightcontac@gmail.com';
const copyEmailBtn = document.getElementById('copyEmailBtn');
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
const contactCard = document.getElementById('contactCard');
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactMessage = document.getElementById('contactMessage');
const submitButton = contactForm?.querySelector('.submit-btn');
// Talent solar system: every label follows one ellipse while its ring only floats.
const talentSystem = document.querySelector('.approach-visual');

if (talentSystem) {
  const talentRings = Array.from(talentSystem.querySelectorAll('.talent-orbit'));
  const reducedTalentMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ringPeriods = [56000, 52500, 49500];
  const floatPeriods = [11200, 12800, 14500];
  const floatPhases = [0.3, 2.1, 4.2];
  let talentVisible = false;
  let talentRunning = false;
  let talentClock = 0;
  let talentLastFrame = 0;
  let talentFrameCount = 0;

  const orbitingTalents = talentRings.flatMap((ring, ringIndex) =>
    Array.from(ring.querySelectorAll('.orbit-node')).map(node => ({
      node,
      ring,
      ringIndex,
      baseAngle: Number(node.dataset.angle || 0),
      speed: Number(node.dataset.speed || 1),
      nudge: 0,
      nudgeTarget: 0
    }))
  );

  function visibleOrbitingTalents() {
    return orbitingTalents.filter(talent => getComputedStyle(talent.node).display !== 'none');
  }

  function resolveTalentCollisions() {
    const visibleTalents = visibleOrbitingTalents();
    const rects = visibleTalents.map(talent => talent.node.getBoundingClientRect());

    for (let i = 0; i < visibleTalents.length; i += 1) {
      for (let j = i + 1; j < visibleTalents.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        const padding = 5;
        const overlaps = !(
          a.right + padding < b.left ||
          b.right + padding < a.left ||
          a.bottom + padding < b.top ||
          b.bottom + padding < a.top
        );

        if (!overlaps) continue;

        const sameRing = visibleTalents[i].ringIndex === visibleTalents[j].ringIndex;
        const correction = sameRing ? 0.028 : 0.018;
        visibleTalents[i].nudgeTarget = Math.max(-0.2, visibleTalents[i].nudgeTarget - correction * 0.7);
        visibleTalents[j].nudgeTarget = Math.min(0.2, visibleTalents[j].nudgeTarget + correction);
      }
    }
  }

  function renderTalentSystem(now) {
    if (!talentVisible) {
      talentRunning = false;
      talentLastFrame = 0;
      return;
    }

    if (!talentLastFrame) talentLastFrame = now;
    talentClock += Math.min(now - talentLastFrame, 50);
    talentLastFrame = now;

    talentRings.forEach((ring, ringIndex) => {
      const floatAngle = (talentClock / floatPeriods[ringIndex]) * Math.PI * 2 + floatPhases[ringIndex];
      const offsetX = Math.cos(floatAngle) * (ringIndex === 1 ? 3 : 4);
      const offsetY = Math.sin(floatAngle) * (ringIndex === 2 ? 2.5 : 3.5);
      ring.style.transform = `translate(-50%, -50%) translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px)`;
    });

    visibleOrbitingTalents().forEach(talent => {
      talent.nudge += (talent.nudgeTarget - talent.nudge) * 0.12;
      talent.nudgeTarget *= 0.994;

      const angle = talent.baseAngle +
        (talentClock / ringPeriods[talent.ringIndex]) * Math.PI * 2 * talent.speed +
        talent.nudge;
      const centerX = talent.ring.clientWidth * 0.5;
      const centerY = talent.ring.clientHeight * 0.5;
      const x = centerX + centerX * Math.cos(angle);
      const y = centerY + centerY * Math.sin(angle);
      const depth = (Math.sin(angle) + 1) * 0.5;

      talent.node.style.left = `${x.toFixed(2)}px`;
      talent.node.style.top = `${y.toFixed(2)}px`;
      talent.node.style.opacity = (0.78 + depth * 0.22).toFixed(3);
      talent.node.style.zIndex = String(2 + Math.round(depth * 3));
    });

    talentFrameCount += 1;
    if (talentFrameCount % 3 === 0) resolveTalentCollisions();

    if (!reducedTalentMotion.matches) {
      requestAnimationFrame(renderTalentSystem);
    } else {
      talentRunning = false;
    }
  }

  function startTalentSystem() {
    if (!talentVisible || talentRunning) return;
    talentRunning = true;
    talentLastFrame = 0;
    requestAnimationFrame(renderTalentSystem);
  }

  const talentVisibilityObserver = new IntersectionObserver(entries => {
    talentVisible = entries[0].isIntersecting;
    if (talentVisible) startTalentSystem();
  }, { rootMargin: '120px' });

  const talentResizeObserver = new ResizeObserver(() => {
    if (reducedTalentMotion.matches && talentVisible) startTalentSystem();
  });

  talentVisibilityObserver.observe(talentSystem);
  talentResizeObserver.observe(talentSystem);
  talentRings.forEach(ring => talentResizeObserver.observe(ring));
  reducedTalentMotion.addEventListener('change', startTalentSystem);
}

// Contact and hiring pipeline lives in assets/js/contact-pipeline.js.

// Portfolio interaction
const portfolioShots = document.querySelectorAll('.portfolio-reveal');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const portfolioObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        setTimeout(() => { entry.target.style.transitionDelay = '0ms'; }, 700);
        portfolioObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  portfolioShots.forEach((shot, index) => {
    shot.style.transitionDelay = String(Math.min(index * 70, 280)) + 'ms';
    portfolioObserver.observe(shot);
  });
} else {
  portfolioShots.forEach(shot => shot.classList.add('is-visible'));
}

portfolioShots.forEach(shot => {
  shot.addEventListener('pointermove', event => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 900) return;
    const rect = shot.getBoundingClientRect();
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -3;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 3;
    shot.style.transform = 'perspective(900px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
  });

  shot.addEventListener('pointerleave', () => {
    shot.style.transform = '';
  });
});

// Active section navigation
const sectionNavLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
const trackedSections = sectionNavLinks
  .map(link => ({
    id: link.getAttribute('href').slice(1),
    link,
    section: document.getElementById(link.getAttribute('href').slice(1))
  }))
  .filter(item => item.section);

let navTicking = false;

function updateActiveNavigation() {
  const marker = window.scrollY + window.innerHeight * 0.32;
  let activeId = '';

  trackedSections.forEach(item => {
    if (item.section.offsetTop <= marker) {
      activeId = item.id;
    }
  });

  trackedSections.forEach(item => {
    const isActive = item.id === activeId;
    item.link.classList.toggle('is-active', isActive);
    if (isActive) {
      item.link.setAttribute('aria-current', 'location');
    } else {
      item.link.removeAttribute('aria-current');
    }
  });

  navTicking = false;
}

window.addEventListener('scroll', () => {
  if (!navTicking) {
    navTicking = true;
    window.requestAnimationFrame(updateActiveNavigation);
  }
}, { passive: true });

window.addEventListener('resize', updateActiveNavigation);
updateActiveNavigation();
// Portfolio lightbox
const portfolioOpenButtons = Array.from(document.querySelectorAll('.portfolio-open'));
const portfolioLightbox = document.getElementById('portfolioLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxLabel = document.getElementById('lightboxLabel');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxClose = portfolioLightbox?.querySelector('.lightbox-close');
const lightboxPrevious = portfolioLightbox?.querySelector('.lightbox-prev');
const lightboxNext = portfolioLightbox?.querySelector('.lightbox-next');
let lightboxIndex = 0;
let lightboxTrigger = null;

function updateLightbox(index) {
  if (!portfolioOpenButtons.length || !lightboxImage) return;

  lightboxIndex = (index + portfolioOpenButtons.length) % portfolioOpenButtons.length;
  const trigger = portfolioOpenButtons[lightboxIndex];
  const figure = trigger.closest('.shot');
  const sourceImage = trigger.querySelector('img');
  const label = figure?.querySelector('figcaption span');
  const title = figure?.querySelector('figcaption strong');

  document.querySelectorAll('#portfolio .shot.is-selected').forEach(item => item.classList.remove('is-selected'));
  figure?.classList.add('is-selected');

  lightboxImage.src = sourceImage.src;
  lightboxImage.alt = sourceImage.alt;
  lightboxLabel.textContent = label?.textContent || '';
  lightboxTitle.textContent = title?.textContent || '';
}

function openLightbox(index, trigger) {
  if (!portfolioLightbox) return;

  lightboxTrigger = trigger;
  updateLightbox(index);
  portfolioLightbox.classList.add('is-open');
  portfolioLightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
  lightboxClose?.focus();
}

function closeLightbox() {
  if (!portfolioLightbox) return;

  portfolioLightbox.classList.remove('is-open');
  portfolioLightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  lightboxTrigger?.focus();
}

portfolioOpenButtons.forEach((button, index) => {
  button.addEventListener('click', () => openLightbox(index, button));
});

lightboxClose?.addEventListener('click', closeLightbox);
lightboxPrevious?.addEventListener('click', () => updateLightbox(lightboxIndex - 1));
lightboxNext?.addEventListener('click', () => updateLightbox(lightboxIndex + 1));

portfolioLightbox?.addEventListener('click', event => {
  if (event.target === portfolioLightbox) closeLightbox();
});

document.addEventListener('keydown', event => {
  if (!portfolioLightbox?.classList.contains('is-open')) return;

  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') updateLightbox(lightboxIndex - 1);
  if (event.key === 'ArrowRight') updateLightbox(lightboxIndex + 1);
});
const themeButtons = Array.from(document.querySelectorAll('.theme-dot'));
const themeClassNames = ['vr-ai-theme', 'miami-deco-theme', 'arcade-theme'];
const themeMap = {
  base: [],
  vr: ['vr-ai-theme'],
  retro: ['arcade-theme'],
  miami: ['vr-ai-theme', 'miami-deco-theme']
};

function applyTheme(themeName, shouldStore = true) {
  const nextTheme = Object.prototype.hasOwnProperty.call(themeMap, themeName) ? themeName : 'miami';
  document.body.classList.remove(...themeClassNames);
  document.body.classList.add(...themeMap[nextTheme]);
  document.body.dataset.theme = nextTheme;
  themeButtons.forEach(button => {
    const isActive = button.dataset.theme === nextTheme;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  if (shouldStore) {
    localStorage.setItem('leafLightTheme', nextTheme);
  }
}

const savedTheme = localStorage.getItem('leafLightTheme') || 'miami';
applyTheme(savedTheme, false);

themeButtons.forEach(button => {
  button.addEventListener('click', () => applyTheme(button.dataset.theme || 'miami'));
});