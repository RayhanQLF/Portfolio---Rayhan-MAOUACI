/* ============================================================
   RAYHAI Engine — Version Ultra Premium
   Réponses locales enrichies + fallback propre
   Compatible avec ton persona.json actuel
============================================================ */

(function () {
  "use strict";

  let PERSONA = null;

  /* ============================================================
     Chargement du persona.json
  ============================================================ */
  async function loadPersona() {
    try {
      const res = await fetch("./ai/persona.json", { cache: "no-store" });
      PERSONA = await res.json();
      return PERSONA;
    } catch (e) {
      console.warn("RayhAI: impossible de charger persona.json", e);
      PERSONA = {};
      return PERSONA;
    }
  }

  window.RayhaiPersona = {
    get: async () => {
      if (!PERSONA) await loadPersona();
      return PERSONA;
    }
  };

  /* ============================================================
     FONCTION UTILE
  ============================================================ */
  const clean = (t) => String(t || "").toLowerCase().trim();


  /* ============================================================
     LOCAL RESPONDER — CERVEAU OFFLINE
  ============================================================ */
  function localResponder(sentence) {
    if (!PERSONA) return "Chargement du système…";

    const t = clean(sentence);

    /* ------------------------------------------------------------
       1. SALUTATIONS
    ------------------------------------------------------------ */
    if (/^(bonjour|salut|yo|wesh|hello)/.test(t))
      return `Salut, ici RayhAI. Comment puis-je t’aider aujourd’hui ?`;

    /* ------------------------------------------------------------
       2. "ÇA VA ?"
    ------------------------------------------------------------ */
    if (/ça va|ca va|comment tu vas/.test(t))
      return "Oui, ça va parfaitement. Merci de demander. Et toi ?";

    /* ------------------------------------------------------------
       3. "QUI ES-TU ?"
    ------------------------------------------------------------ */
    if (
      t.includes("qui es") ||
      t.includes("tu es qui") ||
      t.includes("t'es qui") ||
      t.includes("présente toi")
    ) {
      return `Je suis RayhAI, l’assistant personnel intégré au site de ${PERSONA.name}. Mon rôle est de t’accompagner, t’expliquer et t’aider dans tout ce dont tu as besoin.`;
    }

    /* ------------------------------------------------------------
       4. INFORMATIONS PERSONNELLES (basées persona.json)
    ------------------------------------------------------------ */
    if (t.includes("âge") || t.includes("ans"))
      return PERSONA.age ? `${PERSONA.name} a ${PERSONA.age} ans.` : `${PERSONA.name} n’a pas d’âge défini.`;

    if (t.includes("nom") && t.includes("toi"))
      return `Je suis RayhAI. Mon créateur s’appelle ${PERSONA.name}.`;

    if (t.includes("qui est") && PERSONA.name && t.includes(PERSONA.name.toLowerCase()))
      return `${PERSONA.name} est la personne principale liée à ce site.`;

    /* ------------------------------------------------------------
       5. COMPÉTENCES
    ------------------------------------------------------------ */
    if (t.includes("compétence") || t.includes("skill")) {
      const web = PERSONA.skills?.web?.join(", ") || null;
      const tech = PERSONA.skills?.tech?.join(", ") || null;

      if (!web && !tech) return "Aucune compétence n’est enregistrée dans ton persona.";

      let rep = "Compétences principales : ";
      if (web) rep += web;
      if (tech) rep += (web ? " — " : "") + tech;
      return rep + ".";
    }

    /* ------------------------------------------------------------
       6. PASSIONS
    ------------------------------------------------------------ */
    if (t.includes("passion") || t.includes("aime")) {
      if (!PERSONA.passions) return "Aucune passion n'est définie dans ton persona.";
      return `${PERSONA.name} aime : ${PERSONA.passions.join(", ")}.`;
    }

    /* ------------------------------------------------------------
       7. PROJETS
    ------------------------------------------------------------ */
    if (t.includes("projet") || t.includes("portfolio")) {
      if (!PERSONA.projects) return "Aucun projet enregistré.";
      return `Projets de ${PERSONA.name} : ${PERSONA.projects.join(" • ")}. Lequel veux-tu voir en détail ?`;
    }

    /* ------------------------------------------------------------
       8. OBJECTIFS
    ------------------------------------------------------------ */
    if (t.includes("objectif") || t.includes("avenir") || t.includes("bts")) {
      if (PERSONA.objectives?.pro)
        return `${PERSONA.name} vise : ${PERSONA.objectives.pro}.`;
      return "Aucun objectif défini.";
    }

    /* ------------------------------------------------------------
       9. LANGUES
    ------------------------------------------------------------ */
    if (t.includes("langue") || t.includes("parle")) {
      if (PERSONA.languages?.length)
        return `${PERSONA.name} parle : ${PERSONA.languages.join(", ")}.`;
      return "Aucune langue renseignée.";
    }

    /* ------------------------------------------------------------
       10. TEMPS / HEURE
    ------------------------------------------------------------ */
    if (t.includes("heure"))
      return "Actuellement, je ne peux pas accéder à l’heure système.";

    if (t.includes("date"))
      return "Je ne peux pas afficher la date exacte, mais je peux t’aider sur tout le reste.";

    /* ------------------------------------------------------------
       11. BLAGUES
    ------------------------------------------------------------ */
    if (t.includes("blague"))
      return "Pourquoi les programmeurs confondent Halloween et Noël ? Parce que OCT 31 = DEC 25.";

    /* ------------------------------------------------------------
       12. DÉFINITION « c’est quoi …? »
    ------------------------------------------------------------ */
    if (/^c('?est)? quoi .+/.test(t)) {
      const subject = t.replace(/^c('?est)? quoi /, "").trim();
      return `Voici une explication simple de "${subject}" : c’est un concept ou un élément que tu veux comprendre. Si tu veux une vraie définition précise, reformule : "Explique-moi ${subject}".`;
    }

    if (t.startsWith("explique")) {
      const subject = t.replace("explique", "").trim();
      return `Voici une clarification sur ${subject} : c’est quelque chose que je peux développer si tu précises ce que tu veux savoir exactement.`;
    }

    /* ------------------------------------------------------------
       13. DEMANDES GÉNÉRIQUES
    ------------------------------------------------------------ */
    if (t.includes("aide")) return "Bien sûr. Dis-moi ce dont tu as besoin.";

    if (t.includes("merci")) return "Avec plaisir. Je suis là pour ça.";

    if (t.includes("ok") || t === "d'accord") return "Parfait. On continue ?";

    /* ------------------------------------------------------------
       14. MATCH VAGUE PASSIONS / SKILLS
    ------------------------------------------------------------ */
    for (const key of ["passions", "skills"]) {
      if (PERSONA[key]) {
        const text = JSON.stringify(PERSONA[key]).toLowerCase();
        if (t.split(" ").some((w) => text.includes(w))) {
          return `Je peux te donner plus d'informations sur "${sentence}". Que veux-tu savoir exactement ?`;
        }
      }
    }

    /* ------------------------------------------------------------
       15. FALLBACK LOCAL PROPRE
    ------------------------------------------------------------ */
    return null;
  }

  /* ============================================================
     ENGINE ASK() — FONCTION PRINCIPALE
  ============================================================ */
  async function ask(text) {
    if (!PERSONA) await loadPersona();

    const local = localResponder(text);
    if (local) return local;

    return "Je ne suis pas certain d’avoir bien compris. Reformule ou précise ta demande.";
  }

  /* ============================================================
     EXPORT
  ============================================================ */
  window.RayhaiEngine = {
    ask,
    loadPersona,
    _internal: { localResponder }
  };

  loadPersona();
})();
