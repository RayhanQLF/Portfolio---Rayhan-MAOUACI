/* ============================================================
   rayhai.js — RayhAI (production-ready)
   - Mode A — Interaction modérée par défaut
   - Features: UI injection, bubble (drag/snap), panel, messaging,
               page analysis & suggestions, selection popup,
               section observer (scroll), idle watcher, local fallback engine.
   - Exposes: window.RayhaiPanel, window.RayhaiBubble, window.RayhaiSuggest, window.RayhaiPro
   Replace your existing rayhai.js with this file.
============================================================ */

(function () {
  "use strict";

  /* ========================
     Utilities
     ======================== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));
  const nowTime = () => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};



  /* ========================
     Configuration
     ======================== */
  const CONFIG = {
    bubbleSize: 58,
    bubbleMargin: 12,
    snapMargin: 12,
    suggestionLimit: 5,
    scanMaxChars: 2000,
    proactiveIntervalMs: 60_000,
    proactiveDelayMs: 900,
    idleTimeoutMs: 8000,
    friendlyMode: true,
    localStorageKeys: {
      bubblePos: "RAYHAI_BUBBLE_POS_V1",
      history: "RAYHAI_HISTORY_V1"
    }
  };

  /* ========================
     Global message helpers (accessible everywhere)
     ======================== */
  function appendAssistantMessage(text) {
    const body = document.querySelector(".rayhai-body");
    if (!body) return;
    const w = document.createElement("div");
    w.className = "rayhai-msg assistant";
    const b = document.createElement("div");
    b.className = "msg-bubble";
    b.textContent = text;
    const ts = document.createElement("div");
    ts.className = "msg-time";
    ts.textContent = nowTime();
    w.appendChild(b);
    w.appendChild(ts);
    body.appendChild(w);
    body.scrollTop = body.scrollHeight;
  }

  function appendUserMessage(text) {
    const body = document.querySelector(".rayhai-body");
    if (!body) return;
    const w = document.createElement("div");
    w.className = "rayhai-msg user";
    const b = document.createElement("div");
    b.className = "msg-bubble";
    b.textContent = text;
    const ts = document.createElement("div");
    ts.className = "msg-time";
    ts.textContent = nowTime();
    w.appendChild(b);
    w.appendChild(ts);
    body.appendChild(w);
    body.scrollTop = body.scrollHeight;
  }

  /* ========================
     Ensure UI (inject root if missing)
     ======================== */
  function ensureUI() {
    let root = document.getElementById("rayhai-root");
    if (root) return root;

    // Create structure (keeps markup predictable)
    root = document.createElement("div");
    root.id = "rayhai-root";
    root.innerHTML = `
      <div class="rayhai-bubble" id="rayhai-bubble" role="button" aria-label="Ouvrir RayhAI">
        <span class="rayhai-bubble-icon">💬</span>
      </div>

      <div class="rayhai-panel" id="rayhai-panel" aria-hidden="true" role="dialog" aria-label="RayhAI Assistant">
        <div class="rayhai-header">
          <div>
            <div class="rayhai-title">RayhAI</div>
            <div class="rayhai-sub">Assistant</div>
          </div>
          <div class="rayhai-controls">
            <button class="rayhai-close" aria-label="Fermer">✕</button>
          </div>
        </div>

        <div class="rayhai-suggestions" style="display:none;"></div>

        <div class="rayhai-body" role="log" aria-live="polite"></div>

        <div class="rayhai-footer">
          <textarea id="rayhai-input" class="rayhai-input" placeholder="Écrire un message..." rows="1" aria-label="Écris un message"></textarea>
          <button id="rayhai-send" class="rayhai-send" aria-label="Envoyer">➤</button>
        </div>

        <div class="rayhai-powered">Propulsé par RayhAI</div>
      </div>
    `;
    document.body.appendChild(root);

    return root;
  }

  /* ========================
     Panel initialization
     ======================== */
  function initPanel(root) {
    const bubble = $(".rayhai-bubble", root);
    const panel = $(".rayhai-panel", root);
    const body = $(".rayhai-body", root);
    const textarea = $("#rayhai-input", root);
    const sendBtn = $("#rayhai-send", root);
    const closeBtn = $(".rayhai-close", root);
    const suggestionsBar = $(".rayhai-suggestions", root);

    // minimal guard
    if (!panel || !body) {
      return { panel: null };
    }

    // History load/save
    const HISTORY_KEY = CONFIG.localStorageKeys.history;
    function loadHistory() {
      try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      } catch (e) {
        return [];
      }
    }
    function saveHistory(h) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-80)));
      } catch (e) {}
    }
    let history = loadHistory();

    function renderHistory() {
      body.innerHTML = "";
      history.forEach(entry => {
        const w = document.createElement("div");
        w.className = "rayhai-msg " + (entry.role === "user" ? "user" : "assistant");
        const b = document.createElement("div");
        b.className = "msg-bubble";
        b.textContent = entry.text;
        const ts = document.createElement("div");
        ts.className = "msg-time";
        ts.textContent = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        w.appendChild(b);
        w.appendChild(ts);
        body.appendChild(w);
      });
      body.scrollTop = body.scrollHeight;
    }

    // expose API
    window.RayhaiPanel = {
      open: () => {
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        const ta = $("#rayhai-input", panel);
        if (ta) ta.focus();
      },
      close: () => {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
      },
      panel,
      body,
      textarea,
      sendBtn,
      suggestionsBar,
      appendUserMessage: (t) => { history.push({ role: "user", text: t, ts: Date.now() }); saveHistory(history); appendUserMessage(t); },
      appendAssistantMessage: (t) => { history.push({ role: "assistant", text: t, ts: Date.now() }); saveHistory(history); appendAssistantMessage(t); }
    };

    // close behavior
    if (closeBtn) closeBtn.addEventListener("click", () => window.RayhaiPanel.close());
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target) && panel.classList.contains("open")) {
        window.RayhaiPanel.close();
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.RayhaiPanel.close(); });

    // initial greeting (only once per session)
    if (!sessionStorage.getItem("RAYHAI_WELCOMED")) {
      appendAssistantMessage("Salut — je suis RayhAI. Besoin d'un coup de main ?");
      sessionStorage.setItem("RAYHAI_WELCOMED", "1");
    }

    // render saved conversation
    renderHistory();

    return { panel, body, textarea, sendBtn, suggestionsBar };
  }

  /* ========================
     Bubble (drag, snap, avoid conflicts)
     ======================== */
  function initBubble(root) {
    const bubble = $(".rayhai-bubble", root);
    if (!bubble) return null;

    const KEY = CONFIG.localStorageKeys.bubblePos;

    function savePos(x, y) { try { localStorage.setItem(KEY, JSON.stringify({ x, y })); } catch (e) {} }
    function loadPos() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }

    function setPos(left, top) {
      bubble.style.position = "fixed";
      bubble.style.left = left + "px";
      bubble.style.top = top + "px";
      bubble.style.right = "auto";
      bubble.style.bottom = "auto";
    }

    function clampWithin(left, top) {
      const maxX = window.innerWidth - bubble.offsetWidth - 10;
      const maxY = window.innerHeight - bubble.offsetHeight - 10;
      return { left: clamp(left, 10, maxX), top: clamp(top, 10, maxY) };
    }

    (function initPos() {
      const saved = loadPos();
      if (saved && typeof saved.x === "number") {
        setPos(saved.x, saved.y);
      } else {
        bubble.style.right = CONFIG.snapMargin + "px";
        bubble.style.bottom = CONFIG.snapMargin + "px";
        const rect = bubble.getBoundingClientRect();
        setPos(rect.left, rect.top);
      }
    })();

    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    function pointerStart(cx, cy) {
      dragging = true;
      bubble.classList.add("dragging");
      const rect = bubble.getBoundingClientRect();
      startX = cx; startY = cy;
      startLeft = parseFloat(bubble.style.left) || rect.left;
      startTop = parseFloat(bubble.style.top) || rect.top;
      bubble.style.transition = "none";
    }
    function pointerMove(cx, cy) {
      if (!dragging) return;
      const nx = startLeft + (cx - startX);
      const ny = startTop + (cy - startY);
      const p = clampWithin(nx, ny);
      setPos(p.left, p.top);
    }
    function pointerEnd() {
      if (!dragging) return;
      dragging = false;
      bubble.classList.remove("dragging");
      bubble.style.transition = "";
      snapToEdge();
      setTimeout(checkConflictsAndResolve, 180);
    }

    function snapToEdge() {
      const rect = bubble.getBoundingClientRect();
      const vw = window.innerWidth;
      const centerX = rect.left + rect.width / 2;
      const toLeft = centerX < vw / 2;
      const targetX = toLeft ? CONFIG.snapMargin : (vw - rect.width - CONFIG.snapMargin);
      const pos = clampWithin(targetX, rect.top);
      setPos(pos.left, pos.top);
      savePos(pos.left, pos.top);
    }

    bubble.addEventListener("mousedown", (e) => { if (e.button !== 0) return; e.preventDefault(); pointerStart(e.clientX, e.clientY); });
    document.addEventListener("mousemove", (e) => pointerMove(e.clientX, e.clientY));
    document.addEventListener("mouseup", pointerEnd);

    bubble.addEventListener("touchstart", (ev) => { const t = ev.touches[0]; if (!t) return; pointerStart(t.clientX, t.clientY); }, { passive: false });
    document.addEventListener("touchmove", (ev) => { const t = ev.touches[0]; if (!t) return; pointerMove(t.clientX, t.clientY); }, { passive: false });
    document.addEventListener("touchend", pointerEnd);

    function isOverlapping(el) {
      if (!el) return false;
      const a = bubble.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }
    function avoidElement(el) {
      if (!el) return;
      const rect = bubble.getBoundingClientRect();
      const vw = window.innerWidth;
      const targetX = (rect.left + rect.width / 2) < vw / 2 ? (vw - rect.width - CONFIG.snapMargin) : CONFIG.snapMargin;
      const pos = clampWithin(targetX, rect.top);
      setPos(pos.left, pos.top);
      savePos(pos.left, pos.top);
    }

    function checkConflictsAndResolve() {
      const githubBtn = document.querySelector(".mobile-footer .footer-btn, .mobile-footer a, .mobile-footer .btn-icon");
      if (githubBtn && isOverlapping(githubBtn)) avoidElement(githubBtn);
      const mobileOpen = !!document.querySelector(".mobile-menu.open, .mobile-menu[aria-hidden='false']");
      if (mobileOpen) {
        const rect = bubble.getBoundingClientRect();
        const vw = window.innerWidth;
        if (rect.left + rect.width / 2 > vw / 2) {
          const pos = clampWithin(CONFIG.snapMargin, rect.top);
          setPos(pos.left, pos.top);
          savePos(pos.left, pos.top);
        }
      }
    }

    const mm = document.querySelector(".mobile-menu");
    if (mm) {
      new MutationObserver(() => {
        const mobileOpen = !!document.querySelector(".mobile-menu.open, .mobile-menu[aria-hidden='false']");
        if (mobileOpen) bubble.classList.add("smart-hidden"); else bubble.classList.remove("smart-hidden");
      }).observe(mm, { attributes: true, attributeFilter: ["class", "aria-hidden"] });
    }

    window.addEventListener("resize", () => {
      const rect = bubble.getBoundingClientRect();
      const pos = clampWithin(rect.left, rect.top);
      setPos(pos.left, pos.top);
      savePos(pos.left, pos.top);
      setTimeout(checkConflictsAndResolve, 120);
    });

    if (window.visualViewport) {
      let lastH = window.visualViewport.height;
      window.visualViewport.addEventListener("resize", () => {
        const vh = window.visualViewport.height;
        if (vh < lastH - 120) {
          const rect = bubble.getBoundingClientRect();
          const pos = clampWithin(rect.left, clamp(rect.top - 100, 10, window.innerHeight - bubble.offsetHeight - 10));
          setPos(pos.left, pos.top);
        }
        lastH = vh;
      });
    }

    setTimeout(checkConflictsAndResolve, 150);
    setTimeout(checkConflictsAndResolve, 900);

    const API = {
      snap: snapToEdge,
      pos: () => { const r = bubble.getBoundingClientRect(); return { left: r.left, top: r.top }; },
      hide: () => bubble.classList.add("smart-hidden"),
      show: () => bubble.classList.remove("smart-hidden"),
      checkConflicts: checkConflictsAndResolve
    };
    window.RayhaiBubble = API;
    // toggle panel from bubble
    bubble.addEventListener("click", (e) => {
      const panel = $("#rayhai-panel");
      if (!panel) return;
      if (panel.classList.contains("open")) {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
      } else {
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        const ta = $("#rayhai-input");
        if (ta) ta.focus();
      }
    });

    return API;
  }

  /* ========================
     Messaging (input + send)
     ======================== */
  function initMessaging(panel) {
    if (!panel) return;
    const input = document.getElementById("rayhai-input");
    const sendBtn = document.getElementById("rayhai-send");
    const body = panel.querySelector(".rayhai-body");

    if (!input || !sendBtn || !body) {
      // no noisy logs in production
      return;
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      appendUserMessage(text);
      input.value = "";
      input.style.height = "auto";
      appendAssistantMessage("…");
      let reply = "";
      try {
        if (window.RayhaiEngine && typeof window.RayhaiEngine.ask === "function") {
          reply = await window.RayhaiEngine.ask(text);
        } else {
          // local fallback simple
          await new Promise(r => setTimeout(r, 300));
          reply = "Mode local : " + text;
        }
      } catch (err) {
        reply = "Erreur lors de la requête.";
      }
      // remove placeholder
      const last = body.lastElementChild;
      if (last && last.classList.contains("assistant") && last.querySelector(".msg-bubble").textContent === "…") {
        last.remove();
      }
      appendAssistantMessage(reply || "Aucune réponse.");
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
      setTimeout(() => {
        input.style.height = "auto";
        input.style.height = Math.min(200, input.scrollHeight) + "px";
      }, 0);
    });

    sendBtn.addEventListener("click", sendMessage);
  }

  /* ========================
     Suggest module (page analysis, selection popup, proactive, idle)
     ======================== */
  function initSuggestModule(root, refs = {}) {
    // protective guard
    if (!refs || !refs.panel) {
      // return safe API
      window.RayhaiSuggest = {
        scanNow: () => {},
        enable: () => {},
        disable: () => {},
        setOffline: () => {},
        status: () => ({ enabled: false })
      };
      return {};
    }

    const panel = refs.panel;
    const body = refs.body || panel.querySelector(".rayhai-body");
    const suggestionsBar = refs.suggestionsBar || panel.querySelector(".rayhai-suggestions") || (function () {
      const s = document.createElement("div");
      s.className = "rayhai-suggestions";
      s.style.display = "none";
      panel.insertBefore(s, panel.querySelector(".rayhai-body"));
      return s;
    })();

    const state = {
      proactiveTimer: null,
      sectionObserver: null,
      selPopup: null
    };

    const cfg = {
      enabled: true,
      offline: true,
      suggestionLimit: CONFIG.suggestionLimit,
      scanMaxChars: CONFIG.scanMaxChars,
      proactiveDelayMs: CONFIG.proactiveDelayMs,
      proactiveIntervalMs: CONFIG.proactiveIntervalMs
    };

    async function askEngine(prompt) {
      function localResponder(q) {
        q = (q || "").toLowerCase();
        if (!q) return null;
        if (q.includes("propose") || q.includes("action")) {
          return "1. Améliorer le titre\n2. Ajouter un résumé\n3. Mettre CTA clair\n4. Mettre preuves projets\n";
        }
        if (q.includes("résume") || q.includes("résumer") || q.includes("résumé")) {
          return "Résumé (local) : phrase principale, points clés, CTA.";
        }
        if (q.length < 40) {
          return "Suggestion : clarifie ce point ou ajoute un exemple.";
        }
        return null;
      }

      if (cfg.offline || !window.RayhaiEngine || typeof window.RayhaiEngine.ask !== "function") {
        const r = localResponder(prompt);
        return r || ("Mode local : aucune réponse externe configurée.");
      }

      try {
        const res = await window.RayhaiEngine.ask(prompt);
        if (!res) return null;
        return typeof res === "string" ? res : (res.text || res.result || JSON.stringify(res));
      } catch (err) {
        return localResponder(prompt) || null;
      }
    }

    function extractContext() {
      const title = document.title || "";
      const h1 = (document.querySelector("h1") || {}).textContent || "";
      const meta = (document.querySelector('meta[name="description"]') || {}).content || "";
      const main = document.querySelector("main") || document.body;
      const text = main ? (main.innerText || main.textContent || "") : "";
      return {
        title: title.trim(),
        h1: h1.trim(),
        meta: meta.trim(),
        text: text.replace(/\s+/g, " ").trim().slice(0, cfg.scanMaxChars)
      };
    }

    function renderChips(lines) {
      suggestionsBar.innerHTML = "";
      if (!lines || lines.length === 0) {
        suggestionsBar.style.display = "none";
        return;
      }
      lines.slice(0, cfg.suggestionLimit).forEach(t => {
        const btn = document.createElement("button");
        btn.className = "suggestion-chip";
        btn.type = "button";
        btn.textContent = t.length > 80 ? t.slice(0, 77) + "…" : t;
        btn.addEventListener("click", () => {
          panel.classList.add("open");
          panel.setAttribute("aria-hidden", "false");
          appendUserMessage(t);
          appendAssistantMessage("…");
          askEngine(t).then(res => {
            // remove placeholder
            const last = document.querySelector(".rayhai-body").lastElementChild;
            if (last && last.querySelector && last.querySelector(".msg-bubble").textContent === "…") last.remove();
            appendAssistantMessage(res || "Aucune réponse.");
          }).catch(() => {
            appendAssistantMessage("Erreur.");
          });
        });
        suggestionsBar.appendChild(btn);
      });
      suggestionsBar.style.display = "flex";
    }

    async function scanAndSuggest() {
      if (!cfg.enabled) return;
      const ctx = extractContext();
      if (!ctx.text && !ctx.h1 && !ctx.title) return;
      const prompt = `Tu es RayhAI. À partir de ce contexte de page, propose 6 actions utiles, courtes (une par ligne):\n\nTitle: ${ctx.title}\nH1: ${ctx.h1}\nMeta: ${ctx.meta}\nContent start: ${ctx.text.slice(0,400)}`;
      const reply = await askEngine(prompt);
      if (!reply) return;
      const lines = reply.split(/\n+/).map(s => s.trim()).filter(Boolean);
      renderChips(lines.slice(0, CONFIG.suggestionLimit));
    }

    function startProactive() {
      if (state.proactiveTimer) clearInterval(state.proactiveTimer);
      scanAndSuggest();
      state.proactiveTimer = setInterval(() => {
        scanAndSuggest();
      }, cfg.proactiveIntervalMs);
    }
    function stopProactive() {
      if (state.proactiveTimer) { clearInterval(state.proactiveTimer); state.proactiveTimer = null; }
    }

    // Selection popup
    function ensureSelPopup() {
      if (state.selPopup) return state.selPopup;
      const p = document.createElement("div");
      p.className = "rayhai-select-popup";
      p.style.position = "fixed";
      p.style.zIndex = 9999999;
      p.style.padding = "6px 8px";
      p.style.borderRadius = "10px";
      p.style.background = "linear-gradient(180deg, rgba(20,28,44,0.96), rgba(10,12,20,0.96))";
      p.style.color = "#fff";
      p.style.display = "none";
      p.style.boxShadow = "0 6px 18px rgba(0,0,0,0.45)";
      p.innerHTML = `<button class="r-s-ask">Demander</button><button class="r-s-sum">Résumer</button><button class="r-s-ex">Expliquer</button>`;
      document.body.appendChild(p);

      p.querySelector(".r-s-ask").addEventListener("click", async () => {
        hideSelPopup();
        const t = getSelectionText(); if (!t) return;
        panel.classList.add("open"); panel.setAttribute("aria-hidden", "false");
        appendUserMessage(t);
        appendAssistantMessage("…");
        const res = await askEngine("Réponds :\n\n" + t);
        const last = document.querySelector(".rayhai-body").lastElementChild;
        if (last && last.querySelector && last.querySelector(".msg-bubble").textContent === "…") last.remove();
        appendAssistantMessage(res || "Aucune réponse.");
      });

      p.querySelector(".r-s-sum").addEventListener("click", async () => {
        hideSelPopup();
        const t = getSelectionText(); if (!t) return;
        panel.classList.add("open"); panel.setAttribute("aria-hidden", "false");
        appendUserMessage("Résumé demandé");
        appendAssistantMessage("…");
        const res = await askEngine("Résume :\n\n" + t);
        const last = document.querySelector(".rayhai-body").lastElementChild;
        if (last && last.querySelector && last.querySelector(".msg-bubble").textContent === "…") last.remove();
        appendAssistantMessage(res || "Aucune réponse.");
      });

      p.querySelector(".r-s-ex").addEventListener("click", async () => {
        hideSelPopup();
        const t = getSelectionText(); if (!t) return;
        panel.classList.add("open"); panel.setAttribute("aria-hidden", "false");
        appendUserMessage("Explication demandée");
        appendAssistantMessage("…");
        const res = await askEngine("Explique simplement :\n\n" + t);
        const last = document.querySelector(".rayhai-body").lastElementChild;
        if (last && last.querySelector && last.querySelector(".msg-bubble").textContent === "…") last.remove();
        appendAssistantMessage(res || "Aucune réponse.");
      });

      state.selPopup = p;
      return p;
    }

    function showSelPopupAtRect(rect) {
      const p = ensureSelPopup();
      p.style.left = clamp(rect.left + rect.width / 2 - 90, 8, window.innerWidth - 180) + "px";
      p.style.top = clamp(rect.top - 44, 8, window.innerHeight - 40) + "px";
      p.style.display = "flex";
      p.style.gap = "8px";
    }
    function hideSelPopup() { if (state.selPopup) state.selPopup.style.display = "none"; }
    function getSelectionText() {
      const s = window.getSelection(); if (!s || s.isCollapsed) return ""; return s.toString().trim();
    }
    function handleSelectionChange() {
      const txt = getSelectionText(); if (!txt) { hideSelPopup(); return; }
      try {
        const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
        if (!rect) { hideSelPopup(); return; }
        showSelPopupAtRect(rect);
      } catch (e) { hideSelPopup(); }
    }

    // Section observer (Interaction A) — expects panel & suggestionsBar params when invoked
    function startSectionObserver(panelArg, suggestionsBarArg) {
      const sections = Array.from(document.querySelectorAll("section, article, main > div, [data-section]"));
      if (!sections.length) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return;
          const sectionName = entry.target.id || entry.target.dataset.section || (entry.target.querySelector("h2")?.textContent || "section");
          // debounce small
          clearTimeout(window.__rayhaiScrollDebounce);
          window.__rayhaiScrollDebounce = setTimeout(() => {
            const panelClosed = !(panelArg && panelArg.classList.contains("open"));
            const emptySuggestions = !(suggestionsBarArg && suggestionsBarArg.childElementCount > 0);
            if (!panelClosed || !emptySuggestions) return;
            // ask engine for single-line suggestion
            askEngine(`Propose une action utile en une seule phrase pour la section "${sectionName}".`).then(reply => {
              if (!reply) return;
              const line = reply.split("\n")[0].trim();
              suggestionsBarArg.innerHTML = "";
              const btn = document.createElement("button");
              btn.className = "suggestion-chip";
              btn.type = "button";
              btn.textContent = line;
              btn.addEventListener("click", () => {
                panelArg.classList.add("open");
                panelArg.setAttribute("aria-hidden", "false");
                appendUserMessage(line);
                appendAssistantMessage("…");
                askEngine(line).then(res => {
                  const last = document.querySelector(".rayhai-body").lastElementChild;
                  if (last && last.querySelector && last.querySelector(".msg-bubble").textContent === "…") last.remove();
                  appendAssistantMessage(res || "Aucune réponse.");
                }).catch(()=>{
                  appendAssistantMessage("Erreur.");
                });
              });
              suggestionsBarArg.appendChild(btn);
              suggestionsBarArg.style.display = "flex";
            }).catch(()=>{});
          }, 300);
        });
      }, { threshold: 0.45 });
      sections.forEach(s => observer.observe(s));
      state.sectionObserver = observer;
      return observer;
    }

    // idle watch
    let lastActivity = Date.now();
    function markActivity() { lastActivity = Date.now(); }
    ["mousemove", "keydown", "touchstart", "scroll", "click"].forEach(evt => document.addEventListener(evt, markActivity, { passive: true }));

    let idleInterval = null;
    function startIdleWatcher() {
      if (idleInterval) clearInterval(idleInterval);
      idleInterval = setInterval(() => {
        const idle = (Date.now() - lastActivity) > CONFIG.idleTimeoutMs;
        if (idle && cfg.enabled) {
          const panelClosed = !panel.classList.contains("open");
          const noSuggestions = !suggestionsBar || suggestionsBar.childElementCount === 0;
          if (panelClosed && noSuggestions) {
            askEngine("Salut — je peux aider. Veux-tu une suggestion pour améliorer cette page ?").then(reply => {
              if (!reply) return;
              const lines = reply.split(/\n+/).map(s => s.trim()).filter(Boolean);
              renderChips(lines.slice(0, CONFIG.suggestionLimit));
            }).catch(()=>{});
          }
        }
      }, 3000);
    }
    function stopIdleWatcher() { if (idleInterval) { clearInterval(idleInterval); idleInterval = null; } }

    // enable / disable
    function enable() {
      cfg.enabled = true;
      document.addEventListener("selectionchange", handleSelectionChange);
      // start section observer using provided refs
      try {
        startSectionObserver(panel, suggestionsBar);
      } catch (_) {}
      startProactive();
      startIdleWatcher();
    }
    function disable() {
      cfg.enabled = false;
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (state.sectionObserver) { state.sectionObserver.disconnect(); state.sectionObserver = null; }
      stopProactive();
      stopIdleWatcher();
      hideSelPopup();
    }

    // init
    if (cfg.enabled) enable();

    // expose API
    window.RayhaiSuggest = {
      scanNow: scanAndSuggest,
      enable: enable,
      disable: disable,
      setOffline: (v) => { cfg.offline = !!v; },
      status: () => ({ cfg })
    };

    // initial scan
    setTimeout(() => { if (cfg.enabled) scanAndSuggest(); }, 900);

    return {
      renderChips,
      startSectionObserver
    };
  }

  /* ========================
     RayhaiPro API (control)
     ======================== */
  window.RayhaiPro = {
    enableAll: () => { if (window.RayhaiSuggest) window.RayhaiSuggest.enable(); },
    disableAll: () => { if (window.RayhaiSuggest) window.RayhaiSuggest.disable(); },
    setOffline: (v) => { if (window.RayhaiSuggest) window.RayhaiSuggest.setOffline(!!v); },
    status: () => ({ ready: !!window.RayhaiPanel, suggest: !!window.RayhaiSuggest })
  };

  /* ========================
     Local test engine (fallback)
     ======================== */
  if (!window.RayhaiEngine) {
    window.RayhaiEngine = {
      ask: async function (prompt) {
        // small simulated latency
        await new Promise(r => setTimeout(r, 300));
        // simple heuristics
        const q = (prompt || "").toLowerCase();
        if (q.includes("résume") || q.includes("résumer") || q.includes("résumé")) {
          return "Résumé (local) : garde l'idée principale, liste 3 points, ajoute un CTA.";
        }
        if (q.includes("propose") || q.includes("action") || q.includes("suggest")) {
          return "Ajouter un court résumé en début de section.\nRendre les CTA plus visibles.\nAjouter preuve par projet.";
        }
        return "IA TEST : " + (prompt || "");
      }
    };
  }

  /* ========================
     Boot (Production — Silent)
     ======================== */
  function bootRayhAI() {
    try {
      const root = ensureUI();
      if (!root) return;

      const refs = initPanel(root);
      if (!refs || !refs.panel) return;

      initMessaging(refs.panel);

      const bubbleAPI = initBubble(root);
      if (!bubbleAPI) return;

      try {
        initSuggestModule(root, {
          panel: refs.panel,
          body: refs.body,
          suggestionsBar: refs.suggestionsBar
        });
      } catch (e) {
        // silent
      }

      document.dispatchEvent(new Event("RayhAI_READY_FINAL"));
    } catch (e) {
      // silent catch in production
      console.error && console.error("[RayhAI Boot Error]", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRayhAI);
  } else {
    bootRayhAI();
  }

  /* ========================
     End of file
     ======================== */
})();
