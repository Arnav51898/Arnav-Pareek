(() => {
  "use strict";

  // ---------- Basic elements ----------
  const progressBar = document.getElementById("scrollProgress");
  const yearEl = document.getElementById("year");
  const mainContent = document.getElementById("mainContent");

  yearEl.textContent = new Date().getFullYear();

  // ---------- Magnetic hover ----------
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.11}px, ${y * 0.11}px)`;
      el.style.transition = "transform .2s cubic-bezier(.2,.8,.2,1)";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0,0)";
      el.style.transition = "transform .45s cubic-bezier(.2,.8,.2,1)";
    });
  });

  // ---------- Tilt interaction ----------
  document.querySelectorAll(".tilt, .lift").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = -py * 6.5;
      const ry = px * 8;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      el.style.transition = "transform .55s cubic-bezier(.2,.8,.2,1)";
    });
  });

  // ---------- Reveal on scroll ----------
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("show");
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  // ---------- Counters ----------
  const countObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = Number(el.dataset.count || 0);
      let n = 0;
      const step = Math.max(1, Math.floor(target / 60));
      function tick() {
        n += step;
        if (n >= target) {
          el.textContent = target;
        } else {
          el.textContent = n;
          requestAnimationFrame(tick);
        }
      }
      tick();
      obs.unobserve(el);
    });
  }, { threshold: 0.65 });

  document.querySelectorAll("[data-count]").forEach((el) => countObs.observe(el));

  // ---------- Atmosphere layers parallax ----------
  const layerFar = document.querySelector(".layer-far");
  const layerMid = document.querySelector(".layer-mid");
  const layerNear = document.querySelector(".layer-near");

  // ---------- Particles ----------
  const particleCanvas = document.getElementById("particles");
  const pctx = particleCanvas.getContext("2d");
  let pw = 0, ph = 0, particles = [];
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const particleCount = isMobile ? 40 : 95;

  function resizeParticles() {
    pw = particleCanvas.width = window.innerWidth;
    ph = particleCanvas.height = window.innerHeight;
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * pw,
      y: Math.random() * ph,
      r: Math.random() * 1.8 + 0.35,
      vx: Math.random() * 0.32 + 0.06,
      vy: -(Math.random() * 0.14 + 0.03),
      o: Math.random() * 0.45 + 0.18
    }));
  }

  function drawParticles() {
    pctx.clearRect(0, 0, pw, ph);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > pw + 20 || p.y < -20) {
        p.x = -12;
        p.y = ph + Math.random() * 40;
      }
      pctx.beginPath();
      pctx.fillStyle = `rgba(232,245,255,${p.o})`;
      pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pctx.fill();
    });
    requestAnimationFrame(drawParticles);
  }

  // ---------- Flight path + aircraft ----------
  const aircraft = document.getElementById("aircraft");
  const lightLeft = document.getElementById("lightLeft");
  const lightRight = document.getElementById("lightRight");
  const journeyPath = document.getElementById("journeyPath");
  const pathVisible = document.getElementById("pathVisible");
  const pathWideGlow = document.getElementById("pathWideGlow");
  const contrailCanvas = document.getElementById("contrailCanvas");
  const tctx = contrailCanvas.getContext("2d");

  pathVisible.setAttribute("d", journeyPath.getAttribute("d"));
  pathWideGlow.setAttribute("d", journeyPath.getAttribute("d"));

  let totalLen = 0;
  try { totalLen = journeyPath.getTotalLength(); } catch { totalLen = 0; }

  let cw = 0, ch = 0;
  function resizeContrail() {
    cw = contrailCanvas.width = window.innerWidth;
    ch = contrailCanvas.height = window.innerHeight;
  }

  // For contrail fade
  const trail = [];
  const maxTrail = 110;

  function pointAtLengthSafe(len) {
    if (!totalLen) return { x: 100, y: 100 };
    return journeyPath.getPointAtLength(Math.max(0, Math.min(totalLen, len)));
  }

  // ---------- HUD ----------
  const radarSweep = document.getElementById("radarSweep");
  const radarPulse = document.getElementById("radarPulse");
  const altEl = document.getElementById("altitude");
  const hdgEl = document.getElementById("heading");
  const spdEl = document.getElementById("speed");

  let altitude = 1200;
  let speed = 180;
  let radarDeg = 0;
  let lastPoint = pointAtLengthSafe(0);

  // ---------- Audio ----------
  const audio = document.getElementById("engineAudio");
  const audioBtn = document.getElementById("audioToggle");
  let audioOn = false;
  audioBtn.addEventListener("click", async () => {
    try {
      if (!audioOn) {
        await audio.play();
        audioOn = true;
        audioBtn.textContent = "🔊 Engine: On";
        audioBtn.setAttribute("aria-pressed", "true");
      } else {
        audio.pause();
        audioOn = false;
        audioBtn.textContent = "🔊 Engine: Off";
        audioBtn.setAttribute("aria-pressed", "false");
      }
    } catch {
      audioBtn.textContent = "⚠️ Tap again";
    }
  });

  // ---------- Scroll & animation loop ----------
  function getScrollProgress() {
    const d = document.documentElement;
    const max = d.scrollHeight - d.clientHeight;
    return max > 0 ? d.scrollTop / max : 0;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  let smoothP = 0;

  function animate() {
    const p = getScrollProgress();
    smoothP = lerp(smoothP, p, 0.08);

    // Progress bar
    progressBar.style.width = `${(p * 100).toFixed(2)}%`;

    // Background parallax
    const y = window.scrollY || 0;
    layerFar.style.transform = `translate3d(0, ${y * 0.05}px, 0)`;
    layerMid.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
    layerNear.style.transform = `translate3d(0, ${y * 0.17}px, 0)`;

    // Camera follow on content (subtle)
    mainContent.style.transform = `translate3d(0, ${-smoothP * 16}px, 0)`;

    // Aircraft moves along path
    const headLen = smoothP * totalLen;
    const head = pointAtLengthSafe(headLen);
    const ahead = pointAtLengthSafe(headLen + 2);
    const behind = pointAtLengthSafe(headLen - 6);

    // Angle (heading)
    const angle = Math.atan2(ahead.y - head.y, ahead.x - head.x) * (180 / Math.PI);

    // Bank (turn rate)
    const prevAngle = Math.atan2(head.y - behind.y, head.x - behind.x) * (180 / Math.PI);
    let turnDelta = angle - prevAngle;
    if (turnDelta > 180) turnDelta -= 360;
    if (turnDelta < -180) turnDelta += 360;
    const bank = clamp(turnDelta * 1.4, -20, 20);

    // Pitch (climb/descend)
    const pitch = clamp((behind.y - head.y) * 0.08, -10, 10);

    // Depth layering: plane behind content in middle range
    if (smoothP > 0.41 && smoothP < 0.57) {
      aircraft.style.zIndex = "90"; // behind content (content is 160)
      aircraft.style.opacity = "0.82";
    } else {
      aircraft.style.zIndex = "190";
      aircraft.style.opacity = "1";
    }

    // Scale through journey (approach then depart)
    let scale = 0.55;
    if (smoothP < 0.22) scale = lerp(0.45, 0.95, smoothP / 0.22);           // approach
    else if (smoothP < 0.82) scale = 0.95 + Math.sin(smoothP * 8) * 0.02;    // cruise
    else scale = lerp(0.95, 0.5, (smoothP - 0.82) / 0.18);                    // departure

    // Projects section circle once
    if (smoothP > 0.58 && smoothP < 0.69) {
      const t = (smoothP - 0.58) / 0.11;
      const r = 32;
      const cx = head.x, cy = head.y;
      const ox = Math.cos(t * Math.PI * 2) * r;
      const oy = Math.sin(t * Math.PI * 2) * (r * 0.6);
      aircraft.style.transform = `translate3d(${cx + ox - 95}px, ${cy + oy - 47}px, 0) rotate(${angle}deg) rotateZ(${bank}deg) rotateX(${pitch}deg) scale(${scale})`;
    } else {
      aircraft.style.transform = `translate3d(${head.x - 95}px, ${head.y - 47}px, 0) rotate(${angle}deg) rotateZ(${bank}deg) rotateX(${pitch}deg) scale(${scale})`;
    }

    // Sun reflection sweep
    const sweep = aircraft.querySelector(".sun-sweep");
    if (sweep) {
      const sx = Math.sin(performance.now() * 0.0017) * 60;
      sweep.style.transform = `translateX(${sx}%)`;
    }

    // Nav lights blink realistic
    const tt = performance.now() * 0.001;
    const leftOn = Math.sin(tt * 3.4) > 0.62;
    const rightOn = Math.sin(tt * 2.8 + 1.2) > 0.64;
    lightLeft.style.opacity = leftOn ? "1" : "0.2";
    lightRight.style.opacity = rightOn ? "1" : "0.22";

    // Flight path drawn in realtime
    if (totalLen > 0) {
      const drawn = Math.max(0, Math.min(totalLen, headLen));
      pathVisible.style.strokeDasharray = `${drawn} ${totalLen - drawn}`;
      pathWideGlow.style.strokeDasharray = `${drawn} ${totalLen - drawn}`;
    }

    // Contrail
    trail.push({ x: head.x, y: head.y });
    if (trail.length > maxTrail) trail.shift();

    tctx.clearRect(0, 0, cw, ch);
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const age = i / trail.length;
      tctx.beginPath();
      tctx.moveTo(a.x, a.y);
      tctx.lineTo(b.x, b.y);
      tctx.strokeStyle = `rgba(190,230,255,${(1 - age) * 0.35})`;
      tctx.lineWidth = lerp(7, 1.2, age);
      tctx.lineCap = "round";
      tctx.stroke();
    }

    // HUD values
    const frameDist = Math.hypot(head.x - lastPoint.x, head.y - lastPoint.y);
    speed = lerp(speed, clamp(170 + frameDist * 14, 160, 540), 0.08);
    altitude = lerp(altitude, 1200 + smoothP * 32000 + Math.sin(tt * 0.7) * 120, 0.06);

    const hdg = ((angle % 360) + 360) % 360;
    altEl.textContent = String(Math.round(altitude)).padStart(5, "0");
    hdgEl.textContent = `${String(Math.round(hdg)).padStart(3, "0")}°`;
    spdEl.textContent = String(Math.round(speed)).padStart(3, "0");

    radarDeg = (radarDeg + 2.2) % 360;
    radarSweep.style.transform = `rotate(${radarDeg}deg)`;
    const pulseInset = 38 + Math.sin(tt * 3.4) * 4;
    radarPulse.style.inset = `${pulseInset}%`;
    radarPulse.style.opacity = `${0.35 + Math.sin(tt * 3.4) * 0.22}`;

    lastPoint = head;
    requestAnimationFrame(animate);
  }

  // ---------- Resize ----------
  function onResize() {
    resizeParticles();
    resizeContrail();
    try { totalLen = journeyPath.getTotalLength(); } catch { totalLen = 0; }
  }

  window.addEventListener("resize", onResize);

  // ---------- Start ----------
  onResize();
  drawParticles();
  animate();
})();
