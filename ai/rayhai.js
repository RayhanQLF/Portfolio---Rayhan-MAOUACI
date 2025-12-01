/* ============================================================
   RayhAI PRO — JS complet
   Panel auto-clamp (ne sort JAMAIS de l’écran)
   Bubble toggle
   Historique
   Typing indicator
============================================================ */

(function () {
  "use strict";

  function $(s, r=document){ return (r||document).querySelector(s); }

  function init() {
    let root = $("#rayhai-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "rayhai-root";
      document.body.appendChild(root);
    }

    // Construct UI if missing
    root.innerHTML = `
      <div class="rayhai-bubble" role="button">💬</div>

      <div class="rayhai-panel" aria-hidden="true">
        <div class="rayhai-header">
          <div class="rayhai-title">RayhAI</div>
          <div class="rayhai-sub">Assistant Personnel</div>
        </div>
        <div class="rayhai-body"></div>
        <div class="rayhai-footer">
          <textarea placeholder="Écris un message…"></textarea>
          <button class="rayhai-action-send">➤</button>
        </div>
      </div>
    `;

    const bubble = root.querySelector(".rayhai-bubble");
    const panel = root.querySelector(".rayhai-panel");
    const body = root.querySelector(".rayhai-body");
    const textarea = root.querySelector("textarea");
    const sendBtn = root.querySelector(".rayhai-action-send");

    /* ------------------------------
       Clamp panel inside viewport
    ------------------------------ */
    function clampPanel() {
      const rect = panel.getBoundingClientRect();

      // Too right -> move left
      if (rect.right > window.innerWidth - 10) {
        panel.style.left = "0px";
      }

      // Too bottom -> raise
      if (rect.bottom > window.innerHeight - 10) {
        panel.style.bottom = "20px";
      }

      // Too top -> shrink
      if (rect.top < 10) {
        panel.style.height = "70vh";
      }
    }

    /* ------------------------------
       Open / Close / Toggle
    ------------------------------ */
    function openPanel() {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden","false");

      setTimeout(() => {
        textarea.focus();
        clampPanel();
      }, 150);
    }

    function closePanel() {
      try {
        if (document.activeElement.blur) document.activeElement.blur();
      } catch(e){}
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden","true");
    }

    function toggle() {
      if (panel.classList.contains("open")) closePanel();
      else openPanel();
    }

    bubble.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target) && panel.classList.contains("open")) {
        closePanel();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanel();
    });

    /* ------------------------------
       Messages + History
    ------------------------------ */
    const HISTORY_KEY = "RAYHAI_HISTORY_V1";

    function loadHistory() {
      try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
      } catch(e) { return []; }
    }

    function saveHistory(h) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-50)));
    }

    let history = loadHistory();

    function appendBubble(text, role="assistant", save=true) {
      const wrap = document.createElement("div");
      wrap.className = "rayhai-msg " + (role === "user" ? "user" : "assistant");

      const b = document.createElement("div");
      b.className = "bubble";
      b.textContent = text;
      wrap.appendChild(b);

      const ts = document.createElement("div");
      ts.className = "rayhai-ts";
      ts.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      wrap.appendChild(ts);

      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;

      if (save) {
        history.push({role, text});
        saveHistory(history);
      }
    }

    function renderHistory() {
      body.innerHTML = "";
      history.forEach(m => appendBubble(m.text, m.role, false));
    }

    /* Typing indicator */
    function showTyping(state) {
      const ex = body.querySelector(".rayhai-typing");
      if (state) {
        if (!ex) {
          const t = document.createElement("div");
          t.className = "rayhai-typing";
          t.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
          body.appendChild(t);
          body.scrollTop = body.scrollHeight;
        }
      } else if (ex) {
        ex.remove();
      }
    }

    /* ------------------------------
       Send flow
    ------------------------------ */
    async function send() {
      const txt = textarea.value.trim();
      if (!txt) return;

      appendBubble(txt, "user", true);
      textarea.value = "";
      showTyping(true);

      try {
        const reply = await window.RayhaiEngine.ask(txt);
        showTyping(false);
        appendBubble(reply || "Je n'ai pas de réponse définie.", "assistant");
      } catch(e) {
        showTyping(false);
        appendBubble("Erreur interne.", "assistant");
      }
    }

    sendBtn.addEventListener("click", send);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    /* ------------------------------
       Load history + welcome
    ------------------------------ */
    renderHistory();

    if (!sessionStorage.getItem("RH_WELCOME")) {
      appendBubble("Salut, je suis RayhAI. Comment puis-je t’aider ?", "assistant");
      sessionStorage.setItem("RH_WELCOME","1");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else init();

})();
