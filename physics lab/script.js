(function () {
  "use strict";

  const canvas = document.getElementById("simulationCanvas");
  const ctx = canvas.getContext("2d");
  const wrap = document.getElementById("canvasWrap");

  const controls = {
    u: document.getElementById("velocityInput"),
    h: document.getElementById("heightInput"),
    g: document.getElementById("gravityInput")
  };

  const outputs = {
    u: document.getElementById("velocityValue"),
    h: document.getElementById("heightValue"),
    g: document.getElementById("gravityValue"),
    time: document.getElementById("timeResult"),
    range: document.getElementById("rangeResult"),
    vertical: document.getElementById("verticalResult"),
    elapsed: document.getElementById("elapsedOutput"),
    timeline: document.getElementById("timelineFill"),
    status: document.getElementById("statusText"),
    statusPill: document.getElementById("statusPill"),
    givenU: document.getElementById("givenU"),
    givenH: document.getElementById("givenH"),
    givenG: document.getElementById("givenG"),
    timeWorking: document.getElementById("timeWorking"),
    rangeWorking: document.getElementById("rangeWorking"),
    verticalWorking: document.getElementById("verticalWorking"),
    answer: document.getElementById("answerValue")
  };

  const buttons = {
    start: document.getElementById("startBtn"),
    pause: document.getElementById("pauseBtn"),
    reset: document.getElementById("resetBtn"),
    replay: document.getElementById("replayBtn"),
    defaults: document.getElementById("defaultsBtn")
  };

  const state = {
    u: 2,
    h: 10,
    g: 9.8,
    flightTime: 0,
    range: 0,
    finalVy: 0,
    elapsed: 0,
    running: false,
    landed: false,
    lastFrame: 0,
    animationId: null
  };

  function calculate() {
    state.flightTime = Math.sqrt((2 * state.h) / state.g);
    state.range = state.u * state.flightTime;
    state.finalVy = state.g * state.flightTime;
  }

  function setRangeFill(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    input.style.setProperty("--fill", `${((value - min) / (max - min)) * 100}%`);
  }

  function updateReadout() {
    outputs.u.textContent = `${state.u.toFixed(1)} m/s`;
    outputs.h.textContent = `${state.h.toFixed(1)} m`;
    outputs.g.textContent = `${state.g.toFixed(1)} m/s²`;
    outputs.time.innerHTML = `${state.flightTime.toFixed(2)} <small>s</small>`;
    outputs.range.innerHTML = `${state.range.toFixed(2)} <small>m</small>`;
    outputs.vertical.innerHTML = `${state.finalVy.toFixed(2)} <small>m/s</small>`;
    outputs.givenU.textContent = `${state.u.toFixed(1)} m/s`;
    outputs.givenH.textContent = `${state.h.toFixed(1)} m`;
    outputs.givenG.textContent = `${state.g.toFixed(1)} m/s²`;
    outputs.timeWorking.textContent = `= √(${(2 * state.h).toFixed(1)} / ${state.g.toFixed(1)}) = ${state.flightTime.toFixed(2)} s`;
    outputs.rangeWorking.textContent = `= ${state.u.toFixed(1)} × ${state.flightTime.toFixed(2)} = ${state.range.toFixed(2)} m`;
    outputs.verticalWorking.textContent = `= ${state.g.toFixed(1)} × ${state.flightTime.toFixed(2)} = ${state.finalVy.toFixed(2)} m/s`;
    outputs.answer.textContent = state.range.toFixed(2);
    updateProgress();
  }

  function updateProgress() {
    const progress = state.flightTime ? Math.min(state.elapsed / state.flightTime, 1) : 0;
    outputs.elapsed.textContent = `${state.elapsed.toFixed(2)} s`;
    outputs.timeline.style.width = `${progress * 100}%`;
  }

  function setStatus(status) {
    outputs.status.textContent = status;
    outputs.statusPill.classList.toggle("running", status === "In flight");
    outputs.statusPill.classList.toggle("landed", status === "Landed");
  }

  function setButtonState() {
    buttons.start.disabled = state.running || state.landed;
    buttons.pause.disabled = !state.running;
  }

  function resetMotion() {
    state.running = false;
    state.landed = false;
    state.elapsed = 0;
    state.lastFrame = 0;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.animationId = null;
    setStatus("Ready");
    setButtonState();
    updateProgress();
    draw();
  }

  function start() {
    if (state.running || state.landed) return;
    state.running = true;
    state.lastFrame = 0;
    setStatus("In flight");
    setButtonState();
    state.animationId = requestAnimationFrame(animate);
  }

  function pause() {
    if (!state.running) return;
    state.running = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.animationId = null;
    setStatus("Paused");
    setButtonState();
    draw();
  }

  function replay() {
    resetMotion();
    start();
  }

  function animate(timestamp) {
    if (!state.running) return;
    if (!state.lastFrame) state.lastFrame = timestamp;
    const delta = Math.min((timestamp - state.lastFrame) / 1000, 0.05);
    state.lastFrame = timestamp;
    state.elapsed = Math.min(state.elapsed + delta, state.flightTime);

    if (state.elapsed >= state.flightTime) {
      state.running = false;
      state.landed = true;
      setStatus("Landed");
      setButtonState();
      updateProgress();
      draw();
      state.animationId = null;
      return;
    }

    updateProgress();
    draw();
    state.animationId = requestAnimationFrame(animate);
  }

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
  }

  function line(x1, y1, x2, y2, color, width, dash) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function arrow(x1, y1, x2, y2, color, width) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    line(x1, y1, x2, y2, color, width);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function label(text, x, y, options) {
    const opts = options || {};
    ctx.font = opts.font || "600 12px Inter, system-ui, sans-serif";
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = opts.baseline || "alphabetic";
    ctx.fillStyle = opts.color || "#9db0c2";
    ctx.fillText(text, x, y);
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);

    const groundY = height - Math.max(40, height * 0.11);
    const towerX = Math.max(70, width * 0.12);
    const maxVisualHeight = groundY - 48;
    const towerHeight = Math.min(maxVisualHeight, Math.max(145, state.h / 30 * maxVisualHeight));
    const topY = groundY - towerHeight;
    const towerWidth = Math.max(46, Math.min(70, width * 0.075));
    const launchX = towerX + towerWidth;
    const rightPadding = Math.max(62, width * 0.08);
    const usableRangeWidth = width - launchX - rightPadding;
    const rangeScale = usableRangeWidth / Math.max(state.range, 3.2);
    const landingX = launchX + state.range * rangeScale;

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0b1c2d");
    bg.addColorStop(.72, "#0a1827");
    bg.addColorStop(1, "#0b1a22");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(133, 163, 192, .065)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 36) line(x, 0, x, groundY, "rgba(133,163,192,.055)", 1);
    for (let y = groundY % 36; y < groundY; y += 36) line(0, y, width, y, "rgba(133,163,192,.055)", 1);

    const glow = ctx.createRadialGradient(landingX, groundY, 0, landingX, groundY, Math.min(180, width * .28));
    glow.addColorStop(0, "rgba(255, 203, 103, .08)");
    glow.addColorStop(1, "rgba(255, 203, 103, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(Math.max(0, landingX - 180), Math.max(0, groundY - 180), 360, 220);

    ctx.fillStyle = "#102b2b";
    ctx.fillRect(0, groundY, width, height - groundY);
    line(0, groundY, width, groundY, "#65e4c0", 2);
    for (let x = -10; x < width + 20; x += 18) line(x, groundY + 12, x + 11, groundY, "rgba(101,228,192,.2)", 1);
    label("GROUND", width - 15, groundY + 27, { align: "right", color: "rgba(101,228,192,.65)", font: "800 10px Inter, system-ui" });

    const towerGradient = ctx.createLinearGradient(towerX, topY, towerX + towerWidth, topY);
    towerGradient.addColorStop(0, "#293b4c");
    towerGradient.addColorStop(1, "#172839");
    ctx.fillStyle = towerGradient;
    ctx.fillRect(towerX, topY, towerWidth, groundY - topY);
    line(towerX, topY, towerX + towerWidth + 7, topY, "#b5c6d5", 4);
    line(towerX + towerWidth, topY, towerX + towerWidth, groundY, "rgba(167,190,209,.22)", 1);
    for (let y = topY + 30; y < groundY - 14; y += 34) {
      ctx.fillStyle = "rgba(118,168,255,.22)";
      ctx.fillRect(towerX + 13, y, 13, 9);
      ctx.fillRect(towerX + towerWidth - 26, y, 13, 9);
    }

    const measureX = towerX - 23;
    line(measureX, topY, measureX, groundY, "rgba(101,228,192,.68)", 1.5);
    line(measureX - 5, topY, measureX + 5, topY, "rgba(101,228,192,.68)", 1.5);
    line(measureX - 5, groundY, measureX + 5, groundY, "rgba(101,228,192,.68)", 1.5);
    ctx.save();
    ctx.translate(measureX - 10, (topY + groundY) / 2);
    ctx.rotate(-Math.PI / 2);
    label(`h = ${state.h.toFixed(1)} m`, 0, 0, { align: "center", baseline: "middle", color: "#86eed1", font: "700 11px Inter, system-ui" });
    ctx.restore();

    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const t = state.flightTime * (i / 80);
      const x = launchX + state.u * t * rangeScale;
      const y = topY + 0.5 * state.g * t * t * (towerHeight / state.h);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(255, 203, 103, .72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    line(launchX, groundY + 18, landingX, groundY + 18, "rgba(255,203,103,.75)", 1.5);
    line(launchX, groundY + 12, launchX, groundY + 24, "rgba(255,203,103,.75)", 1.5);
    line(landingX, groundY + 12, landingX, groundY + 24, "rgba(255,203,103,.75)", 1.5);
    label(`R = ${state.range.toFixed(2)} m`, (launchX + landingX) / 2, groundY + 35, { align: "center", color: "#ffcb67", font: "800 11px Inter, system-ui" });

    const currentT = Math.min(state.elapsed, state.flightTime);
    const particleX = launchX + state.u * currentT * rangeScale;
    const particleY = topY + 0.5 * state.g * currentT * currentT * (towerHeight / state.h);
    const velocityY = state.g * currentT;
    const dirX = state.u;
    const dirY = velocityY;
    const dirLength = Math.hypot(dirX, dirY) || 1;
    const arrowLength = Math.min(70, Math.max(48, width * .065));
    const arrowX = particleX + (dirX / dirLength) * arrowLength;
    const arrowY = particleY + (dirY / dirLength) * arrowLength;

    if (currentT === 0) {
      arrow(particleX + 10, particleY, particleX + Math.min(74, usableRangeWidth * .22), particleY, "#76a8ff", 2.5);
      label(`u = ${state.u.toFixed(1)} m/s`, particleX + 18, particleY - 12, { color: "#9fc0ff", font: "700 11px Inter, system-ui" });
    } else {
      arrow(particleX + 8, particleY + 2, arrowX, arrowY, "#76a8ff", 2.5);
      label("v", arrowX + 5, arrowY, { color: "#9fc0ff", font: "italic 700 12px Georgia" });
    }

    ctx.beginPath();
    ctx.arc(particleX, particleY, 13, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 203, 103, .13)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(particleX, particleY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffcb67";
    ctx.shadowColor = "rgba(255,203,103,.7)";
    ctx.shadowBlur = 13;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (state.landed) {
      ctx.beginPath();
      ctx.ellipse(landingX, groundY + 2, 18, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,203,103,.24)";
      ctx.fill();
    }
  }

  function syncFromControls() {
    state.u = Number(controls.u.value);
    state.h = Number(controls.h.value);
    state.g = Number(controls.g.value);
    Object.values(controls).forEach(setRangeFill);
    calculate();
    resetMotion();
    updateReadout();
    draw();
  }

  Object.values(controls).forEach(function (control) {
    control.addEventListener("input", syncFromControls);
  });

  buttons.start.addEventListener("click", start);
  buttons.pause.addEventListener("click", pause);
  buttons.reset.addEventListener("click", resetMotion);
  buttons.replay.addEventListener("click", replay);
  buttons.defaults.addEventListener("click", function () {
    controls.u.value = "2";
    controls.h.value = "10";
    controls.g.value = "9.8";
    syncFromControls();
  });

  window.addEventListener("resize", resizeCanvas);
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(wrap);

  calculate();
  Object.values(controls).forEach(setRangeFill);
  updateReadout();
  setButtonState();
  resizeCanvas();
})();
