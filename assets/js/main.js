/* ===========================================================================
   main.js — Version nettoyée & stabilisée
   Aucun changement visuel — Comportement identique
   =========================================================================== */

"use strict";

/* -------------------------
   Helpers
------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* -------------------------
   DOM ELEMENTS
------------------------- */
const header       = $("header");
const navLinks     = $$("header nav a");
const themeToggle  = $("#theme-toggle");
const yearEl       = $("#year");

/* ===========================================================================
   MODE SOMBRE / CLAIR
=========================================================================== */
(function initTheme() {
  const saved = localStorage.getItem("site_theme");
  const initial = saved || "dark";
  document.body.setAttribute("data-theme", initial);

  if (themeToggle) {
    const syncLabel = () => {
      const cur = document.body.getAttribute("data-theme");
      themeToggle.textContent = cur === "dark" ? "🌙 Mode sombre" : "☀️ Mode clair";
    };

    syncLabel();

    themeToggle.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("site_theme", next);
      syncLabel();
    });
  }
})();

/* ===========================================================================
   ANNÉE AUTO
=========================================================================== */
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===========================================================================
   MENU BURGER
=========================================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const burgerBtn  = $("#burger-btn");
  const mobileMenu = $("#mobile-menu");

  if (!burgerBtn || !mobileMenu) return;

  function openMobileMenu() {
    burgerBtn.classList.add("active");
    mobileMenu.classList.add("open");

    // Accessibilité
    mobileMenu.removeAttribute("inert");
    mobileMenu.setAttribute("aria-hidden", "false");

    // Empêcher le scroll
    document.body.style.overflow = "hidden";
  }

function closeMobileMenu() {

  // Fix définitif : retirer le focus du lien actif
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // Puis remettre le focus sur le bouton
  burgerBtn.focus();

  burgerBtn.classList.remove("active");
  mobileMenu.classList.remove("open");

  mobileMenu.setAttribute("inert", "");
  mobileMenu.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}


  burgerBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("open");
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  /* Fermeture auto + smooth scroll */
  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", (e) => {
      const targetSel = link.getAttribute("href");
      const target = document.querySelector(targetSel);

      closeMobileMenu();

      if (target) {
        e.preventDefault();
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      }
    });
  });

});


/* ===========================================================================
   EFFET RIPPLE SUR LA NAV DESKTOP
=========================================================================== */
navLinks.forEach(a => {
  a.addEventListener("click", (e) => {
    const r = document.createElement("span");
    r.className = "ripple";

    const rect = a.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;

    r.style.width  = size + "px";
    r.style.height = size + "px";
    r.style.left   = (e.clientX - rect.left - size / 2) + "px";
    r.style.top    = (rect.height / 2 - size / 2) + "px";

    a.appendChild(r);
    r.addEventListener("animationend", () => r.remove());
  });
});

/* ===========================================================================
   SCROLL (reveal, header shrink, nav active)
=========================================================================== */
let ticking = false;

function handleScroll() {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    const threshold = window.innerHeight * 0.85;

    /* reveal */
    $$(".reveal").forEach(el => {
      if (el.getBoundingClientRect().top < threshold) {
        el.classList.add("visible");
      }
    });

    /* nav active */
    const sections = $$("main section[id]");
    let current = "";

    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= window.innerHeight * 0.3 && top > -sec.clientHeight) {
        current = sec.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });

    /* header shrink */
    if (header) header.classList.toggle("shrink", window.scrollY > 60);

    ticking = false;
  });
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("load", handleScroll);

/* ===========================================================================
   SMOOTH SCROLL ANCHORS (desktop)
=========================================================================== */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || href.length < 2) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    const offset = 12;

    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: "smooth"
    });
  });
});

/* ===========================================================================
   BACKGROUND PARTICLES (inchangé)
=========================================================================== */
(function particlesModule() {
  const canvas = document.getElementById("bg-particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let TOTAL = 80;
  const DIST = 150;
  const DPR = window.devicePixelRatio || 1;

  function resize() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function estimateCount() {
    const area = window.innerWidth * window.innerHeight;
    return Math.max(20, Math.min(120, Math.round(area * 0.00014)));
  }

  class Particle {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * window.innerWidth;
      this.y = Math.random() * window.innerHeight;

      const s = (Math.random() - 0.5) * (initial ? 0.6 : 1);
      this.vx = s * 0.6;
      this.vy = s * 0.6;
      this.r = 1 + Math.random() * 1.6;
    }
    move() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -10 || this.x > window.innerWidth + 10) this.reset();
      if (this.y < -10 || this.y > window.innerHeight + 10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(56,189,248,0.85)";
      ctx.shadowBlur = window.innerWidth < 800 ? 8 : 14;
      ctx.shadowColor = "rgba(56,189,248,0.9)";
      ctx.fill();
    }
  }

  function init() {
    TOTAL = estimateCount();
    particles = Array.from({ length: TOTAL }, () => new Particle());
  }

  resize();
  init();

  let frame = 0;
  const LINE_SKIP = window.innerWidth < 800 ? 2 : 1;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* lines */
    if (frame % LINE_SKIP === 0) {
      for (let i = 0; i < TOTAL; i++) {
        for (let j = i + 1; j < TOTAL; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < DIST) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56,189,248,${Math.max(0.06, (1 - d / DIST) * 0.6)})`;
            ctx.lineWidth = 0.9;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    particles.forEach(p => {
      p.move();
      p.draw();
    });

    frame++;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  let resizeTO;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(() => {
      resize();
      init();
    }, 140);
  });
})();

/* ===========================================================================
   SAFETY FIX (inchangé)
=========================================================================== */
(function safetyFix() {
  try {
    const root = document.getElementById("rayhai-root");
    if (root) {
      root.style.position = "fixed";
      root.style.transform = "none";
    }
  } catch (e) {
    console.warn("safetyFix failed", e);
  }
})();
