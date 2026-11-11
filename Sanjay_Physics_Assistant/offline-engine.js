"use strict";

window.SanjayPhysicsOfflineEngine = (() => {
  const KB = window.SANJAY_PHYSICS_KB;
  const Corpus = window.SanjayPhysicsCorpus;
  const normalise = value => String(value || "").toLowerCase().replace(/[–—−]/g, "-").replace(/²/g, "2").replace(/\s+/g, " ").trim();
  const semanticQuery = value => {
    const source=String(value || "");
    const additions=[
      [/oppos(?:e|es|ition).*?(?:current|flow of electric charge)/i," resistance ohm conductor current"],
      [/rate of change of velocity/i," acceleration velocity time"],
      [/energy (?:because of|due to) motion/i," kinetic energy velocity"],
      [/energy (?:because of|due to) (?:position|height)/i," potential energy height"],
      [/bending of light|light bend|bend.*light/i," refraction refractive index"],
      [/number of oscillations (?:made )?per second/i," frequency hertz oscillation"],
      [/minimum energy.*electron.*metal/i," work function photoelectric effect"]
    ].filter(([pattern]) => pattern.test(source)).map(([,terms]) => terms).join(" ");
    return `${source}${additions}`;
  };
  const round = value => Number.isFinite(value) ? Number(value.toPrecision(6)).toString() : "";
  const unit = value => String(value || "").replace(/m\/s2/gi,"m/s²").replace(/m2/gi,"m²").replace(/m3/gi,"m³").replace(/[.,;:]+$/g,"").replace(/\s+/g, " ").trim();
  const section = (label, body) => `**${label}:** ${body}`;

  function getChapters(className) {
    return KB.classes[className] || [];
  }

  function scoreChapter(entry, query, selectedTitle = "") {
    const q = normalise(semanticQuery(query));
    const queryWords = new Set(q.split(/[^a-z0-9λμνθ]+/).filter(Boolean));
    const stopWords = new Set(["the","and","for","with","from","this","that","into"]);
    const title = normalise(entry.title);
    let score = normalise(selectedTitle) === title ? 18 : 0;
    if (q.includes(title)) score += 16;
    [...entry.keywords, ...title.split(/\W+/)].forEach(word => {
      const token = normalise(word);
      const matches = token.includes(" ") ? q.includes(token) : queryWords.has(token);
      if (token.length > 2 && !stopWords.has(token) && matches) score += token.includes(" ") ? 6 : 2;
    });
    return score;
  }

  function findChapter(query, className, selectedTitle) {
    const preferred = getChapters(className);
    const all = Object.values(KB.classes).flat();
    const pool = [...preferred, ...all.filter(item => !preferred.includes(item))];
    return pool.map(entry => ({entry, score:scoreChapter(entry, query, selectedTitle) + (preferred.includes(entry) ? 12 : 0)})).sort((a,b) => b.score-a.score)[0]?.entry || preferred[0];
  }

  const SUBJECT_PATTERNS = {
    Chemistry:/\b(chemistry|chemical equation|periodic table|mole concept|organic chemistry|inorganic chemistry|electrochemistry|chemical kinetics|coordination compound|haloalkane|aldehyde|ketone|amine|polymer|covalent bond|ionic bond|acid base reaction)\b|रसायन/i,
    Biology:/\b(biology|botany|zoology|cell division|mitosis|meiosis|photosynthesis|genetics|dna|rna|evolution|ecosystem|biodiversity|biotechnology|reproduction|human anatomy|human health)\b|जीव विज्ञान/i,
    Mathematics:/\b(mathematics|maths|algebra|calculus|differentiate|derivative|integration|integral|quadratic equation|trigonometric identity|probability|matrix|matrices|determinant|differential equation|linear programming|vector algebra)\b|गणित/i
  };
  const PHYSICS_TERMS = /\b(physics|force|motion|speed|velocity|acceleration|distance|displacement|mass|weight|gravity|gravitation|work|energy|power|momentum|friction|pressure|density|heat|temperature|thermodynamic|wave|sound|frequency|wavelength|light|mirror|lens|optics|electric|electricity|current|voltage|resistance|charge|capacitor|magnet|magnetic|induction|atom|nucleus|nuclear|semiconductor|radiation|quantum|projectile|torque|rotation|oscillation|shm|fluid|viscosity|buoyancy|newton|joule|watt|ohm|ampere|vector)\b/i;
  const FRIENDLY_PATTERNS = /^(hi|hello|hey|namaste|good morning|good afternoon|good evening|how are you|what is your name|who are you|thank you|thanks|bye|goodbye|can you help me|tell me a joke|motivate me|i am bored|i am tired|how should i study|नमस्ते|कैसे हो|धन्यवाद|अलविदा)[.!?\s]*$/i;
  function detectSubject(query) {
    for (const [subject,pattern] of Object.entries(SUBJECT_PATTERNS)) if (pattern.test(query)) return subject;
    if (isPhysicsQuery(query)) return "Physics";
    return "";
  }

  function friendlyResponse(query) {
    const q = normalise(query);
    if (/^(hi|hello|hey|namaste|नमस्ते)/i.test(q)) return "I am your Sanjay, your Physics Assistant.\n\nNamaste! 👋 I’m happy to chat, encourage you, or help with any physics doubt or numerical.";
    if (/how are you|कैसे हो/i.test(q)) return "I’m doing great and ready to learn with you! How are you feeling today?";
    if (/name|who are you/i.test(q)) return "I’m **Sanjay Physics Assistant** — your friendly offline physics companion for school, JEE and NEET preparation.";
    if (/thank|धन्यवाद/i.test(q)) return "You’re most welcome! Keep asking questions — curiosity is how physics becomes clear.";
    if (/bye|goodbye|अलविदा/i.test(q)) return "Goodbye! Keep observing the world like a physicist. 👋";
    if (/joke/i.test(q)) return "Physics joke: Why can’t you trust an atom? Because it makes up everything! 😄";
    if (/tired|bored|motivate|study/i.test(q)) return "Take a short break, drink some water, then try one small concept for 20 minutes. Small, consistent steps beat one long stressful session. You’ve got this!";
    return "Of course! I’m here to chat and help you learn physics in a clear, friendly way. What’s on your mind?";
  }

  function generalKnowledgeResponse(query) {
    const q = normalise(query);
    const facts = [
      {test:/capital of india/, answer:"The capital of India is **New Delhi**."},
      {test:/national animal of india/, answer:"The national animal of India is the **Bengal tiger**."},
      {test:/national bird of india/, answer:"The national bird of India is the **Indian peacock**."},
      {test:/largest planet/, answer:"**Jupiter** is the largest planet in our Solar System."},
      {test:/closest planet to (the )?sun/, answer:"**Mercury** is the closest planet to the Sun."},
      {test:/how many planets/, answer:"There are **eight recognised planets** in our Solar System."},
      {test:/natural satellite of earth|earth.?s moon/, answer:"The **Moon** is Earth’s natural satellite."},
      {test:/largest ocean/, answer:"The **Pacific Ocean** is the largest ocean on Earth."},
      {test:/who wrote.*national anthem|national anthem.*written/, answer:"India’s national anthem was written by **Rabindranath Tagore**."}
    ];
    return facts.find(item => item.test.test(q))?.answer || "I can help with simple everyday facts and friendly conversation while offline. For detailed academic questions, my specialist subject is physics.";
  }

  function isGeneralKnowledge(query) {
    return /\b(capital|national animal|national bird|largest planet|closest planet|how many planets|natural satellite|largest ocean|national anthem|general knowledge|gk)\b/i.test(query);
  }

  function isPhysicsQuery(query) {
    if (PHYSICS_TERMS.test(query)) return true;
    const best = Object.values(KB.classes).flat().reduce((score, entry) => Math.max(score, scoreChapter(entry, query)), 0);
    return best >= 2;
  }

  function wordSet(value) {
    return new Set(normalise(value).split(/[^a-z0-9λμνθ]+/).filter(word => word.length > 2 && !["the","and","for","with","what","explain","define","show","give"].includes(word)));
  }

  function findAcademicChapter(chapters, query) {
    const words=wordSet(query);
    return chapters.map(chapter => {
      const title=normalise(chapter.n), text=normalise([chapter.n,...chapter.c,...chapter.f].join(" "));
      let score=title && normalise(query).includes(title) ? 20 : 0;
      words.forEach(word => { if (title.split(/[^a-z0-9]+/).includes(word)) score+=5; else if (text.includes(word)) score+=1; });
      return {chapter,score};
    }).sort((a,b) => b.score-a.score)[0]?.chapter || chapters[0];
  }

  function foundationalSupport(subject, query) {
    const q=normalise(query);
    if (subject === "Biology" && q.includes("photosynthesis")) return {chapter:"Photosynthesis",answer:"**Photosynthesis**\n\n• Green plants convert light energy into chemical energy in chloroplasts.\n• The light reaction forms ATP and NADPH and releases oxygen from water.\n• The Calvin cycle uses ATP and NADPH to fix carbon dioxide into carbohydrates.\n\nLight intensity, carbon-dioxide concentration and temperature can limit the rate."};
    if (subject === "Chemistry" && q.includes("periodic table")) return {chapter:"Periodic Classification",answer:"**Periodic Classification**\n\n• Elements are arranged by increasing atomic number.\n• A period corresponds to progressive filling of an electron shell; a group collects similar valence-shell configurations.\n• Across a period, effective nuclear charge generally increases; down a group, the number of shells increases.\n\nThese trends explain atomic size, ionisation enthalpy, electron-gain tendency and chemical behaviour."};
    if (subject === "Mathematics" && /quadratic/.test(q)) return {chapter:"Quadratic Equations",answer:"**Quadratic Equation**\n\nWrite the equation in standard form ax² + bx + c = 0, where a ≠ 0. Identify a, b and c carefully, calculate the discriminant D = b² − 4ac, and then use x = (−b ± √D)/(2a).\n\nD > 0 gives two distinct real roots, D = 0 gives equal real roots, and D < 0 gives a complex-conjugate pair."};
    return null;
  }

  async function academicResponse(subject, query) {
    const foundation=foundationalSupport(subject,query);
    if (foundation) return foundation;
    try {
      const database=await window.SanjayAcademicDatabase?.load();
      const chapters=database?.subjects?.[subject] || [];
      if (!chapters.length) throw new Error("subject unavailable");
      const chapter=findAcademicChapter(chapters,query);
      if (/formula|equation|relation|identity/i.test(query)) {
        if (!chapter.f.length) return {answer:`**${chapter.n}**\n\nThis topic is primarily concept-based; there is no single standard formula to memorise. Focus on the process and terminology:\n\n${chapter.c.map(item=>`• ${item}`).join("\n")}`,chapter:chapter.n};
        return {answer:`**${chapter.n} — Required Formulae**\n\n${chapter.f.map((item,index)=>`${index+1}. ${item}`).join("\n")}\n\nUse each relation only after checking its assumptions and symbol meanings.`,chapter:chapter.n};
      }
      if (/mcq|multiple choice|objective question/i.test(query)) {
        return {answer:`**MCQ approach — ${chapter.n}**\n\nFirst identify the exact principle being tested: ${chapter.c[0]} Check every option against that principle and eliminate statements that contradict the definition.`,chapter:chapter.n};
      }
      return {answer:`**${chapter.n}**\n\n${chapter.c.map(item=>`• ${item}`).join("\n")}\n\nThese are the core ideas relevant to your question. Ask for a derivation, formula, or worked example if you want the next level of detail.`,chapter:chapter.n};
    } catch {
      return {answer:`I recognise this as a ${subject} question, but the local Class 12 knowledge pack could not be opened. Please reload the installed app once and try again.`,chapter:""};
    }
  }

  function requestedVisual(query) {
    if (!/(diagram|draw|sketch|free.body|fbd|graph|circuit connection|ray diagram|schematic)/i.test(query)) return "";
    const q=normalise(query);
    if (/free.body|fbd|block|friction/.test(q)) return "**Free-body schematic**\n\nChoose the block as the system. Draw only forces acting on it, then resolve along convenient axes.\n\n[[diagram:fbd]]";
    if (/circuit|series|parallel/.test(q)) return "**Circuit schematic**\n\nMark current directions and potential drops before applying Kirchhoff rules.\n\n[[diagram:circuit]]";
    if (/gauss|electric field|electric flux|charge/.test(q)) return "**Electric-field schematic**\n\nChoose a Gaussian surface that matches the charge symmetry. Mark the outward area vector dA and the field direction before evaluating ΦE = ∮E · dA.\n\n[[diagram:field]]";
    if (/ray|lens|mirror|optic/.test(q)) return "**Ray-optics schematic**\n\nUse one ray parallel to the principal axis and one through the optical centre; their intersection locates the image.\n\n[[diagram:ray]]";
    if (/graph/.test(q)) return "**Graph setup**\n\nLabel both axes with quantity and SI unit, select a uniform scale, and state what the slope and area represent.\n\n[[diagram:graph]]";
    if (/pendulum/.test(q)) return "**Simple-pendulum schematic**\n\nLabel the point of suspension, length l, bob, mean position and angular displacement θ.\n\n[[diagram:pendulum]]";
    if (/projectile|trajectory/.test(q)) return "**Projectile-motion schematic**\n\nChoose horizontal and vertical axes, mark the launch velocity u and resolve it into u cosθ and u sinθ.\n\n[[diagram:projectile]]";
    if (/wave|wavelength|amplitude/.test(q)) return "**Wave schematic**\n\nMark the equilibrium line, amplitude A and wavelength λ between successive points in the same phase.\n\n[[diagram:wave]]";
    return "";
  }

  function physicsBranch(value) {
    const q=normalise(typeof value === "string" ? value : value?.title || "");
    if (/mirror|lens|optic|light|reflection|refraction|wave optics|human eye/.test(q)) return "Optics";
    if (/charge|electrostatic|potential|capacit|gauss|electric flux/.test(q)) return "Electrostatics";
    if (/current|electricity|resistance|ohm|electric power|circuit/.test(q)) return "Current Electricity";
    if (/magnet|induction|alternating|electromagnetic/.test(q)) return "Magnetism and Electromagnetism";
    if (/heat|temperature|thermodynamic|kinetic theory|calor/.test(q)) return "Thermal Physics and Thermodynamics";
    if (/atom|nuclei|nuclear|photoelectric|dual nature|semiconductor|quantum|radiation/.test(q)) return "Modern Physics";
    if (/sound|wave|oscillation|frequency|wavelength/.test(q)) return "Oscillations and Waves";
    if (/unit|measurement|dimension|error/.test(q)) return "Units and Measurements";
    if (/fluid|viscosity|surface tension|bernoulli|pressure/.test(q)) return "Properties of Matter and Fluids";
    return "Mechanics";
  }

  function valueFor(text, names, defaultUnit = "") {
    for (const name of names) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const named = /^[a-z]$/i.test(name) ? `\\b${escaped}\\b` : escaped;
      const patterns = [
        new RegExp(`(?:${named})\\s*(?:(?:is|=|of|:)\\s*)?(-?\\d+(?:\\.\\d+)?)\\s*([a-zA-Z0-9°/%²³\\/.-]+)?`, "i"),
        new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*([a-zA-Z0-9°/%²³\\/.-]+)?\\s*(?:${named})`, "i")
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return {value:Number(match[1]), unit:unit(match[2] || defaultUnit), source:name};
      }
    }
    return null;
  }

  function labelledNumerical(branch, given, target, formula, steps, answer, diagram = "") {
    const symbolMeanings={F:"force",m:"mass",a:"acceleration",K:"kinetic energy",v:"velocity",U:"potential energy",g:"acceleration due to gravity",h:"height",W:"work",s:"displacement",theta:"angle between vectors","θ":"angle between vectors",u:"initial velocity",t:"time",R:"resistance",V:"potential difference",I:"electric current",P:"power",f:"frequency",lambda:"wavelength","λ":"wavelength",c:"specific heat capacity","ΔT":"change in temperature",Q:"heat transferred"};
    const symbols=[...new Set((formula.match(/[A-Za-zΔλθ]+/g) || []).filter(token => symbolMeanings[token]))];
    const explanation=symbols.length ? symbols.map(symbol => `${symbol} = ${symbolMeanings[symbol]}`).join(", ") : "Symbols have their standard meaning for this relation; all quantities are expressed in SI units.";
    const calculationSteps=["Convert and check every given quantity in SI units.",...steps];
    return [
      section("Branch", branch),
      section("Principle", `Apply the standard ${branch} relation using SI quantities and the stated sign convention.`),
      section("Given Data", given.join(", ")),
      section("Required Quantity", target),
      section("Relevant Formula", formula),
      section("Explanation of Symbols", explanation),
      section("Substitution", steps[0] || "Substitute the verified given values into the stated relation."),
      `**Step-by-Step Calculation:**\n${calculationSteps.map((step,index) => `${index+1}. ${step}`).join("\n")}`,
      section("Final Answer with SI Units", answer),
      section("Related Physics Concept", `${branch}. The result should also be checked for dimensions, sign and physical reasonableness.`),
      diagram
    ].filter(Boolean).join("\n\n");
  }

  function contextualSymbolResponse(query, history = []) {
    const q=normalise(query);
    if (!/\b(?:what|which).*\b(?:represent|mean)|\bthat (?:formula|relation|law)\b|\bit\b/.test(q)) return "";
    const recent=history.slice(-6).map(item => String(item?.content || "")).join(" ");
    const symbolMatch=query.match(/\b([RVIuvastFmPgQ])\b/);
    const symbol=symbolMatch?.[1];
    const meanings={R:"resistance",V:"potential difference (voltage)",I:"electric current",u:"initial velocity",v:"final velocity",a:"acceleration",s:"displacement",t:"time",F:"force",m:"mass",P:"power",g:"acceleration due to gravity",Q:"heat transferred"};
    if (symbol && meanings[symbol] && (recent.includes(symbol) || /formula|relation|law/i.test(recent))) {
      return `**${symbol} represents ${meanings[symbol]}.**\n\nUse its SI unit and meaning from the preceding relation. This interpretation follows the immediately previous question; if you meant another equation, include that equation explicitly.`;
    }
    return "";
  }

  function contextualQuery(query, history = []) {
    if (!/\b(it|that|this|there|same|again|relation|formula|law)\b/i.test(query)) return query;
    const previous=history.slice(-6).map(item => String(item?.content || "").trim()).filter(Boolean).slice(-3).join(" ");
    return previous ? `${previous} ${query}` : query;
  }

  function solveNumerical(question) {
    const q = normalise(question);
    const branch=physicsBranch(question);
    const finish=(...args) => labelledNumerical(branch,...args);
    const mass = valueFor(question, ["mass"], "kg") || (() => { const match=question.match(/(-?\d+(?:\.\d+)?)\s*kg\b/i); return match ? {value:Number(match[1]),unit:"kg",source:"kg"} : null; })();
    const acceleration = valueFor(question, ["acceleration", "a"], "m/s²");
    const force = valueFor(question, ["force", "f"], "N");
    const time = valueFor(question, ["time", "t"], "s");
    const distance = valueFor(question, ["distance", "displacement", "s"], "m");
    const initialV = valueFor(question, ["initial velocity", "initial speed", "u"], "m/s");
    const finalV = valueFor(question, ["final velocity", "final speed", "v"], "m/s");
    const velocity = valueFor(question, ["velocity", "speed"], "m/s");
    const height = valueFor(question, ["height", "h"], "m");
    const work = valueFor(question, ["work", "energy", "w"], "J");
    const voltage = valueFor(question, ["voltage", "potential difference", "v"], "V");
    const current = valueFor(question, ["current", "i"], "A");
    const resistance = valueFor(question, ["resistance", "r"], "Ω");
    const frequency = valueFor(question, ["frequency", "f"], "Hz");
    const wavelength = valueFor(question, ["wavelength", "lambda", "λ"], "m");
    const waveSpeed = valueFor(question, ["wave speed", "speed of wave"], "m/s");
    const angle = valueFor(question, ["angle", "theta", "θ"], "°");
    const specificHeat = valueFor(question, ["specific heat capacity", "specific heat", "c"], "J/(kg K)");
    const deltaT = valueFor(question, ["temperature change", "change in temperature", "delta t", "Δt"], "K");

    if ((q.includes("force") || q.includes("newton")) && mass && acceleration && !q.includes("friction")) {
      const result = mass.value * acceleration.value;
      return finish([`m = ${mass.value} ${mass.unit || "kg"}`, `a = ${acceleration.value} ${acceleration.unit || "m/s²"}`], "Force, F", "F = ma", [`Substitute the given values: F = ${mass.value} × ${acceleration.value}`, `F = ${round(result)} kg m/s²`, "Since 1 kg m/s² = 1 N, express the result in newton."], `F = ${round(result)} N`);
    }
    if ((q.includes("kinetic energy") || q.includes(" k.e") || q.includes(" ke ")) && mass && (velocity || finalV)) {
      const v = velocity || finalV; const result = 0.5 * mass.value * v.value ** 2;
      return finish([`m = ${mass.value} ${mass.unit || "kg"}`, `v = ${v.value} ${v.unit || "m/s"}`], "Kinetic energy, K", "K = ½mv²", [`K = ½ × ${mass.value} × (${v.value})²`, `K = 0.5 × ${mass.value} × ${round(v.value**2)}`], `K = ${round(result)} J`);
    }
    if ((q.includes("potential energy") || q.includes(" p.e") || q.includes(" pe ")) && mass && height) {
      const g = valueFor(question,["gravity","g"],"m/s²")?.value || 9.8; const result = mass.value*g*height.value;
      return finish([`m = ${mass.value} ${mass.unit || "kg"}`, `h = ${height.value} ${height.unit || "m"}`, `g = ${g} m/s²`], "Gravitational potential energy, U", "U = mgh", [`U = ${mass.value} × ${g} × ${height.value}`], `U = ${round(result)} J`);
    }
    if ((q.includes("work") || q.includes("work done")) && force && distance) {
      const theta = angle?.value || 0; const result = force.value*distance.value*Math.cos(theta*Math.PI/180);
      return finish([`F = ${force.value} ${force.unit || "N"}`, `s = ${distance.value} ${distance.unit || "m"}`, `θ = ${theta}°`], "Work done, W", "W = Fs cosθ", [`W = ${force.value} × ${distance.value} × cos ${theta}°`, `cos ${theta}° = ${round(Math.cos(theta*Math.PI/180))}`], `W = ${round(result)} J`, angle ? "[[diagram:force]]" : "");
    }
    if ((q.includes("resolve") || q.includes("component") || q.includes("horizontal") || q.includes("vertical")) && force && angle) {
      const rad=angle.value*Math.PI/180, fx=force.value*Math.cos(rad), fy=force.value*Math.sin(rad);
      return finish([`F = ${force.value} ${force.unit || "N"}`, `θ = ${angle.value}°`], "Horizontal and vertical components", "Fₓ = F cosθ; Fᵧ = F sinθ", [`Fₓ = ${force.value} cos ${angle.value}° = ${round(fx)} N`, `Fᵧ = ${force.value} sin ${angle.value}° = ${round(fy)} N`], `Fₓ = ${round(fx)} N and Fᵧ = ${round(fy)} N`, "[[diagram:force]]");
    }
    if ((q.includes("final velocity") || q.includes("final speed")) && initialV && acceleration && time) {
      const result=initialV.value+acceleration.value*time.value;
      return finish([`u = ${initialV.value} m/s`, `a = ${acceleration.value} m/s²`, `t = ${time.value} s`], "Final velocity, v", "v = u + at", [`v = ${initialV.value} + (${acceleration.value} × ${time.value})`], `v = ${round(result)} m/s`);
    }
    if ((q.includes("distance") || q.includes("displacement")) && initialV && acceleration && time) {
      const result=initialV.value*time.value+0.5*acceleration.value*time.value**2;
      return finish([`u = ${initialV.value} m/s`, `a = ${acceleration.value} m/s²`, `t = ${time.value} s`], "Displacement, s", "s = ut + ½at²", [`s = (${initialV.value} × ${time.value}) + ½ × ${acceleration.value} × (${time.value})²`], `s = ${round(result)} m`);
    }
    if ((q.includes("resistance") || q.includes("ohm")) && voltage && current) {
      const result=voltage.value/current.value;
      return finish([`V = ${voltage.value} V`, `I = ${current.value} A`], "Resistance, R", "V = IR, therefore R = V/I", [`R = ${voltage.value}/${current.value}`], `R = ${round(result)} Ω`);
    }
    if (q.includes("current") && voltage && resistance) {
      const result=voltage.value/resistance.value;
      return finish([`V = ${voltage.value} V`, `R = ${resistance.value} Ω`], "Current, I", "V = IR, therefore I = V/R", [`I = ${voltage.value}/${resistance.value}`], `I = ${round(result)} A`);
    }
    if (q.includes("power") && voltage && current) {
      const result=voltage.value*current.value;
      return finish([`V = ${voltage.value} V`, `I = ${current.value} A`], "Electric power, P", "P = VI", [`P = ${voltage.value} × ${current.value}`], `P = ${round(result)} W`);
    }
    if ((q.includes("wavelength") || q.includes("lambda")) && frequency && waveSpeed) {
      const result=waveSpeed.value/frequency.value;
      return finish([`v = ${waveSpeed.value} m/s`, `f = ${frequency.value} Hz`], "Wavelength, λ", "v = fλ, therefore λ = v/f", [`λ = ${waveSpeed.value}/${frequency.value}`], `λ = ${round(result)} m`);
    }
    if ((q.includes("frequency") || q.includes(" f ")) && wavelength && waveSpeed) {
      const result=waveSpeed.value/wavelength.value;
      return finish([`v = ${waveSpeed.value} m/s`, `λ = ${wavelength.value} m`], "Frequency, f", "v = fλ, therefore f = v/λ", [`f = ${waveSpeed.value}/${wavelength.value}`], `f = ${round(result)} Hz`);
    }
    if ((q.includes("heat") || q.includes("calor")) && mass && specificHeat && deltaT) {
      const result=mass.value*specificHeat.value*deltaT.value;
      return finish([`m = ${mass.value} kg`, `c = ${specificHeat.value} J/(kg K)`, `ΔT = ${deltaT.value} K`], "Heat supplied, Q", "Q = mcΔT", [`Q = ${mass.value} × ${specificHeat.value} × ${deltaT.value}`], `Q = ${round(result)} J`);
    }
    if (q.includes("power") && work && time) {
      const result=work.value/time.value;
      return finish([`W = ${work.value} J`, `t = ${time.value} s`], "Power, P", "P = W/t", [`P = ${work.value}/${time.value}`], `P = ${round(result)} W`);
    }
    return "";
  }

  function formulasResponse(entry) {
    const branch=physicsBranch(entry);
    if (!entry?.formulas?.length) return `${section("Branch",branch)}\n\n**${entry?.title || "Selected chapter"} — Key Principle**\n\n${(entry?.concepts || []).map(item => `• ${item}`).join("\n")}`;
    return `${section("Branch",branch)}\n\n${section("Principle",`Use the standard ${entry.title} relations with their stated assumptions and sign convention.`)}\n\n**Required Formulae:**\n${entry.formulas.map((formula,index) => `${index+1}. ${formula}`).join("\n")}\n\n**Final Check:** Convert every value to SI units before substitution and verify dimensions.`;
  }

  function conceptResponse(entry, query = "") {
    const branch=physicsBranch(entry);
    const expanded=semanticQuery(query);
    const words=wordSet(expanded);
    const ranked=(entry.concepts || []).map((item,index) => {
      const text=normalise(item);
      let score=index === 0 ? 0.05 : 0;
      words.forEach(word => { if (text.includes(word)) score += 1; });
      return {item,index,score};
    }).sort((a,b) => b.score-a.score || a.index-b.index);
    const focused=[
      {test:/\bresistance\b/i,text:"Electrical resistance is the opposition offered by a conductor to the flow of electric current; its SI unit is the ohm (Ω)."},
      {test:/\brefraction\b/i,text:"Refraction is the change in direction of light when its speed changes on passing from one transparent medium to another."},
      {test:/\bfrequency\b/i,text:"Frequency is the number of complete oscillations made per unit time; its SI unit is hertz (Hz), where 1 Hz = 1 s⁻¹."},
      {test:/\bwork function\b/i,text:"The work function φ is the minimum energy required to remove an electron from a material surface."},
      {test:/\bacceleration\b/i,text:"Acceleration is the rate of change of velocity with time; its SI unit is m/s²."}
    ].find(item => item.test.test(expanded))?.text;
    const concepts=[...new Set([focused,...ranked.map(result => result.item)].filter(Boolean))];
    return `${section("Branch",branch)}\n\n${section("Objective",`Understand the governing idea in ${entry.title}.`)}\n\n${section("Principle",concepts[0])}\n\n**Explanation:**\n${concepts.map((item,index) => `${index+1}. ${item}`).join("\n")}\n\n**Concept Check:** The explanation uses the closest verified local curriculum statements; consult the cited PDF page for the source wording and worked context.`;
  }

  function hintResponse(entry) {
    const relation = entry.formulas[0] || "the defining physical principle";
    return `${section("Branch",physicsBranch(entry))}\n\n**MCQ Hint — ${entry.title}**\n\nIdentify the quantities given and the quantity asked. Check dimensions and limiting cases, then test the options using **${relation}**. Eliminate any option with the wrong SI unit or direction. I have intentionally not revealed the final option.`;
  }

  function corpusEvidence(sources) {
    if (!sources?.length) return "";
    const excerpts=sources.slice(0,2).map((source,index) => `${index+1}. ${source.excerpt}`).join("\n\n");
    const equations=[...new Set(sources.flatMap(source => source.equations || []))].slice(0,4);
    const figures=[...new Set(sources.flatMap(source => source.figures || []))].slice(0,4);
    return [
      "**From the uploaded study material:**",
      excerpts,
      equations.length ? `**Machine-extracted equation candidates from the matched pages:**\n${equations.map(item => `• ${item}`).join("\n")}\nVerify symbols against the original cited page before using them.` : "",
      figures.length ? `**Figure references on the matched pages:** ${figures.join(", ")}. Open the cited page below to view the original diagram.` : ""
    ].filter(Boolean).join("\n\n");
  }

  async function corpusSources(query,context,entry) {
    if (!Corpus?.search || !/^Class (9|10|11|12)th$/.test(context.className || "")) return [];
    try {
      return await Corpus.search({query,className:context.className,chapter:context.chapter || entry?.title || "",limit:4});
    } catch {
      return [];
    }
  }

  async function answer({message, context = {}, history = []}) {
    const query = String(message || "").trim();
    const contextualAnswer=contextualSymbolResponse(query,history);
    const effectiveQuery=contextualQuery(query,history);
    const q = normalise(effectiveQuery);
    await new Promise(resolve => setTimeout(resolve, 80));
    if (contextualAnswer) {
      const contextualEntry=findChapter(effectiveQuery,context.className,context.chapter);
      const contextualSources=await corpusSources(effectiveQuery,context,contextualEntry);
      return {answer:`${contextualAnswer}\n\n${corpusEvidence(contextualSources)}`,source:contextualSources.length ? "offline-corpus" : "offline-kb",chapter:contextualEntry?.title,sources:contextualSources};
    }
    if (FRIENDLY_PATTERNS.test(query)) return {answer:friendlyResponse(query), source:"offline-conversation"};
    if (isGeneralKnowledge(query) && !isPhysicsQuery(query)) return {answer:generalKnowledgeResponse(query), source:"offline-general-knowledge"};
    const subject=detectSubject(effectiveQuery);
    if (["Chemistry","Biology","Mathematics"].includes(subject)) {
      const response=await academicResponse(subject,query);
      return {...response,source:`offline-${subject.toLowerCase()}`};
    }
    if (!subject) return {answer:friendlyResponse(query), source:"offline-conversation"};
    const entry = findChapter(effectiveQuery, context.className, context.chapter);
    const sources = await corpusSources(effectiveQuery,context,entry);
    const visual=requestedVisual(effectiveQuery);
    if (visual) {
      const originalNote=/original|from the pdf|pdf figure/i.test(query)
        ? (sources.length ? `**Original PDF page:** Open the verified source link below to view the original figure exactly as printed; it has not been redrawn or altered.` : `**Original figure limitation:** No verified source page was found in the searchable local index. The schematic below is a local textbook-style aid, not a claimed PDF figure.`)
        : "";
      return {answer:`${section("Branch",physicsBranch(effectiveQuery))}\n\n${section("Principle","Choose a clear physical system, mark the standard directions, and label every relevant quantity before applying equations.")}\n\n${originalNote}\n\n${visual}${/(equation|formula|relation|derive)/i.test(query) && entry?.formulas?.length ? `\n\n**Required Equations:**\n${entry.formulas.map((formula,index) => `${index+1}. ${formula}`).join("\n")}` : ""}\n\n${corpusEvidence(sources)}`,source:sources.length ? "offline-corpus" : "offline-kb",chapter:entry?.title,sources};
    }
    if (/(vector diagram|show.*force.*resolv|resolve.*force.*component)/i.test(query) && !/\d/.test(query)) {
      return {answer:`${section("Branch","Mechanics — Vector Resolution")}\n\n${section("Principle","Resolve a vector along mutually perpendicular axes without changing the original vector.")}\n\n**Resolution of a Force**\n\nFor a force F acting at an angle θ above the horizontal:\n\n• Horizontal component: Fₓ = F cosθ\n• Vertical component: Fᵧ = F sinθ\n\n[[diagram:force]]\n\n${corpusEvidence(sources)}`, source:"offline-corpus", chapter:"Motion in a Plane",sources};
    }
    const asksNumerical = /(calculate|find|solve|numerical|how much|determine|given)/i.test(query) || /\d/.test(query);
    if (asksNumerical) {
      const solved = solveNumerical(query);
      if (solved) return {answer:solved, source:"offline-solver", chapter:entry?.title,sources};
      return {answer:`**Insufficient information:** There is not enough verified information to calculate a unique numerical answer without guessing.\n\nPlease provide the known values, their units, the required quantity, and any stated conditions. I will not invent a formula, value, PDF passage or page reference.\n\n${corpusEvidence(sources)}`, source:sources.length ? "offline-corpus" : "offline-kb", chapter:entry?.title,sources};
    }
    if (/formula|relation|equation/i.test(q) || /give me the key formulas/i.test(q)) return {answer:`${formulasResponse(entry)}\n\n${corpusEvidence(sources)}`, source:"offline-corpus", chapter:entry?.title,sources};
    if (/mcq|hint|without revealing/i.test(q)) return {answer:`${hintResponse(entry)}\n\n${corpusEvidence(sources)}`, source:"offline-corpus", chapter:entry?.title,sources};
    if (/constant|value of/i.test(q)) {
      const matches = Object.entries(KB.constants).filter(([name]) => q.split(/\s+/).some(token => token.length > 2 && normalise(name).includes(token)));
      if (matches.length) return {answer:`**Standard constant values (SI):**\n\n${matches.map(([name,value]) => `• ${name} = ${value}`).join("\n")}\n\n${corpusEvidence(sources)}`, source:"offline-corpus", chapter:entry?.title,sources};
    }
    return {answer:`${conceptResponse(entry,effectiveQuery)}\n\n${corpusEvidence(sources)}`, source:sources.length ? "offline-corpus" : "offline-kb", chapter:entry?.title,sources};
  }

  return {answer, getChapters, solveNumerical, isPhysicsQuery, detectSubject, knowledgeBase:KB};
})();
