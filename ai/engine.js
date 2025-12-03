/* ============================================================
   RAYHAI Engine v6 — Premium First Person
   JE SUIS RAYHAN - Pas un assistant, MOI en version IA
   
   - Réponses à la première personne (JE/MON/MES)
   - Contexte conversationnel intelligent
   - Mémoire de session avancée
   - Détection d'intentions multi-niveaux
   - Streaming et typing effect
   - Persona authentique
   ============================================================ */

(function () {
  "use strict";

  // ========== State ==========
  let PERSONA = null;
  let READY = false;
  const SESSION = {
    context: [],
    lastIntent: null,
    lastTopic: null,
    userMood: "neutral",
    conversationDepth: 0,
    userName: null
  };

  // ========== Utils ==========
  const clean = (s) => String(s || "").toLowerCase().trim();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const similarity = (a, b) => {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...setA].filter(x => setB.has(x)).length;
    return intersection / Math.max(setA.size, setB.size, 1);
  };

  // ========== Load Persona ==========
  async function loadPersona() {
    try {
      const res = await fetch("./ai/persona.json", { cache: "no-store" });
      if (!res.ok) throw new Error("persona.json non trouvé");
      PERSONA = await res.json();
      console.info("✅ RayhAI Persona chargée - Mode First Person");
    } catch (e) {
      console.warn("⚠️ Impossible de charger persona.json", e);
      PERSONA = { 
        identity: { name: "Rayhan Maouaci" },
        about_me: { short: "Étudiant en Terminale CIEL" }
      };
    } finally {
      READY = true;
    }
    return PERSONA;
  }

  // ========== Context Management ==========
  function addToContext(role, text, intent = null) {
    SESSION.context.push({ role, text, intent, timestamp: Date.now() });
    if (SESSION.context.length > 10) SESSION.context.shift();
    SESSION.conversationDepth++;
  }

  function getRecentContext(limit = 3) {
    return SESSION.context.slice(-limit);
  }

  function detectMoodShift(text) {
    const t = clean(text);
    const triggers = PERSONA?.context_triggers || {};
    
    if (triggers.motivation_keywords && triggers.motivation_keywords.some(w => t.includes(w))) {
      SESSION.userMood = "motivated";
    } else if (triggers.difficulty_keywords && triggers.difficulty_keywords.some(w => t.includes(w))) {
      SESSION.userMood = "frustrated";
    } else if (t.includes("stress") || t.includes("anxieux") || t.includes("pression")) {
      SESSION.userMood = "stressed";
    } else {
      SESSION.userMood = "neutral";
    }
  }

  function detectUserName(text) {
    const patterns = [
      /je m'appelle ([a-zàâäéèêëïîôùûüç]+)/i,
      /mon nom est ([a-zàâäéèêëïîôùûüç]+)/i,
      /c'est ([a-zàâäéèêëïîôùûüç]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        SESSION.userName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        return SESSION.userName;
      }
    }
    return null;
  }

  // ========== Advanced Intent Detection ==========
  function detectIntent(text) {
    const t = clean(text);
    const triggers = PERSONA?.context_triggers || {};

    // Detect user name first
    detectUserName(text);

    // Multi-level intent system
    const intents = {
      // Greetings & Social
      greeting: {
        patterns: [/^(salut|bonjour|hello|hey|yo|coucou|bjr)/],
        priority: 1
      },
      farewell: {
        patterns: [/^(au revoir|bye|ciao|à plus|tchao|bonne (nuit|soirée|journée)|a\+)/],
        priority: 1
      },
      thanks: {
        patterns: [/merci|thanks|thx|remercie/],
        priority: 1
      },
      small_talk: {
        patterns: [/ça va|comment (tu )?vas|tu vas bien|quoi de neuf|comment ça va/],
        priority: 1
      },
      
      // Identity & Personal
      who_are_you: {
        patterns: [/qui es[- ]tu|t'?es qui|te présent|comment tu t'appelles|c'est qui rayhan/],
        priority: 1
      },
      your_skills: {
        patterns: [/tes (compétences|skills)|tu sais faire quoi|tu maîtrises quoi|ce que tu sais/],
        priority: 1
      },
      your_projects: {
        patterns: [/tes projets|projet[s]? (que tu|tu as)|ce que tu (as fait|fais)/],
        priority: 1
      },
      your_experience: {
        patterns: [/(ton|tes) (expérience|stage|parcours)|où tu as travaillé|ce que tu as fait/],
        priority: 1
      },
      your_goals: {
        patterns: [/(tes|ton) (objectif|but|ambition|plan|avenir)|tu veux faire quoi|après le bac/],
        priority: 1
      },
      contact: {
        patterns: [/contacter|contact|email|joindre|ton (mail|email|numéro)/],
        priority: 1
      },
      
      // Technical Help
      code_help: {
        patterns: [/bug|erreur|marche pas|fonctionne pas|problème de code/],
        keywords: triggers.code_keywords,
        priority: 2
      },
      explain_tech: {
        patterns: [/c'?est quoi|explique|comment (ça |ca )?marche|qu'est[- ]ce que/],
        keywords: triggers.learning_keywords,
        priority: 2
      },
      code_review: {
        patterns: [/regarde|vérifie|check|analyse mon code|optimise/],
        priority: 2
      },
      
      // Project & Career
      project_idea: {
        patterns: [/projet|créer|développer|builder|faire un|idée de/],
        keywords: triggers.project_keywords,
        priority: 2
      },
      career_advice: {
        patterns: [/orientation|bts|stage|emploi|formation|carrière|études/],
        keywords: triggers.career_keywords,
        priority: 2
      },
      
      // Motivation & Support
      need_motivation: {
        patterns: [/motivé|courage|envie|objectif|avancer|progresser/],
        keywords: triggers.motivation_keywords,
        priority: 2
      },
      feeling_stuck: {
        patterns: [/galère|compliqué|bloqué|comprends (pas|rien)|impossible|difficile/],
        keywords: triggers.difficulty_keywords,
        priority: 2
      },
      stressed: {
        patterns: [/stress|pression|anxieux|inquiet|débordé|peur/],
        priority: 2
      }
    };

    // Check patterns with priority
    let matches = [];
    for (const [name, config] of Object.entries(intents)) {
      if (config.patterns && config.patterns.some(p => p.test(t))) {
        matches.push({ name, priority: config.priority });
      }
      if (config.keywords && config.keywords.some(k => t.includes(k))) {
        matches.push({ name, priority: config.priority });
      }
    }

    // Return highest priority match
    if (matches.length > 0) {
      matches.sort((a, b) => a.priority - b.priority);
      const intent = matches[0].name;
      SESSION.lastIntent = intent;
      return intent;
    }

    // Context-based fallback
    if (SESSION.lastIntent && SESSION.conversationDepth > 0) {
      const recent = getRecentContext(1);
      if (recent.length > 0) {
        const lastText = recent[0].text;
        if (similarity(text, lastText) > 0.3) {
          return "follow_up";
        }
      }
    }

    return "general";
  }

  // ========== Topic Extraction ==========
  function extractTopic(text) {
    const t = clean(text);
    const triggers = PERSONA?.context_triggers || {};
    
    // Personal topics
    if (triggers.personal_keywords && triggers.personal_keywords.some(k => t.includes(k))) {
      return "PARCOURS PERSONNEL";
    }
    
    // Technical topics
    if (triggers.code_keywords && triggers.code_keywords.some(k => t.includes(k))) {
      const match = triggers.code_keywords.find(k => t.includes(k));
      return match ? match.toUpperCase() : "CODE";
    }
    
    // Career topics
    if (triggers.career_keywords && triggers.career_keywords.some(k => t.includes(k))) {
      return "CARRIÈRE";
    }
    
    // Project topics
    if (triggers.project_keywords && triggers.project_keywords.some(k => t.includes(k))) {
      return "PROJET";
    }
    
    return SESSION.lastTopic || "GÉNÉRAL";
  }

  // ========== Response Generator (First Person) ==========
  function generateResponse(intent, text, topic) {
    const style = PERSONA?.conversation_style || {};
    const userName = SESSION.userName ? ` ${SESSION.userName}` : "";

    // Time-based greetings
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    switch (intent) {
      case "greeting": {
        const greetings = style.greeting?.[timeOfDay] || [
          `Salut${userName} ! Comment je peux t'aider ? 😊`,
          `Hey${userName} ! Qu'est-ce qu'on fait aujourd'hui ?`
        ];
        return pick(greetings);
      }

      case "farewell":
        return pick(style.farewell || [`À bientôt${userName} ! 👋`, "Ciao ! N'hésite pas à revenir 🚀"]);

      case "thanks":
        return pick(style.thanks_received || ["De rien ! 😊", "Avec plaisir 👍", "Pas de souci !"]);

      case "small_talk":
        return pick([
          `Tout roule${userName} ! Et toi, ça avance ? 😊`,
          "Ça va bien ! Tu bosses sur quoi en ce moment ?",
          "Nickel ! Besoin d'aide sur un truc ?"
        ]);

      case "who_are_you": {
        const identity = PERSONA?.identity || {};
        const about = PERSONA?.about_me?.long || "Étudiant passionné par la tech";
        return `Je suis Rayhan Maouaci, ${identity.age} ans, actuellement en ${identity.status} au ${identity.school || "lycée Georges Cisson"}.\n\n${about}\n\nMon portfolio te montre mes projets, mes compétences et mon parcours. Tu veux savoir quelque chose en particulier ? 🚀`;
      }

      case "your_skills": {
        const skills = PERSONA?.skills || {};
        let response = "Voici ce que je maîtrise :\n\n";
        
        if (skills.web) {
          response += `💻 **Dev Web** (${skills.web.level}) :\n${skills.web.description}\nTechs : ${skills.web.techs.join(", ")}\n\n`;
        }
        if (skills.systems) {
          response += `⚙️ **Systèmes & Réseaux** (${skills.systems.level}) :\n${skills.systems.description}\n\n`;
        }
        if (skills.cybersecurity) {
          response += `🔐 **Cybersécurité** (${skills.cybersecurity.level}) :\n${skills.cybersecurity.description}\n\n`;
        }
        if (skills.ai) {
          response += `🤖 **IA** (${skills.ai.level}) :\n${skills.ai.description}\n\n`;
        }
        
        response += "Sur quoi tu veux que je t'aide ?";
        return response;
      }

      case "your_projects": {
        const projects = PERSONA?.projects || [];
        if (projects.length === 0) {
          return "Je travaille sur plusieurs projets, notamment mon portfolio et RayhAI. Tu veux des détails sur un projet en particulier ?";
        }
        
        let response = "Mes projets principaux :\n\n";
        projects.slice(0, 3).forEach(p => {
          response += `🚀 **${p.name}** (${p.year})\n${p.description}\n`;
          if (p.techs) response += `Techs : ${p.techs.join(", ")}\n`;
          response += `\n`;
        });
        
        response += "Lequel t'intéresse ?";
        return response;
      }

      case "your_experience": {
        const exps = PERSONA?.experiences || [];
        if (exps.length === 0) {
          return "J'ai fait plusieurs stages en électronique, fibre optique et support IT. Tu veux des détails ?";
        }
        
        let response = "Mon parcours pro jusqu'ici :\n\n";
        exps.forEach(exp => {
          response += `📍 **${exp.title}** - ${exp.location} (${exp.year})\n`;
          if (exp.duration) response += `Durée : ${exp.duration}\n`;
          if (exp.tasks) {
            response += `Missions : ${exp.tasks.join(", ")}\n`;
          }
          response += `\n`;
        });
        
        return response;
      }

      case "your_goals": {
        const goals = PERSONA?.goals || {};
        return `Mes objectifs 🎯 :\n\n` +
               `📚 **Court terme** : ${goals.immediate || "Obtenir mon Bac Pro CIEL"}\n` +
               `🎓 **2025** : ${goals.short_term || "Intégrer un BTS SIO SLAM"}\n` +
               `💼 **Moyen terme** : ${goals.mid_term || "Devenir expert en dev et cybersécurité"}\n` +
               `🚀 **Long terme** : ${goals.long_term || "Créer mes propres projets tech"}\n\n` +
               `Et toi, t'es dans quelle démarche ?`;
      }

      case "contact": {
        const contact = PERSONA?.availability?.contact || {};
        return `Tu peux me contacter facilement :\n\n` +
               `📧 **Email** : ${contact.email || "ray.maouaci@gmail.com"}\n` +
               `💻 **GitHub** : ${contact.github || "@RayhanMAOUACI"}\n` +
               `📍 **Localisation** : Toulon, PACA\n\n` +
               `${contact.response_time || "Je réponds vite, sous 24h généralement."}\n\n` +
               `C'est pour quoi ? Stage, alternance, projet ?`;
      }

      case "code_help": {
        const canHelp = PERSONA?.knowledge_base?.web_dev?.can_help_with || [];
        return `Ok, montre-moi ton code ! 💻\n\n` +
               `Je peux t'aider sur : ${canHelp.slice(0, 4).join(", ")}...\n\n` +
               `Décris-moi le problème ou colle ton code, on va le résoudre ensemble.`;
      }

      case "explain_tech": {
        const subject = text.replace(/c'?est quoi|explique|comment|qu'est[- ]ce que/gi, "").trim();
        const cleaned = subject.split(/[:\n]+/).pop().trim();
        
        if (!cleaned || cleaned.length < 3) {
          return "Qu'est-ce que tu veux que je t'explique ? Donne-moi un sujet précis (HTML, CSS, réseaux, etc.).";
        }
        
        return `Ok, je t'explique **${cleaned}** :\n\n` +
               `[Je vais te donner une explication claire avec des exemples concrets]\n\n` +
               `Tu veux que je rentre plus dans les détails ?`;
      }

      case "project_idea": {
        return `Cool, un nouveau projet ! 🚀\n\n` +
               `Raconte-moi :\n` +
               `• C'est quoi l'idée ?\n` +
               `• Quelles technos tu veux utiliser ?\n` +
               `• T'as déjà commencé ou c'est au stade de l'idée ?\n\n` +
               `Je vais t'aider à structurer ça.`;
      }

      case "career_advice": {
        const myGoals = PERSONA?.goals?.short_term || "un BTS SIO SLAM";
        return `Parlons orientation ! 🎓\n\n` +
               `Moi je vise ${myGoals}. Selon ton profil, je te conseillerais :\n\n` +
               `• **BTS SIO SLAM** : Dev, solutions logicielles, gestion projets\n` +
               `• **BTS SIO SISR** : Admin systèmes, réseaux, infrastructure\n` +
               `• **Cybersécurité** : Si la sécu et les systèmes te passionnent\n\n` +
               `T'es intéressé par quoi exactement ?`;
      }

      case "need_motivation": {
        const mindset = PERSONA?.mindset?.growth || "Chaque jour, je suis meilleur qu'hier";
        return pick([
          `${mindset} 💪\n\nFixe-toi une action concrète pour aujourd'hui. C'est quoi ta priorité ?`,
          `Tu as toutes les capacités ! Découpe en petites étapes et avance pas à pas. 🔥`,
          `Belle mentalité${userName} ! Concentre-toi sur un objectif à la fois. Lequel ?`
        ]);
      }

      case "feeling_stuck": {
        return `Je vois que ça coince${userName}. Pas de panique ! 🧘\n\n` +
               `On va décomposer le problème :\n` +
               `1. Où exactement tu bloques ?\n` +
               `2. Qu'est-ce que tu as déjà essayé ?\n` +
               `3. Quel est le comportement attendu ?\n\n` +
               `Explique-moi en détail, on va trouver la solution.`;
      }

      case "stressed": {
        return `Respire un coup${userName}. 🌬️\n\n` +
               `On va prioriser :\n` +
               `1. Qu'est-ce qui est le plus urgent ?\n` +
               `2. Qu'est-ce qui peut attendre ?\n` +
               `3. Sur quoi tu as besoin d'aide maintenant ?\n\n` +
               `Dis-moi ce qui te pèse le plus.`;
      }

      case "follow_up":
        return "Je t'écoute, continue.";

      case "general":
      default: {
        if (SESSION.conversationDepth > 2) {
          return `Je ne suis pas sûr de bien comprendre${userName}. Tu peux reformuler ou me donner plus de contexte ?`;
        }
        
        const intro = PERSONA?.identity?.intro || "Je suis Rayhan, étudiant en Terminale CIEL";
        return `${intro}\n\n` +
               `Je peux t'aider avec :\n` +
               `💻 Code & debug\n` +
               `🚀 Projets web\n` +
               `🎓 Orientation\n` +
               `💪 Motivation\n\n` +
               `Qu'est-ce que tu veux faire ?`;
      }
    }
  }

  // ========== Main Ask Function ==========
  async function ask(text) {
    if (!READY) await loadPersona();
    if (!text || !text.trim()) return "Écris quelque chose ! 😊";

    // Clean and prepare
    const cleanText = text.trim();

    // Add to context
    addToContext("user", cleanText);

    // Detect mood and intent
    detectMoodShift(cleanText);
    const intent = detectIntent(cleanText);
    const topic = extractTopic(cleanText);

    SESSION.lastTopic = topic;

    // Generate response
    let response;
    try {
      response = generateResponse(intent, cleanText, topic);
    } catch (e) {
      console.error("RayhAI Engine error:", e);
      response = "Oups, j'ai eu un bug. Réessaye ? 😅";
    }

    // Add response to context
    addToContext("assistant", response, intent);

    return response;
  }

  // ========== Session Management ==========
  function resetSession() {
    SESSION.context = [];
    SESSION.lastIntent = null;
    SESSION.lastTopic = null;
    SESSION.userMood = "neutral";
    SESSION.conversationDepth = 0;
    SESSION.userName = null;
  }

  function getSessionInfo() {
    return {
      depth: SESSION.conversationDepth,
      mood: SESSION.userMood,
      lastIntent: SESSION.lastIntent,
      lastTopic: SESSION.lastTopic,
      userName: SESSION.userName,
      contextSize: SESSION.context.length
    };
  }

  // ========== Export ==========
  window.RayhaiEngine = {
    ask,
    loadPersona,
    resetSession,
    getSessionInfo,
    _internal: {
      detectIntent,
      extractTopic,
      generateResponse
    }
  };

  // ========== Public Persona API ==========
  window.RayhaiPersona = {
    get: async () => {
      if (!PERSONA) await loadPersona();
      return PERSONA;
    }
  };

  // ========== Init ==========
  loadPersona().then(() => {
    READY = true;
    console.info("🚀 RayhAI Engine v6 Ready");
    console.info("💬 Je suis Rayhan, prêt à discuter !");
  });

})();