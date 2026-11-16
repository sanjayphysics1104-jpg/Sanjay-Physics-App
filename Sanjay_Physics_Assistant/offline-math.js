"use strict";

window.SanjayOfflineMath = (() => {
  const replacements = [
    [/×/g,"\\times "],[/·/g,"\\cdot "],[/√/g,"\\sqrt"],[/π/g,"\\pi "],[/θ/g,"\\theta "],[/λ/g,"\\lambda "],
    [/Δ/g,"\\Delta "],[/Φ/g,"\\Phi "],[/ω/g,"\\omega "],[/Ω/g,"\\Omega "],[/μ/g,"\\mu "],[/ε/g,"\\varepsilon "],
    [/₀/g,"_0"],[/₁/g,"_1"],[/₂/g,"_2"],[/₃/g,"_3"],[/ₓ/g,"_x"],[/ᵧ/g,"_y"],[/ₚ/g,"_p"],[/ₛ/g,"_s"],
    [/²/g,"^2"],[/³/g,"^3"],[/⁻¹/g,"^{-1}"],[/≤/g,"\\le "],[/≥/g,"\\ge "],[/≈/g,"\\approx "],[/→/g,"\\to "]
  ];

  function toLatex(value) {
    let output=String(value || "").replace(/^\s*[-•]\s*/,"").trim();
    replacements.forEach(([pattern,replacement]) => { output=output.replace(pattern,replacement); });
    return output.replace(/\b(sin|cos|tan|log|ln)\b/g,"\\$1");
  }

  function renderFormula(element,value,{displayMode=false}={}) {
    if (!element) return;
    const source=String(value || "").trim();
    element.dataset.mathSource=source;
    if (!source) return;
    if (window.katex?.render) {
      try {
        window.katex.render(toLatex(source),element,{displayMode,throwOnError:false,strict:"ignore",trust:false,output:"html"});
        element.classList.add("spa-math-rendered");
        return;
      } catch {}
    }
    element.textContent=source;
  }

  function renderWithin(root) {
    if (!root) return;
    root.querySelectorAll("[data-spa-math]").forEach(element => renderFormula(element,element.dataset.spaMath || element.textContent,{displayMode:element.dataset.mathDisplay === "true"}));
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(root,{delimiters:[{left:"$$",right:"$$",display:true},{left:"\\(",right:"\\)",display:false}],throwOnError:false,strict:"ignore"});
      } catch {}
    }
  }

  return {renderFormula,renderWithin,toLatex};
})();
