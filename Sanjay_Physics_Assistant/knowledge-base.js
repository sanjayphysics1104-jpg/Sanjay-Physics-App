"use strict";

/*
 * Sanjay Physics Assistant — compact offline curriculum pack.
 * Each entry keeps only the high-value concepts and equations needed by the
 * local search/answer engine. Symbols follow NCERT/CBSE/JEE/NEET convention.
 */
window.SANJAY_PHYSICS_KB = (() => {
  const chapter = (title, concepts, formulas = [], keywords = []) => ({title, concepts, formulas, keywords});
  const classes = {
    "Class 6th": [
      chapter("Motion and Measurement of Distances", ["Motion is a change in position with time.", "SI unit of length is metre (m).", "Motion may be rectilinear, circular or periodic."], ["speed = distance ÷ time"], ["measurement","motion","speed"]),
      chapter("Light, Shadows and Reflections", ["Light travels in straight lines in a uniform medium.", "An opaque object forms a shadow when it blocks light.", "A plane mirror forms a virtual, erect image of the same size."], ["angle of incidence = angle of reflection"], ["light","shadow","mirror"]),
      chapter("Electricity and Circuits", ["A closed conducting path is an electric circuit.", "A cell supplies electrical energy; a switch opens or closes the circuit.", "Conductors allow current; insulators oppose it."], [], ["cell","bulb","circuit","conductor"]),
      chapter("Fun with Magnets", ["Like poles repel and unlike poles attract.", "A freely suspended magnet aligns approximately north–south.", "Magnetic poles always occur in pairs."], [], ["magnet","pole","compass"])
    ],
    "Class 7th": [
      chapter("Motion and Time", ["Speed tells how fast an object moves.", "Uniform motion covers equal distances in equal intervals.", "A distance–time graph for uniform motion is a straight line."], ["v = s/t", "average speed = total distance/total time"], ["speed","time","graph","pendulum"]),
      chapter("Heat", ["Heat flows from a hotter body to a colder body.", "Conduction dominates in solids, convection in fluids and radiation needs no medium.", "Temperature is measured using a thermometer."], ["temperature in K = temperature in °C + 273.15"], ["heat","temperature","conduction","convection","radiation"]),
      chapter("Electric Current and Its Effects", ["Current produces heating and magnetic effects.", "A fuse protects a circuit by melting when current is excessive.", "An electromagnet is a current-carrying coil with a soft-iron core."], ["heating effect ∝ I²Rt"], ["current","fuse","electromagnet","heating"]),
      chapter("Light", ["Reflection changes the direction of light at a surface.", "White light can split into seven colours.", "A convex lens can form real or virtual images depending on object position."], ["∠i = ∠r"], ["reflection","lens","spectrum"])
    ],
    "Class 8th": [
      chapter("Force and Pressure", ["Force is a push or pull and can change motion or shape.", "Pressure is normal force per unit area.", "Liquids exert pressure in all directions."], ["P = F/A"], ["force","pressure","thrust"]),
      chapter("Friction", ["Friction opposes relative motion or its tendency.", "Static friction is self-adjusting up to limiting friction.", "Rolling friction is generally smaller than sliding friction."], ["fₗ = μN"], ["friction","coefficient","rolling","sliding"]),
      chapter("Sound", ["Sound is produced by vibrating objects.", "Pitch depends mainly on frequency; loudness depends mainly on amplitude.", "Human audible range is approximately 20 Hz to 20 kHz."], ["v = fλ", "T = 1/f"], ["sound","frequency","pitch","amplitude"]),
      chapter("Chemical Effects of Electric Current", ["Some liquids conduct current through ions.", "Electroplating deposits a metal layer using electric current."], ["Q = It"], ["electrolysis","electroplating","current"]),
      chapter("Light", ["Regular reflection occurs from smooth surfaces; diffused reflection from rough surfaces.", "The eye forms an image on the retina.", "Multiple reflection is used in periscopes and kaleidoscopes."], ["∠i = ∠r"], ["eye","reflection","periscope"]),
      chapter("Some Natural Phenomena", ["Lightning is a large electric discharge.", "Earthquakes originate near a focus and are recorded by a seismograph."], [], ["lightning","earthquake","charge"])
    ],
    "Class 9th": [
      chapter("Motion", ["Distance is path length; displacement is the shortest directed change in position.", "Velocity is rate of change of displacement; acceleration is rate of change of velocity.", "The slope of a displacement–time graph gives velocity; area under a velocity–time graph gives displacement."], ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "average speed = total distance/total time"], ["kinematics","velocity","acceleration","equations of motion"]),
      chapter("Force and Laws of Motion", ["Newton's first law expresses inertia.", "Newton's second law gives force as rate of change of momentum.", "Action and reaction are equal and opposite and act on different bodies."], ["p = mv", "F = ma", "impulse J = Δp"], ["newton","force","momentum","inertia"]),
      chapter("Gravitation", ["Every mass attracts every other mass.", "Free-fall acceleration near Earth is g ≈ 9.8 m/s².", "Buoyant force equals the weight of displaced fluid."], ["F = Gm₁m₂/r²", "W = mg", "P = F/A", "density ρ = m/V"], ["gravity","weight","buoyancy","density"]),
      chapter("Work and Energy", ["Work is done when force produces displacement.", "Kinetic energy is energy of motion; potential energy is energy due to position.", "Total energy remains conserved in an isolated system."], ["W = Fs cosθ", "K = ½mv²", "U = mgh", "P = W/t"], ["work","energy","power"]),
      chapter("Sound", ["Sound in air is a longitudinal mechanical wave.", "Frequency determines pitch; amplitude relates to loudness.", "An echo is a reflected sound heard separately."], ["v = fλ", "T = 1/f", "echo distance = vt/2"], ["sound","wave","echo"])
    ],
    "Class 10th": [
      chapter("Light – Reflection and Refraction", ["Reflection obeys ∠i = ∠r.", "Refraction occurs because light speed changes between media.", "Use the Cartesian sign convention for mirrors and lenses."], ["1/f = 1/v + 1/u (mirror)", "1/f = 1/v − 1/u (lens)", "m = −v/u (mirror)", "m = v/u (lens)", "n = c/v"], ["mirror","lens","refraction","magnification"]),
      chapter("The Human Eye and the Colourful World", ["The eye changes focal length by accommodation.", "Myopia is corrected by a concave lens; hypermetropia by a convex lens.", "Scattering explains the blue sky and reddish sunrise/sunset."], ["power P = 1/f, with f in metre"], ["eye","myopia","hypermetropia","dispersion","scattering"]),
      chapter("Electricity", ["Current is charge flow per unit time.", "Ohm's law states V ∝ I at constant physical conditions.", "Series resistance adds; parallel conductance adds."], ["I = Q/t", "V = IR", "Rₛ = R₁ + R₂ + …", "1/Rₚ = 1/R₁ + 1/R₂ + …", "P = VI = I²R = V²/R", "E = Pt"], ["ohm","current","resistance","power"]),
      chapter("Magnetic Effects of Electric Current", ["A current produces a magnetic field.", "Fleming's left-hand rule gives motor-force direction.", "Electromagnetic induction produces current when magnetic flux changes."], ["F = BIl sinθ"], ["magnetic field","motor","generator","solenoid"]),
      chapter("Sources of Energy", ["A useful source should have high energy density, convenient storage and low environmental impact.", "Solar and wind are renewable; fossil fuels are non-renewable."], ["efficiency η = useful output/input × 100%"], ["renewable","solar","wind","efficiency"])
    ],
    "Class 11th": [
      chapter("Units and Measurements", ["Physical quantities are written as numerical value × unit.", "Significant figures express measurement precision.", "Dimensional analysis checks homogeneity but not numerical constants."], ["percentage error = absolute error/mean value × 100%", "[force] = MLT⁻²"], ["units","dimensions","errors","significant figures"]),
      chapter("Motion in a Straight Line", ["Position specifies location; velocity is dx/dt and acceleration is dv/dt.", "Uniform acceleration gives the standard kinematic equations."], ["v = u + at", "s = ut + ½at²", "v² = u² + 2as"], ["one dimensional motion","kinematics"]),
      chapter("Motion in a Plane", ["A vector has magnitude and direction.", "Projectile horizontal motion is uniform while vertical motion is accelerated by gravity.", "For a force F at angle θ: Fₓ = F cosθ and Fᵧ = F sinθ."], ["R = u²sin2θ/g", "H = u²sin²θ/(2g)", "T = 2u sinθ/g", "Fₓ = F cosθ", "Fᵧ = F sinθ"], ["vector","projectile","components","relative velocity"]),
      chapter("Laws of Motion", ["Net external force changes momentum.", "Friction acts tangentially and opposes relative motion or tendency.", "A free-body diagram includes only forces acting on the chosen body."], ["F = ma", "fₛ ≤ μₛN", "fₖ = μₖN", "Fₓ = F cosθ", "Fᵧ = F sinθ"], ["newton","friction","inclined plane","free body diagram"]),
      chapter("Work, Energy and Power", ["Work is the line integral of force along displacement.", "The work–energy theorem states Wnet = ΔK.", "Mechanical energy is conserved for conservative forces."], ["W = Fs cosθ", "K = ½mv²", "U = mgh", "P = dW/dt = F·v"], ["work","energy","power","collision"]),
      chapter("System of Particles and Rotational Motion", ["Centre of mass represents mass-weighted position.", "Torque changes angular momentum.", "Moment of inertia is rotational inertia about an axis."], ["rCM = Σmᵢrᵢ/Σmᵢ", "τ = r × F", "L = Iω", "Krot = ½Iω²", "τ = Iα"], ["rotation","torque","angular momentum","centre of mass"]),
      chapter("Gravitation", ["Gravitational force follows the inverse-square law.", "Gravitational potential is work per unit mass.", "A satellite's orbital speed depends on orbital radius."], ["F = Gm₁m₂/r²", "g = GM/R²", "V = −GM/r", "vₒ = √(GM/r)", "vₑ = √(2GM/R)"], ["gravity","satellite","escape velocity"]),
      chapter("Mechanical Properties of Solids", ["Stress is restoring force per area; strain is fractional deformation.", "Within elastic limit, stress is proportional to strain."], ["Y = longitudinal stress/longitudinal strain", "energy density = ½ × stress × strain"], ["elasticity","young modulus","stress","strain"]),
      chapter("Mechanical Properties of Fluids", ["Pressure at the same depth in a static fluid is equal.", "Bernoulli's equation expresses energy conservation in steady ideal flow.", "Viscosity η opposes relative motion between fluid layers."], ["P = P₀ + ρgh", "A₁v₁ = A₂v₂", "P + ½ρv² + ρgh = constant", "F = 6πηrv"], ["fluid","viscosity","bernoulli","surface tension"]),
      chapter("Thermal Properties of Matter", ["Heat changes temperature or phase.", "Thermal expansion depends on material and temperature change.", "Calorimetry uses heat lost = heat gained for an isolated system."], ["Q = mcΔT", "Q = mL", "ΔL = αLΔT"], ["heat","calorimetry","expansion"]),
      chapter("Thermodynamics", ["The zeroth law defines thermal equilibrium.", "The first law is energy conservation: heat supplied changes internal energy and/or does work.", "No heat engine can convert all absorbed heat into work in a cycle."], ["ΔQ = ΔU + ΔW", "PV = nRT", "η = W/QH"], ["thermodynamics","isothermal","adiabatic","heat engine"]),
      chapter("Kinetic Theory", ["Gas pressure arises from molecular collisions.", "Absolute temperature measures average translational kinetic energy."], ["PV = nRT", "average K = 3kT/2", "vᵣₘₛ = √(3RT/M)"], ["gas","kinetic theory","rms speed"]),
      chapter("Oscillations", ["SHM acceleration is proportional and opposite to displacement.", "Total mechanical energy in ideal SHM is constant."], ["a = −ω²x", "x = A sin(ωt + φ)", "Tspring = 2π√(m/k)", "Tpendulum = 2π√(l/g)"], ["shm","oscillation","pendulum","spring"]),
      chapter("Waves", ["A wave transfers energy without net transport of matter.", "Superposition produces interference and standing waves."], ["v = fλ", "y = A sin(kx − ωt + φ)", "vstring = √(T/μ)"], ["wave","frequency","wavelength","doppler"])
    ],
    "Class 12th": [
      chapter("Electric Charges and Fields", ["Charge is conserved and quantised.", "Electric field is force per unit positive test charge.", "Gauss's law relates electric flux to enclosed charge."], ["F = kq₁q₂/r²", "E = F/q = kQ/r²", "ΦE = qenc/ε₀"], ["charge","coulomb","electric field","gauss"]),
      chapter("Electrostatic Potential and Capacitance", ["Potential difference is work per unit charge.", "A capacitor stores charge and electrostatic energy.", "A dielectric increases capacitance."], ["V = W/q", "C = Q/V", "Cparallel = ΣC", "1/Cseries = Σ1/C", "U = ½CV² = Q²/(2C)"], ["potential","capacitor","dielectric"]),
      chapter("Current Electricity", ["Drift of charge carriers produces electric current.", "Kirchhoff's junction and loop rules express charge and energy conservation.", "A potentiometer compares emf without drawing current at balance."], ["I = nqAvd", "V = IR", "R = ρl/A", "Vterminal = ε − Ir", "P = VI"], ["current","kirchhoff","potentiometer","resistivity"]),
      chapter("Moving Charges and Magnetism", ["A moving charge experiences magnetic Lorentz force.", "Biot–Savart and Ampere laws calculate magnetic fields due to currents."], ["F = q(v × B)", "F = BIl sinθ", "Bwire = μ₀I/(2πr)", "r = mv/(qB)"], ["magnetic force","biot savart","cyclotron"]),
      chapter("Magnetism and Matter", ["A bar magnet behaves approximately like a magnetic dipole.", "Materials may be diamagnetic, paramagnetic or ferromagnetic."], ["τ = mB sinθ", "U = −m·B"], ["dipole","magnetisation","earth magnetism"]),
      chapter("Electromagnetic Induction", ["Changing magnetic flux induces emf.", "Lenz's law makes the induced effect oppose the change causing it."], ["ΦB = BA cosθ", "ε = −dΦB/dt", "Uinductor = ½LI²"], ["faraday","lenz","inductance"]),
      chapter("Alternating Current", ["AC reverses direction periodically.", "RMS values give the same heating effect as equivalent DC.", "At resonance in series LCR, XL = XC."], ["Vrms = V₀/√2", "Irms = I₀/√2", "XL = ωL", "XC = 1/(ωC)", "Z = √(R² + (XL−XC)²)", "f₀ = 1/(2π√LC)"], ["ac","rms","impedance","resonance","transformer"]),
      chapter("Electromagnetic Waves", ["Accelerating charges produce electromagnetic waves.", "Electric and magnetic fields are mutually perpendicular and transverse to propagation."], ["c = 1/√(μ₀ε₀)", "c = fλ"], ["electromagnetic spectrum","radio","microwave","x ray"]),
      chapter("Ray Optics and Optical Instruments", ["Geometrical optics models light as rays.", "Total internal reflection occurs above the critical angle from denser to rarer medium.", "Optical instruments use combinations of lenses."], ["n₁sin i = n₂sin r", "1/f = 1/v − 1/u", "P = 1/f", "sin C = nrarer/ndenser"], ["ray optics","lens","prism","microscope","telescope"]),
      chapter("Wave Optics", ["Huygens' principle constructs wavefronts.", "Coherent superposition gives interference.", "Diffraction is appreciable when aperture size is comparable to wavelength."], ["β = λD/d", "path difference = d sinθ", "a sinθ = nλ (minima)"], ["interference","young double slit","diffraction","polarisation"]),
      chapter("Dual Nature of Radiation and Matter", ["Light shows wave and particle behaviour.", "Photoelectric emission depends on frequency above threshold, not intensity alone.", "Matter particles have de Broglie wavelength."], ["Kmax = hν − φ = eV₀", "λ = h/p"], ["photoelectric","de broglie","photon"]),
      chapter("Atoms", ["Bohr's model quantises angular momentum and allowed hydrogen energies.", "Spectral lines arise from transitions between stationary states."], ["En = −13.6/n² eV", "hν = Ei − Ef", "rn = n²a₀/Z"], ["bohr","hydrogen","spectrum"]),
      chapter("Nuclei", ["Nuclear radius varies as A^(1/3).", "Mass defect corresponds to binding energy.", "Radioactive decay is random for one nucleus but predictable statistically."], ["R = R₀A^(1/3)", "E = Δmc²", "N = N₀e^(−λt)", "T½ = ln2/λ"], ["nucleus","radioactivity","binding energy","fission","fusion"]),
      chapter("Semiconductor Electronics", ["Intrinsic semiconductors contain thermally generated electron–hole pairs.", "Doping produces n-type or p-type material.", "A p–n junction diode conducts strongly in forward bias."], ["I ≈ I₀(e^(V/ηVT) − 1)", "transistor current: IE = IC + IB"], ["semiconductor","diode","transistor","logic gate"])
    ]
  };

  classes["JEE / NEET"] = [
    chapter("Mechanics", ["Combine vector kinematics, Newton's laws, work–energy, momentum, rotation and gravitation.", "JEE problems often require multi-concept modelling; NEET emphasises fast application with unit checks."], ["v = u + at", "F = ma", "Wnet = ΔK", "Σpinitial = Σpfinal", "τ = Iα", "F = Gm₁m₂/r²"], ["jee mechanics","neet mechanics","collision","rotation"]),
    chapter("Properties of Matter and Fluids", ["Elasticity, surface tension, viscosity and fluid flow connect microscopic interactions with bulk response."], ["stress = Y × strain", "P + ½ρv² + ρgh = constant", "FStokes = 6πηrv"], ["fluid","viscosity","elasticity"]),
    chapter("Thermal Physics", ["Use calorimetry, kinetic theory and thermodynamic process relations with a clear system boundary."], ["Q = mcΔT", "PV = nRT", "ΔQ = ΔU + ΔW", "vᵣₘₛ = √(3RT/M)"], ["heat","thermodynamics","kinetic theory"]),
    chapter("Oscillations and Waves", ["SHM is the projection of uniform circular motion; waves obey superposition."], ["a = −ω²x", "T = 2π√(m/k)", "v = fλ"], ["shm","waves","doppler"]),
    chapter("Electrostatics and Capacitance", ["Exploit symmetry before applying Coulomb's law or Gauss's law; track energy during capacitor combinations."], ["E = kQ/r²", "Φ = q/ε₀", "C = Q/V", "U = ½CV²"], ["electrostatics","gauss","capacitor"]),
    chapter("Current Electricity", ["Reduce networks using symmetry and Kirchhoff rules; distinguish emf from terminal voltage."], ["V = IR", "R = ρl/A", "ΣI = 0", "ΣΔV = 0"], ["resistor network","kirchhoff","meter bridge"]),
    chapter("Magnetism and EMI", ["Use right-hand rules consistently for fields and Lenz's law for induced current."], ["F = qvB sinθ", "B = μ₀I/(2πr)", "ε = −dΦ/dt"], ["magnetism","emi","inductor"]),
    chapter("Optics", ["Apply Cartesian sign convention in ray optics and path/phase difference in wave optics."], ["1/f = 1/v − 1/u", "n₁sin i = n₂sin r", "β = λD/d"], ["ray optics","wave optics","ydse"]),
    chapter("Modern Physics", ["Modern physics connects photons, matter waves, atoms, nuclei and semiconductors."], ["E = hν", "λ = h/p", "En = −13.6/n² eV", "E = Δmc²", "N = N₀e^(−λt)"], ["modern physics","atom","nucleus","photoelectric"]),
    chapter("Experimental Physics and Errors", ["Report measurements with correct significant figures and combine independent errors appropriately."], ["fractional error in product = sum of fractional errors", "least count = one main-scale division/number of vernier divisions"], ["error","experiment","vernier","screw gauge"])
  ];

  const constants = {
    "speed of light c": "3.00 × 10⁸ m/s", "gravitational constant G": "6.67 × 10⁻¹¹ N m²/kg²",
    "acceleration due to gravity g": "9.8 m/s² (use 10 m/s² when stated)", "Planck constant h": "6.626 × 10⁻³⁴ J s",
    "elementary charge e": "1.602 × 10⁻¹⁹ C", "vacuum permittivity ε₀": "8.854 × 10⁻¹² C²/(N m²)",
    "vacuum permeability μ₀": "4π × 10⁻⁷ T m/A", "Boltzmann constant k": "1.381 × 10⁻²³ J/K"
  };

  return {name:"Sanjay Physics Assistant", version:1, conventions:{board:"NCERT/CBSE/Indian State Boards", exams:["JEE","NEET"], units:"SI"}, classes, constants};
})();
