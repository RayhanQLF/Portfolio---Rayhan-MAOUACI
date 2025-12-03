/* ============================================
   RAYHAN PORTFOLIO - MAIN SCRIPT
   Apple Premium Version 2025
============================================ */

'use strict';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  scrollThreshold: 0.15,
  headerScrollThreshold: 20,
  animationDelay: 50,
  debounceDelay: 150,
  throttleDelay: 100
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
// THEME MANAGER (Apple Style)
// ============================================

class ThemeManager {
  constructor() {
    this.body = document.body;
    this.toggleBtn = $('#theme-toggle');
    this.toggleBtnMobile = $('#theme-toggle-mobile');
    this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
    this.init();
  }

  getStoredTheme() {
    return localStorage.getItem('theme');
  }

  getPreferredTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  init() {
    this.apply(this.currentTheme);
    
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }
    
    if (this.toggleBtnMobile) {
      this.toggleBtnMobile.addEventListener('click', () => this.toggle());
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!this.getStoredTheme()) {
          this.apply(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  apply(theme) {
    this.body.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    
    // Update meta theme-color for mobile browsers
    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
    }
  }

  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Add smooth transition class
    this.body.style.setProperty('transition', 'background 0.5s cubic-bezier(0.28, 0.11, 0.32, 1), color 0.5s cubic-bezier(0.28, 0.11, 0.32, 1)');
    
    setTimeout(() => {
      this.body.style.removeProperty('transition');
    }, 500);
  }
}

// ============================================
// NAVIGATION (Apple Style)
// ============================================

class Navigation {
  constructor() {
    this.header = $('#header');
    this.burger = $('#burger-btn');
    this.mobileMenu = $('#mobile-menu');
    this.mobileLinks = $$('.mobile-link');
    this.navLinks = $$('.apple-nav-link');
    this.isOpen = false;
    
    this.init();
  }

  init() {
    // Burger toggle
    if (this.burger && this.mobileMenu) {
      this.burger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobile();
      });
      
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

    // Header scroll effect (Apple style)
    window.addEventListener('scroll', throttle(() => this.handleScroll(), CONFIG.throttleDelay), { passive: true });
    
    // Initial check
    this.handleScroll();
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
  this.burger.setAttribute('aria-expanded', 'true');

  this.mobileMenu.classList.add('open');
  this.mobileMenu.removeAttribute('inert'); // ← ouverture propre

  document.body.style.overflow = 'hidden';
  this.isOpen = true;

  // Temporarily hide RayhAI when mobile menu opens
  const rayBubble = $('.rayhai-bubble');
  const rayPanel = $('.rayhai-panel');
  if (rayBubble) rayBubble.style.opacity = '0';
  if (rayPanel && rayPanel.classList.contains('open')) {
    window.RayhaiPanel?.close();
  }
}

closeMobile() {
  this.burger.classList.remove('active');
  this.burger.setAttribute('aria-expanded', 'false');

  this.mobileMenu.classList.remove('open');
  this.mobileMenu.setAttribute('inert', ''); // ← évite l’erreur ARIA

  document.body.style.overflow = '';
  this.isOpen = false;

  // Restore RayhAI visibility
  const rayBubble = $('.rayhai-bubble');
  if (rayBubble) {
    setTimeout(() => {
      rayBubble.style.opacity = '';
    }, 300);
  }
}


  smoothScroll(link, event) {
    const href = link.getAttribute('href');
    
    if (!href || !href.startsWith('#')) return;
    
    if (event) event.preventDefault();
    
    const target = $(href);
    if (target) {
      const headerHeight = this.header.offsetHeight;
      const targetPosition = target.offsetTop - headerHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Update URL without triggering scroll
      history.replaceState(null, null, href);
    }
  }

  handleScroll() {
    const scrolled = window.scrollY > CONFIG.headerScrollThreshold;
    
    if (scrolled) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
    
    // Close mobile menu on significant scroll
    if (this.isOpen && window.scrollY > 100) {
      this.closeMobile();
    }
  }
}

// ============================================
// SCROLL ANIMATIONS (Intersection Observer)
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
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger animation for multiple elements
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 50);
          
          // Unobserve after animation
          this.observer.unobserve(entry.target);
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
// ACTIVE NAV LINK (Apple Style)
// ============================================

class ActiveNavLink {
  constructor() {
    this.sections = $$('section[id]');
    this.navLinks = $$('.apple-nav-link, .mobile-link');
    
    if (this.sections.length && this.navLinks.length) {
      this.init();
    }
  }

  init() {
    window.addEventListener('scroll', throttle(() => this.update(), CONFIG.throttleDelay), { passive: true });
    this.update();
  }

  update() {
    let current = '';
    const headerHeight = $('#header')?.offsetHeight || 0;
    
    this.sections.forEach(section => {
      const sectionTop = section.offsetTop - headerHeight - 100;
      const sectionBottom = sectionTop + section.offsetHeight;
      
      if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
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
// CARD HOVER EFFECTS (3D Transform)
// ============================================

class CardHoverEffects {
  constructor() {
    this.cards = $$('.skill-card, .project-card, .quote-card, .stat-card');
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
    card.style.transition = 'transform 0.1s cubic-bezier(0.28, 0.11, 0.32, 1)';
  }

  onLeave(card) {
    card.style.transform = '';
    card.style.transition = 'transform 0.35s cubic-bezier(0.28, 0.11, 0.32, 1)';
  }

  onMove(card, e) {
    if (window.innerWidth < 1024) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 30;
    const rotateY = (centerX - x) / 30;
    
    card.style.transform = `
      perspective(1000px)
      translateY(-4px)
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg)
      scale3d(1.02, 1.02, 1.02)
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
          
          const headerHeight = $('#header')?.offsetHeight || 0;
          const targetPosition = target.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL
          history.replaceState(null, null, href);
        }
      });
    });
  }
}

// ============================================
// LOGO CLICK SCROLL TO TOP
// ============================================

function initLogoScroll() {
  const logo = $('.apple-logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      history.replaceState(null, null, ' ');
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
  
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.6s cubic-bezier(0.28, 0.11, 0.32, 1)';
    document.body.style.opacity = '1';
  });
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

function monitorPerformance() {
  if (!window.performance || !window.performance.timing) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`🚀 Portfolio Apple - Page loaded in: ${pageLoadTime}ms`);
      
      // Log paint metrics if available
      if (window.performance.getEntriesByType) {
        const paintMetrics = window.performance.getEntriesByType('paint');
        paintMetrics.forEach(metric => {
          console.log(`🎨 ${metric.name}: ${Math.round(metric.startTime)}ms`);
        });
      }
    }, 0);
  });
}

// ============================================
// ACCESSIBILITY IMPROVEMENTS
// ============================================

function improveAccessibility() {
  // Skip to main content link
  const skipLink = document.createElement('a');
  skipLink.href = '#profil';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Aller au contenu principal';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--accent);
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 100000;
  `;
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  document.body.insertBefore(skipLink, document.body.firstChild);

  // Add focus visible styles for keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  console.log('🍎 Portfolio v2025');
  
  // Initialize all modules
  new ThemeManager();
  new Navigation();
  new ScrollAnimations();
  new ActiveNavLink();
  new SmoothScroll();
  new CardHoverEffects();
  
  setCurrentYear();
  initEntranceAnimation();
  initLogoScroll();
  improveAccessibility();
  monitorPerformance();
  
  // Announce page ready for screen readers
  setTimeout(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'Page chargée';
    document.body.appendChild(announcement);
  }, 100);
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', (e) => {
  console.error('❌ Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled promise rejection:', e.reason);
});

// ============================================
// LAUNCH
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============================================
// EXPOSE FOR DEBUGGING
// ============================================

window.PortfolioDebug = {
  CONFIG,
  version: '2025',
  theme: () => document.body.getAttribute('data-theme')
};






