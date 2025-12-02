/* ============================================
   RAYHAN PORTFOLIO - MAIN SCRIPT
   Version 2.0 Optimized - 2025
============================================ */

'use strict';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  particleCount: 60,
  scrollThreshold: 0.2,
  headerScrollThreshold: 100,
  particleDistance: 150,
  animationDelay: 100
};

// ============================================
// UTILITIES
// ============================================

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================
// THEME MANAGER
// ============================================

class ThemeManager {
  constructor() {
    this.body = document.body;
    this.toggleBtn = $('#theme-toggle');
    this.toggleBtnMobile = $('#theme-toggle-mobile');
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    this.apply(this.currentTheme);
    
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }
    
    if (this.toggleBtnMobile) {
      this.toggleBtnMobile.addEventListener('click', () => this.toggle());
    }
  }

  apply(theme) {
    this.body.setAttribute('data-theme', theme);
    this.currentTheme = theme;
  }

  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Smooth transition
    this.body.style.transition = 'background 0.3s ease, color 0.3s ease';
  }
}

// ============================================
// NAVIGATION
// ============================================

class Navigation {
  constructor() {
    this.header = $('#header');
    this.burger = $('#burger-btn');
    this.mobileMenu = $('#mobile-menu');
    this.mobileLinks = $$('.mobile-link');
    this.navLinks = $$('.nav-link');
    this.isOpen = false;
    
    this.init();
  }

  init() {
    // Burger toggle
    if (this.burger && this.mobileMenu) {
      this.burger.addEventListener('click', () => this.toggleMobile());
      
      // Close on link click
      this.mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.closeMobile();
          this.smoothScroll(link);
        });
      });
      
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.mobileMenu.contains(e.target) && !this.burger.contains(e.target)) {
          this.closeMobile();
        }
      });
      
      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closeMobile();
        }
      });
    }

    // Desktop smooth scroll
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => this.smoothScroll(link, e));
    });

    // Header scroll effect
    window.addEventListener('scroll', throttle(() => this.handleScroll(), 100));
  }

  toggleMobile() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.openMobile();
    } else {
      this.closeMobile();
    }
  }

  openMobile() {
    this.burger.classList.add('active');
    this.mobileMenu.classList.add('open');
    this.mobileMenu.removeAttribute('inert');
    this.mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Hide RayhAI bubble & panel when mobile menu opens
const rayBubble = document.querySelector('.rayhai-bubble');
const rayPanel = document.querySelector('.rayhai-panel');

if (rayBubble) rayBubble.classList.add('hide');
if (rayPanel) rayPanel.classList.add('hide');

  }

  closeMobile() {
    this.burger.classList.remove('active');
    this.mobileMenu.classList.remove('open');
    this.mobileMenu.setAttribute('inert', '');
    this.mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.isOpen = false;

    // Show RayhAI bubble & panel when mobile menu closes
const rayBubble = document.querySelector('.rayhai-bubble');
const rayPanel = document.querySelector('.rayhai-panel');

if (rayBubble) rayBubble.classList.remove('hide');
if (rayPanel) rayPanel.classList.remove('hide');

  }

  smoothScroll(link, event) {
    const href = link.getAttribute('href');
    
    if (!href || !href.startsWith('#')) return;
    
    if (event) event.preventDefault();
    
    const target = $(href);
    if (target) {
      const offset = 80;
      const targetPosition = target.offsetTop - offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  handleScroll() {
    if (window.scrollY > CONFIG.headerScrollThreshold) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
  }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

class ScrollAnimations {
  constructor() {
    this.elements = $$('.reveal');
    this.observer = null;
    this.init();
  }

  init() {
    const options = {
      root: null,
      threshold: CONFIG.scrollThreshold,
      rootMargin: '0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    this.elements.forEach(element => {
      this.observer.observe(element);
    });

    // Initial animation for hero
    setTimeout(() => {
      const hero = $('.hero');
      if (hero) hero.classList.add('visible');
    }, CONFIG.animationDelay);
  }
}

// ============================================
// ACTIVE NAV LINK
// ============================================

class ActiveNavLink {
  constructor() {
    this.sections = $$('section[id]');
    this.navLinks = $$('.nav-link');
    
    if (this.sections.length && this.navLinks.length) {
      this.init();
    }
  }

  init() {
    window.addEventListener('scroll', throttle(() => this.update(), 100));
    this.update();
  }

  update() {
    let current = '';
    
    this.sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    this.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }
}

// ============================================
// PARTICLE SYSTEM
// ============================================

class ParticleSystem {
  constructor() {
    this.canvas = $('#bg-particles');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.dpr = window.devicePixelRatio || 1;
    
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.animate();
    
    window.addEventListener('resize', debounce(() => {
      this.resize();
      this.createParticles();
    }, 250));
  }

  resize() {
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  createParticles() {
    this.particles = [];
    const count = Math.min(CONFIG.particleCount, Math.floor(window.innerWidth * window.innerHeight / 15000));
    
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(window.innerWidth, window.innerHeight));
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      particle.update(window.innerWidth, window.innerHeight);
      particle.draw(this.ctx);
    });
    
    // Draw connections
    if (window.innerWidth > 768) {
      this.drawConnections();
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < CONFIG.particleDistance) {
          const opacity = (1 - distance / CONFIG.particleDistance) * 0.5;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }
}

class Particle {
  constructor(width, height) {
    this.reset(width, height, true);
  }

  reset(width, height, initial = false) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    
    const speed = initial ? 0.3 : 0.5;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.radius = 1 + Math.random() * 1.5;
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
      this.reset(width, height);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.fill();
  }
}

// ============================================
// CARD HOVER EFFECTS
// ============================================

class CardHoverEffects {
  constructor() {
    this.cards = $$('.skill-card, .project-card, .quote-card');
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      card.addEventListener('mouseenter', () => this.onEnter(card));
      card.addEventListener('mouseleave', () => this.onLeave(card));
      card.addEventListener('mousemove', (e) => this.onMove(card, e));
    });
  }

  onEnter(card) {
    card.style.transition = 'transform 0.1s ease';
  }

  onLeave(card) {
    card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
    card.style.transition = 'transform 0.4s ease';
  }

  onMove(card, e) {
    if (window.innerWidth < 768) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.transform = `
      translateY(-10px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg)
    `;
  }
}

// ============================================
// SMOOTH SCROLL FOR ALL ANCHORS
// ============================================

class SmoothScroll {
  constructor() {
    this.links = $$('a[href^="#"]');
    this.init();
  }

  init() {
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        if (!href || href === '#') return;
        
        const target = $(href);
        
        if (target) {
          e.preventDefault();
          
          const offset = 80;
          const targetPosition = target.offsetTop - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

// ============================================
// YEAR AUTO UPDATE
// ============================================

function setCurrentYear() {
  const yearElement = $('#year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// ============================================
// ENTRANCE ANIMATION
// ============================================

function initEntranceAnimation() {
  document.body.style.opacity = '0';
  
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.6s ease';
    document.body.style.opacity = '1';
  }, 100);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  console.log('🚀 Portfolio Rayhan - Initialized');
  
  // Initialize all modules
  new ThemeManager();
  new Navigation();
  new ScrollAnimations();
  new ParticleSystem();
  new ActiveNavLink();
  new SmoothScroll();
  new CardHoverEffects();
  
  setCurrentYear();
  initEntranceAnimation();
  
  // Performance monitoring
  if (window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`📊 Page loaded in: ${pageLoadTime}ms`);
  }
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ============================================
// LAUNCH
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose for debugging
window.PortfolioDebug = {
  CONFIG,
  version: '2.0'
};

