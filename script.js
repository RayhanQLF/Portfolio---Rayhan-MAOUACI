
/* =========================================
   ANNÉE DYNAMIQUE
========================================= */
document.getElementById("year").textContent = new Date().getFullYear();


/* =========================================
   THEME CLAIR / SOMBRE
========================================= */
const body = document.body;
const toggleBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  body.setAttribute("data-theme", theme);
  toggleBtn.textContent = theme === "dark" ? "🌙 Mode sombre" : "☀️ Mode clair";
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

toggleBtn.addEventListener("click", () => {
  const current = body.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});


/* =========================================
   ANIMATION AU SCROLL
========================================= */
const revealElements = document.querySelectorAll('.reveal');

function handleScroll() {
  const triggerBottom = window.innerHeight * 0.85;
  revealElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < triggerBottom) {
      el.classList.add('visible');
    }
  });
}

window.addEventListener('scroll', handleScroll);
window.addEventListener('load', handleScroll);


/* =========================================
   FOND ANIMÉ – POINTS CONNECTÉS (CANVAS)
========================================= */

// Canvas
const canvas = document.getElementById("bg-particles");
const ctx = canvas.getContext("2d");

let particles = [];
const numParticles = 80;     
const connectDistance = 150;

// Ajuste la taille aux dimensions de la fenêtre
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();


// Classe Particule
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.7;
    this.vy = (Math.random() - 0.5) * 0.7;
    this.radius = 2;
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;

    // Rebonds
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(56,189,248,0.9)"; // Cyan
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(56,189,248,1)";
    ctx.fill();
  }
}


// Initialisation
function initParticles() {
  particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}
initParticles();


// Animation principale
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Lignes entre particules proches
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < connectDistance) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(56,189,248, ${1 - dist / connectDistance})`;
        ctx.lineWidth = 1;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  // Mouvements + dessin
  particles.forEach(p => {
    p.move();
    p.draw();
  });

  requestAnimationFrame(animate);
}

document.querySelectorAll('header nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("header nav a");

function updateActiveLink() {
  let current = "";

  sections.forEach(section => {
    const top = section.offsetTop - 150;
    const height = section.offsetHeight;

    if (scrollY >= top && scrollY < top + height) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
}



/* ============================================
   EFFET RIPPLE NEON — VERSION ULTRA FIABLE
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".category-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", function (e) {

            // Supprimer les anciens ripple
            const oldRipple = this.querySelector(".ripple");
            if (oldRipple) oldRipple.remove();

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement("span");
            ripple.classList.add("ripple");
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            this.appendChild(ripple);

            // Animation auto-clean
            ripple.addEventListener("animationend", () => {
                ripple.remove();
            });
        });
    });
});


/* =========================================
   HEADER – SHRINK ON SCROLL
========================================= */

const header = document.querySelector("header");

function handleHeaderShrink() {
  if (window.scrollY > 60) {
    header.classList.add("shrink");
  } else {
    header.classList.remove("shrink");
  }
}

window.addEventListener("scroll", handleHeaderShrink);
window.addEventListener("load", handleHeaderShrink);

animate();

// ===================================
// RAYHAI — IA 100% COMPATIBLE GITHUB
// ===================================

const bubble = document.getElementById("rayhai-bubble");
const panel = document.getElementById("rayhai-panel");
const closeBtn = document.getElementById("rayhai-close");
const messages = document.getElementById("rayhai-messages");
const input = document.getElementById("rayhai-input");
const send = document.getElementById("rayhai-send");

let openedOnce = false;

// BUBBLE CLICK
bubble.onclick = () => {
    panel.classList.toggle("open");
    if (!openedOnce) {
        setTimeout(() => {
            rayhaiAnswer("Bonjour, je suis RayhAI. Pose-moi une question.");
        }, 300);
        openedOnce = true;
    }
};

// CLOSE BTN
closeBtn.onclick = () => panel.classList.remove("open");

send.onclick = handleUserMessage;
input.addEventListener("keypress", e => e.key === "Enter" && handleUserMessage());

// SEND USER MESSAGE
function handleUserMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    setTimeout(() => processAI(text.toLowerCase()), 300);
}

// ADD MESSAGE
function addMessage(t, sender) {
    const div = document.createElement("div");
    div.className = "msg " + sender;
    div.innerText = t;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// TYPING EFFECT
function rayhaiAnswer(text) {
    const typing = document.createElement("div");
    typing.className = "msg";
    typing.innerHTML = "<span class='typing-dots'><span>.</span><span>.</span><span>.</span></span>";
    messages.appendChild(typing);

    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        typing.innerHTML = text;
    }, 600);
}

// IA LOCALE
function processAI(q) {
    // Basique
    if (q.includes("salut") || q.includes("bonjour"))
        return rayhaiAnswer("Salut ! Que veux-tu savoir ?");

    if (q.includes("ça va") || q.includes("va bien"))
        return rayhaiAnswer("Je vais très bien. Prêt à t’aider.");

    // Infos personnelles
    if (q.includes("âge") || q.includes("age") || q.includes("ans"))
        return rayhaiAnswer("Rayhan a 18 ans.");

    if (q.includes("ville") || q.includes("toulon"))
        return rayhaiAnswer("Rayhan habite à Toulon.");

    if (q.includes("étude") || q.includes("ciel") || q.includes("bac"))
        return rayhaiAnswer("Il est en Bac Pro CIEL, Terminale.");

    if (q.includes("intérêt") || q.includes("passion"))
        return rayhaiAnswer("Ses centres d’intérêt : informatique, cybersécurité, réseau, musculation.");

    if (q.includes("jeu") || q.includes("valorant"))
        return rayhaiAnswer("Son jeu préféré est Valorant.");

    if (q.includes("niveau") || q.includes("skill"))
        return rayhaiAnswer("Rayhan possède un très bon niveau sur ses jeux, notamment Valorant.");

    // Fallback
    return rayhaiAnswer("Je peux répondre uniquement à des questions concernant Rayhan.");
}
