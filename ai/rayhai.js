/* ============================================================
   RayhAI v6 - Apple Premium Experience
   iOS/macOS Style Assistant with Advanced Features
   ============================================================ */

(function () {
  "use strict";

  // ========== UTILITIES ==========
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
  const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ========== CONFIGURATION ==========
  const CONFIG = {
    bubbleSize: 64,
    bubbleMargin: 24,
    snapMargin: 24,
    typingSpeed: 30,
    maxTypingSpeed: 15,
    suggestionDebounce: 2000,
    idleTimeout: 15000,
    maxMessageLength: 1000
  };

  // ========== STATE ==========
  const STATE = {
    isTyping: false,
    currentStream: null,
    lastUserMessage: null,
    sessionHistory: [],
    bubblePosition: null
  };

  // ========== MESSAGE RENDERING ==========

  async function appendAssistantMessage(text, streaming = true) {
    const body = $(".rayhai-body");
    if (!body) return;

    // Create message container
    const wrapper = document.createElement("div");
    wrapper.className = "rayhai-msg assistant";
    
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    
    const time = document.createElement("div");
    time.className = "msg-time";
    time.textContent = nowTime();

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    body.appendChild(wrapper);

    // Streaming effect with Apple-style smoothness
    if (streaming && text.length > 30) {
      STATE.isTyping = true;
      let displayed = "";
      const words = text.split(" ");
      const speed = clamp(CONFIG.typingSpeed - (text.length / 100), CONFIG.maxTypingSpeed, CONFIG.typingSpeed);

      for (let i = 0; i < words.length; i++) {
        if (!STATE.isTyping) break;
        displayed += (i > 0 ? " " : "") + words[i];
        bubble.textContent = displayed;
        body.scrollTop = body.scrollHeight;
        await sleep(speed);
      }
      bubble.textContent = text;
      STATE.isTyping = false;
    } else {
      bubble.textContent = text;
    }

    // Smooth scroll to bottom
    body.scrollTo({
      top: body.scrollHeight,
      behavior: 'smooth'
    });
    
    return wrapper;
  }

  function appendUserMessage(text) {
    const body = $(".rayhai-body");
    if (!body) return;

    const wrapper = document.createElement("div");
    wrapper.className = "rayhai-msg user";
    
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;
    
    const time = document.createElement("div");
    time.className = "msg-time";
    time.textContent = nowTime();

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
    body.appendChild(wrapper);
    
    body.scrollTo({
      top: body.scrollHeight,
      behavior: 'smooth'
    });

    STATE.sessionHistory.push({ role: "user", text, time: Date.now() });
    return wrapper;
  }

  function showTypingIndicator() {
    const body = $(".rayhai-body");
    if (!body || $(".rayhai-typing", body)) return;

    const typing = document.createElement("div");
    typing.className = "rayhai-typing";
    typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    return typing;
  }

  function hideTypingIndicator() {
    const typing = $(".rayhai-typing");
    if (typing) typing.remove();
  }

  // ========== UI INJECTION ==========

  function ensureUI() {
    if ($("#rayhai-root")) return $("#rayhai-root");

    const root = document.createElement("div");
    root.id = "rayhai-root";
    root.innerHTML = `
      <div class="rayhai-bubble" role="button" tabindex="0" aria-label="Ouvrir RayhAI">
        <div class="bubble-orb"></div>
        <span class="rayhai-bubble-icon">✨</span>
      </div>

      <div class="rayhai-panel" role="dialog" aria-label="RayhAI Assistant" aria-hidden="true">
        <div class="rayhai-header">
          <div>
            <div class="rayhai-title">RayhAI</div>
            <div class="rayhai-sub">Assistant Personnel</div>
          </div>
          <button class="rayhai-close" aria-label="Fermer">✕</button>
        </div>

        <div class="rayhai-suggestions"></div>

        <div class="rayhai-body" role="log" aria-live="polite" aria-atomic="false"></div>

        <div class="rayhai-footer">
          <textarea 
            class="rayhai-input" 
            placeholder="Écris un message..." 
            rows="1"
            maxlength="${CONFIG.maxMessageLength}"
            aria-label="Zone de saisie"></textarea>
          <button class="rayhai-action-send" aria-label="Envoyer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="rayhai-powered">Propulsé par RayhAI Engine v6</div>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  // ========== PANEL INITIALIZATION ==========

  function initPanel(root) {
    const panel = $(".rayhai-panel", root);
    const body = $(".rayhai-body", root);
    const input = $(".rayhai-input", root);
    const sendBtn = $(".rayhai-action-send", root);
    const closeBtn = $(".rayhai-close", root);
    const suggestionsBar = $(".rayhai-suggestions", root);

    if (!panel) return {};

    // Welcome message (session only)
    if (!sessionStorage.getItem("RAYHAI_WELCOMED")) {
      setTimeout(() => {
        const hour = new Date().getHours();
        let greeting = "Salut !";
        if (hour < 12) greeting = "Bonjour !";
        else if (hour >= 18) greeting = "Bonsoir !";
        
        appendAssistantMessage(`${greeting} Je suis Rayhan. Pose-moi des questions sur mon parcours, mes compétences, mes projets... ou demande-moi de l'aide ! 😊`, false);
      }, 800);
      sessionStorage.setItem("RAYHAI_WELCOMED", "1");
    }

// Panel API
window.RayhaiPanel = {
  open: () => {
    panel.classList.add("open");
    panel.removeAttribute("inert");   // ← ouverture propre
    input?.focus();
    
    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  close: () => {
    panel.classList.remove("open");
    panel.setAttribute("inert", "");  // ← évite l’erreur ARIA
  },
  isOpen: () => panel.classList.contains("open"),
  clear: () => {
    body.innerHTML = "";
    STATE.sessionHistory = [];
    sessionStorage.removeItem("RAYHAI_WELCOMED");
  }
};

// Event listeners
closeBtn?.addEventListener("click", () => {
  window.RayhaiPanel.close();
  if (navigator.vibrate) navigator.vibrate(10);
});

// Close on outside click (with delay to prevent immediate close)
setTimeout(() => {
  document.addEventListener("click", (e) => {
    if (window.RayhaiPanel.isOpen() && 
        !root.contains(e.target)) {
      window.RayhaiPanel.close();
    }
  });
}, 100);

// Close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && window.RayhaiPanel.isOpen()) {
    window.RayhaiPanel.close();
  }
});

return { panel, body, input, sendBtn, suggestionsBar };

  }

  // ========== BUBBLE WITH SMART POSITIONING ==========

  function initBubble(root) {
    const bubble = $(".rayhai-bubble", root);
    if (!bubble) return null;

    // Get stored position or default
    let pos = STATE.bubblePosition || {
      left: window.innerWidth - CONFIG.bubbleSize - CONFIG.bubbleMargin,
      top: window.innerHeight - CONFIG.bubbleSize - CONFIG.bubbleMargin
    };

    // Try to restore from session
    try {
      const saved = sessionStorage.getItem("RAYHAI_BUBBLE_POS");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.left !== undefined && p.top !== undefined) pos = p;
      }
    } catch (e) {
      console.warn("Could not restore bubble position:", e);
    }

    function setPos(left, top) {
      const maxX = window.innerWidth - CONFIG.bubbleSize - 10;
      const maxY = window.innerHeight - CONFIG.bubbleSize - 10;
      pos.left = clamp(left, 10, maxX);
      pos.top = clamp(top, 10, maxY);
      
      bubble.style.position = "fixed";
      bubble.style.left = pos.left + "px";
      bubble.style.top = pos.top + "px";
      bubble.style.right = "auto";
      bubble.style.bottom = "auto";

      STATE.bubblePosition = pos;

      try {
        sessionStorage.setItem("RAYHAI_BUBBLE_POS", JSON.stringify(pos));
      } catch (e) {
        console.warn("Could not save bubble position:", e);
      }
    }

    setPos(pos.left, pos.top);

    // Drag behavior with smooth Apple-style interaction
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

    function onDragStart(cx, cy) {
      dragging = true;
      bubble.classList.add("dragging");
      startX = cx;
      startY = cy;
      startLeft = pos.left;
      startTop = pos.top;
      bubble.style.transition = "none";
      
      if (navigator.vibrate) navigator.vibrate(10);
    }

    function onDragMove(cx, cy) {
      if (!dragging) return;
      const dx = cx - startX;
      const dy = cy - startY;
      setPos(startLeft + dx, startTop + dy);
    }

    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      bubble.classList.remove("dragging");
      bubble.style.transition = "";
      snapToEdge();
      
      if (navigator.vibrate) navigator.vibrate(15);
    }

    function snapToEdge() {
      const centerX = pos.left + CONFIG.bubbleSize / 2;
      const toLeft = centerX < window.innerWidth / 2;
      const targetX = toLeft 
        ? CONFIG.snapMargin 
        : (window.innerWidth - CONFIG.bubbleSize - CONFIG.snapMargin);
      
      // Smooth snap animation
      bubble.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      setPos(targetX, pos.top);
    }

    // Mouse events
    bubble.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      onDragStart(e.clientX, e.clientY);
    });

    document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
    document.addEventListener("mouseup", onDragEnd);

    // Touch events
    bubble.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      if (!t) return;
      onDragStart(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (!t) return;
      onDragMove(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener("touchend", onDragEnd);

    // Click to toggle (only if not dragging)
    let clickStartTime = 0;
    bubble.addEventListener("mousedown", () => { clickStartTime = Date.now(); });
    bubble.addEventListener("touchstart", () => { clickStartTime = Date.now(); });
    
    bubble.addEventListener("click", (e) => {
      const clickDuration = Date.now() - clickStartTime;
      if (clickDuration < 200) { // Fast click = toggle
        e.preventDefault();
        if (window.RayhaiPanel.isOpen()) {
          window.RayhaiPanel.close();
        } else {
          window.RayhaiPanel.open();
        }
      }
    });

    // Keyboard accessibility
    bubble.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (window.RayhaiPanel.isOpen()) {
          window.RayhaiPanel.close();
        } else {
          window.RayhaiPanel.open();
        }
      }
    });

    // Window resize
    window.addEventListener("resize", () => {
      setPos(pos.left, pos.top);
      snapToEdge();
    });

    // Public API
    window.RayhaiBubble = {
      setPos,
      getPos: () => ({ ...pos }),
      snap: snapToEdge,
      hide: () => { bubble.style.display = "none"; },
      show: () => { bubble.style.display = "flex"; }
    };

    return window.RayhaiBubble;
  }

  // ========== MESSAGING LOGIC ==========

  function initMessaging(refs) {
    const { input, sendBtn } = refs;
    if (!input || !sendBtn) return;

    async function sendMessage() {
      const text = input.value.trim();
      if (!text || STATE.isTyping) return;

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);

      // Clear input
      input.value = "";
      input.style.height = "auto";

      // Append user message
      appendUserMessage(text);
      STATE.lastUserMessage = text;

      // Show typing indicator
      showTypingIndicator();

      // Get response from engine
      let reply = "";
      try {
        if (window.RayhaiEngine && typeof window.RayhaiEngine.ask === "function") {
          reply = await window.RayhaiEngine.ask(text);
        } else {
          reply = "Je suis en train de me réveiller... Réessaye dans un instant. ⚡";
        }
      } catch (err) {
        console.error("RayhAI error:", err);
        reply = "Oups, j'ai eu un petit bug. Peux-tu réessayer ? 😅";
      }

      // Hide typing and show response
      hideTypingIndicator();
      await appendAssistantMessage(reply || "Hmm, je n'ai pas de réponse pour le moment.");
      
      STATE.sessionHistory.push({ role: "assistant", text: reply, time: Date.now() });

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    }

    // Send on Enter (Shift+Enter for new line)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(120, input.scrollHeight) + "px";
    });

    // Send button
    sendBtn.addEventListener("click", sendMessage);
  }

  // ========== SMART SUGGESTIONS ==========

  function initSuggestions(refs) {
    const { suggestionsBar } = refs;
    if (!suggestionsBar) return;

    let debounceTimer = null;

    async function generateSuggestions() {
      // Context-aware suggestions based on YOUR portfolio content
      const suggestions = [
        "Qui es-tu ?",
        "Tes projets ?",
        "Tes compétences ?",
        "Comment te contacter ?"
      ];

      renderSuggestions(suggestions);
    }

    function renderSuggestions(items) {
      if (!items || items.length === 0) {
        suggestionsBar.style.display = "none";
        return;
      }

      suggestionsBar.innerHTML = "";
      items.slice(0, 4).forEach(text => {
        const chip = document.createElement("button");
        chip.className = "suggestion-chip";
        chip.textContent = text;
        chip.addEventListener("click", async () => {
          window.RayhaiPanel.open();
          appendUserMessage(text);
          showTypingIndicator();
          
          try {
            const reply = window.RayhaiEngine 
              ? await window.RayhaiEngine.ask(text)
              : "Désolé, je ne suis pas encore connecté à mon moteur.";
            hideTypingIndicator();
            await appendAssistantMessage(reply);
          } catch (e) {
            hideTypingIndicator();
            appendAssistantMessage("Erreur lors de la réponse. Réessaye plus tard.");
          }
        });
        suggestionsBar.appendChild(chip);
      });

      suggestionsBar.style.display = "flex";
    }

    // Generate on load (debounced)
    debounceTimer = setTimeout(generateSuggestions, CONFIG.suggestionDebounce);

    window.RayhaiSuggest = {
      refresh: generateSuggestions,
      clear: () => {
        suggestionsBar.innerHTML = "";
        suggestionsBar.style.display = "none";
      }
    };
  }

  // ========== IDLE DETECTION ==========

  function initIdleWatcher() {
    let lastActivity = Date.now();
    let idleShown = false;

    function markActivity() {
      lastActivity = Date.now();
      idleShown = false;
    }

    ["mousemove", "keydown", "touchstart", "scroll"].forEach(evt => {
      document.addEventListener(evt, markActivity, { passive: true });
    });

    setInterval(() => {
      const idle = Date.now() - lastActivity > CONFIG.idleTimeout;
      if (idle && !idleShown && !window.RayhaiPanel?.isOpen()) {
        // Optional: Show subtle idle hint
        idleShown = true;
      }
    }, 5000);
  }

  // ========== BOOT ==========

  function boot() {
    try {
      const root = ensureUI();
      if (!root) {
        console.error("❌ Could not create RayhAI root");
        return;
      }

      const refs = initPanel(root);
      initBubble(root);
      initMessaging(refs);
      initSuggestions(refs);
      initIdleWatcher();

      console.log("✨ RayhAI v6");
      document.dispatchEvent(new Event("RayhAI_READY"));
    } catch (e) {
      console.error("❌ RayhAI boot error:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();