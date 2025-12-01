/* ============================================================
   RAYHAI Engine (hybrid)
   - Local rules/responses (fast)
   - Optional OpenAI fallback (setApiKey)
============================================================ */

(function () {
  "use strict";

  // persona will be loaded from persona.json
  let PERSONA = null;

  async function loadPersona() {
    try {
      const res = await fetch("./ai/persona.json", {cache: "no-store"});
      if (!res.ok) throw new Error("persona.json non trouvé");
      PERSONA = await res.json();
      return PERSONA;
    } catch (e) {
      console.warn("RayhAI: impossible de charger persona.json", e);
      PERSONA = null;
      return null;
    }
  }

  // expose persona getter
  window.RayhaiPersona = {
    get: async () => {
      if (!PERSONA) await loadPersona();
      return PERSONA;
    }
  };

  // Local responder - deterministic templates, fast
  function localResponder(text) {
    if (!PERSONA) return "Je charge les informations…";
    const t = String(text || "").toLowerCase();

    if (/^(bonjour|salut|hello)/.test(t)) return `Salut — je suis RayhAI, assistant personnel de ${PERSONA.name}.`;
    if (t.includes("qui es") || t.includes("présente")) {
      return `${PERSONA.name}, ${PERSONA.age} ans — ${PERSONA.path}. Passions : ${PERSONA.passions.join(", ")}.`;
    }
    if (t.includes("âge") || t.includes("ans")) return `${PERSONA.name} a ${PERSONA.age} ans.`;
    if (t.includes("compétence") || t.includes("skill") || t.includes("compétences")) {
      const web = PERSONA.skills?.web?.join(", ") || "";
      const tech = PERSONA.skills?.tech?.join(", ") || "";
      return `Compétences principales : ${web}${tech ? " — " + tech : ""}.`;
    }
    if (t.includes("projet") || t.includes("portfolio")) {
      return `Projets connus : ${PERSONA.projects.join(" • ")}. Dis lequel tu veux le détail ?`;
    }
    if (t.includes("langue")) return `Langues : ${PERSONA.languages.join(", ")}.`;
    if (t.includes("objectif") || t.includes("bts") || t.includes("avenir")) return `Objectif : ${PERSONA.objectives.pro}.`;

    // small fuzzy match on passions/skills for richer local reply
    for (const key of ["passions", "skills"]) {
      if (PERSONA[key]) {
        const joined = Array.isArray(PERSONA[key]) ? PERSONA[key].join(" ").toLowerCase() : JSON.stringify(PERSONA[key]).toLowerCase();
        if (t.split(" ").some(w => joined.includes(w))) {
          return `Je peux te donner plus d'infos sur "${t}". Par exemple : ${joined.split(" ").slice(0,8).join(" ")}... Veux-tu un détail précis ?`;
        }
      }
    }

    // fallback local small help
    return null; // indicate: no confident local answer
  }

  // OpenAI fallback (async). Provide an external function to set key.
  let _API_KEY = null;
  function setApiKey(key, persist = false) {
    _API_KEY = key ? String(key).trim() : null;
    if (persist && _API_KEY) {
      try { localStorage.setItem("RAYHAI_API_KEY", _API_KEY); } catch(e){/*ignore*/ }
    }
    return _API_KEY;
  }
  // load persisted key if any (opt-in)
  try {
    const saved = localStorage.getItem("RAYHAI_API_KEY");
    if (saved) _API_KEY = saved;
  } catch(e){}

  async function openAIRequest(prompt) {
    if (!_API_KEY) throw new Error("OpenAI API key not set");
    // build system prompt with persona
    const persona = PERSONA || {};
    const system = `You are RayhAI, assistant for ${persona.name || "a user"}. Answer in French. Use persona facts if relevant. Be concise and professional.`;
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.25,
      max_tokens: 700
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization":"Bearer " + _API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error("OpenAI error: " + resp.status + " " + txt);
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content;
    return reply || null;
  }

  // Public API: ask(text) -> returns reply string
  async function ask(text) {
    if (!PERSONA) await loadPersona();

    // 1) try local responder
    try {
      const local = localResponder(text);
      if (local) return local;
    } catch(e){
      console.warn("RayhAI local rule error", e);
    }

    // 2) try OpenAI fallback if key present
    if (_API_KEY) {
      try {
        const r = await openAIRequest(text);
        if (r) return r;
      } catch (e) {
        console.warn("RayhAI OpenAI error", e);
      }
    }

    // 3) fallback generic helpful response
    return "Désolé, je n'ai pas de réponse complète pour ça en local. Reformule ou demande un autre sujet.";
  }

  // expose API
  window.RayhaiEngine = {
    ask,
    setApiKey,
    loadPersona,
    _internal: { localResponder } // for debugging
  };

  // load persona on boot
  loadPersona();

})();
