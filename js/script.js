/* Martínez & Asociados — comportamiento del sitio */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Menú móvil ---------- */
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
    $$("a", navLinks).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) { setMenu(false); menuToggle.focus(); }
    });
  }

  /* ---------- Año ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Progreso de lectura ---------- */
  const progress = $("#progress");
  let ticking = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--p", max > 0 ? clamp(scrollY / max, 0, 1).toFixed(4) : 0);
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  updateProgress();

  /* ---------- Sección activa en el menú ---------- */
  const links = $$('.nav-links a[href^="#"]:not(.nav-cta)');
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + en.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["servicios", "despacho", "contacto"].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Titular: palabra por palabra ---------- */
  const h1 = $("#titulo");
  if (h1) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute("aria-label", words.join(" "));
    h1.textContent = "";
    words.forEach((word, i) => {
      const outer = document.createElement("span");
      outer.className = "w";
      outer.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.className = "wi";
      inner.style.setProperty("--i", i);
      inner.textContent = word;
      outer.appendChild(inner);
      h1.appendChild(outer);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(" "));
    });
  }

  /* ---------- Sello: cae al cargar y de nuevo al tocarlo ---------- */
  const seal = $("#seal");
  const cardWrap = $("#cardWrap");
  function sellar(first) {
    if (!seal || !cardWrap) return;
    [seal, cardWrap].forEach((el) => el.classList.remove("stamping", "pressing", "first"));
    void seal.offsetWidth;
    seal.classList.add("stamping");
    cardWrap.classList.add("pressing");
    if (first) { seal.classList.add("first"); cardWrap.classList.add("first"); }
  }
  if (seal) {
    if (reduce) { /* queda estático */ } else sellar(true);
    seal.addEventListener("click", () => sellar(false));
  }

  /* ---------- Tarjeta 3D que sigue al cursor ---------- */
  const hero = $("#inicio");
  if (hero && cardWrap && fine && !reduce) {
    let rx = 0, ry = 0, trx = 0, try_ = 0, running = false;
    const step = () => {
      rx += (trx - rx) * 0.12;
      ry += (try_ - ry) * 0.12;
      cardWrap.style.setProperty("--rx", rx.toFixed(2) + "deg");
      cardWrap.style.setProperty("--ry", ry.toFixed(2) + "deg");
      if (Math.abs(trx - rx) > 0.02 || Math.abs(try_ - ry) > 0.02) requestAnimationFrame(step);
      else running = false;
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(step); } };
    hero.addEventListener("pointermove", (e) => {
      const r = cardWrap.getBoundingClientRect();
      const dx = clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth / 2), -1, 1);
      const dy = clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight / 2), -1, 1);
      trx = -dy * 7; try_ = dx * 10;
      cardWrap.style.setProperty("--gx", clamp(((e.clientX - r.left) / r.width) * 100, 0, 100) + "%");
      cardWrap.style.setProperty("--gy", clamp(((e.clientY - r.top) / r.height) * 100, 0, 100) + "%");
      cardWrap.style.setProperty("--go", "1");
      kick();
    });
    hero.addEventListener("pointerleave", () => { trx = 0; try_ = 0; cardWrap.style.setProperty("--go", "0"); kick(); });
  }

  /* ---------- Botones magnéticos ---------- */
  if (fine && !reduce) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.32;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Luz ultravioleta: la seguridad del papel ---------- */
  const TEXT_MICRO = "MARTÍNEZ & ASOCIADOS · OFICINA JURÍDICA · EL SALVADOR · ";

  function drawUV(o) {
    const { host, canvas } = o;
    const w = host.clientWidth, h = host.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1. Bandas onduladas de impresión de seguridad
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(120, 190, 255, .75)");
    grad.addColorStop(.5, "rgba(190, 150, 255, .6)");
    grad.addColorStop(1, "rgba(227, 185, 85, .8)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = .9;
    for (let y = -10; y < h + 10; y += 7) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin(x / 90 + y / 38) * 7 + Math.sin(x / 41 - y / 60) * 3;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // 2. Rosetones de guilloché (hipotrocoides)
    const rosettes = [
      { cx: w * .76, cy: h * .5, s: Math.min(w, h) * .64, color: "rgba(170, 215, 255, .9)" },
      { cx: w * .08, cy: h * .88, s: Math.min(w, h) * .46, color: "rgba(240, 205, 120, .9)" },
      { cx: w * .42, cy: h * .1, s: Math.min(w, h) * .34, color: "rgba(205, 175, 255, .85)" },
    ];
    const R = 7, r = 3, k = (R - r) / r;
    rosettes.forEach((ro) => {
      ctx.strokeStyle = ro.color;
      ctx.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const d = 1.1 + i * .5;
        const u = ro.s / (R - r + d) / 2;
        ctx.beginPath();
        for (let t = 0; t <= Math.PI * 2 * r + .01; t += .012) {
          const x = ro.cx + u * ((R - r) * Math.cos(t) + d * Math.cos(k * t));
          const y = ro.cy + u * ((R - r) * Math.sin(t) - d * Math.sin(k * t));
          t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });

    // 3. Microtexto
    ctx.save();
    ctx.rotate(-0.16);
    ctx.font = "700 8px 'Hanken Grotesk', Arial, sans-serif";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1.4px";
    ctx.fillStyle = "rgba(238, 240, 237, .55)";
    const unit = ctx.measureText(TEXT_MICRO).width || 400;
    for (let y = -h * .2, row = 0; y < h * 1.1; y += 13, row++) {
      for (let x = -unit + (row % 2) * (unit / 2); x < w * 1.2; x += unit) ctx.fillText(TEXT_MICRO, x, y);
    }
    ctx.restore();
  }

  const uvHosts = $$(".uv-host").map((host) => {
    const o = { host, canvas: $(".uv", host), visible: true, x: 0, y: 0, tx: 0, ty: 0, last: -1e9, w: 0 };
    o.w = host.clientWidth;
    o.x = o.tx = host.clientWidth * .72;
    o.y = o.ty = host.clientHeight * .42;
    o.r = clamp(Math.min(host.clientWidth, host.clientHeight) * .32, 150, 250);
    host.style.setProperty("--r", o.r + "px");
    host.style.setProperty("--mx", o.x + "px");
    host.style.setProperty("--my", o.y + "px");
    return o;
  });

  const redrawAll = () => uvHosts.forEach((o) => {
    o.r = clamp(Math.min(o.host.clientWidth, o.host.clientHeight) * .32, 150, 250);
    o.host.style.setProperty("--r", o.r + "px");
    drawUV(o);
  });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(redrawAll);

  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (uvHosts.some((o) => o.host.clientWidth !== o.w)) { uvHosts.forEach((o) => (o.w = o.host.clientWidth)); redrawAll(); }
    }, 180);
  });

  function setLamp(o, x, y) {
    o.host.style.setProperty("--mx", x.toFixed(1) + "px");
    o.host.style.setProperty("--my", y.toFixed(1) + "px");
  }

  addEventListener("pointermove", (e) => {
    uvHosts.forEach((o) => {
      const rect = o.host.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        o.tx = e.clientX - rect.left; o.ty = e.clientY - rect.top; o.last = performance.now();
        if (reduce) { o.x = o.tx; o.y = o.ty; setLamp(o, o.x, o.y); }
      }
    });
    const hint = $("#uvHint");
    if (hint && !hint.classList.contains("gone") && performance.now() > 3500) hint.classList.add("gone");
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    const vis = new IntersectionObserver((entries) => {
      entries.forEach((en) => { const o = uvHosts.find((u) => u.host === en.target); if (o) o.visible = en.isIntersecting; });
    });
    uvHosts.forEach((o) => vis.observe(o.host));
  }

  if (!reduce) {
    const loop = (t) => {
      uvHosts.forEach((o) => {
        if (!o.visible) return;
        const active = t - o.last < 2600;
        if (!active) {
          const w = o.host.clientWidth, h = o.host.clientHeight;
          o.tx = w * (.5 + .36 * Math.sin(t * .00034));
          o.ty = h * (.46 + .3 * Math.sin(t * .0005 + 1.3));
        }
        o.x += (o.tx - o.x) * (active ? .2 : .035);
        o.y += (o.ty - o.y) * (active ? .2 : .035);
        setLamp(o, o.x, o.y);
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  const hint = $("#uvHint");
  if (hint) {
    hint.textContent = fine
      ? "Mueve el cursor sobre el papel: la luz ultravioleta revela sus marcas de seguridad."
      : "Toca el papel: la luz ultravioleta revela sus marcas de seguridad.";
    if (!fine) setTimeout(() => hint.classList.add("gone"), 9000);
  }

  /* ---------- Ficha de consulta (formulario real) ---------- */
  const PHONE = "50379689930";
  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  const SERVICES = [
    {
      t: "Asesoría jurídica",
      d: "Orientación en asuntos legales para comprender tus opciones y los pasos a seguir.",
      q: "¿En qué área?",
      subs: [
        { l: "Derecho civil" }, { l: "Derecho mercantil" }, { l: "Derecho laboral" }, { l: "Derecho penal" },
        { l: "No estoy seguro", none: true },
      ],
      msg: (s) => (s && !s.none ? `Hola, deseo una asesoría jurídica en ${lc(s.l)}.` : "Hola, deseo una asesoría jurídica."),
    },
    {
      t: "Trámites en SERTRACEN",
      d: "Gestiones relacionadas con identificación, tránsito y circulación.",
      q: "¿Qué gestión?",
      subs: [{ l: "Identificación" }, { l: "Tránsito" }, { l: "Circulación" }, { l: "No estoy seguro", none: true }],
      msg: (s) => (s && !s.none ? `Hola, deseo consultar sobre trámites en SERTRACEN (${lc(s.l)}).` : "Hola, deseo consultar sobre trámites en SERTRACEN."),
    },
    {
      t: "Apostillados",
      d: "Orientación para apostillar documentos, según el tipo de documento y los requisitos aplicables.",
      msg: () => "Hola, deseo consultar sobre apostillados.",
    },
    {
      t: "Elaboración de contratos",
      d: "Apoyo en la preparación y revisión de documentos contractuales según el caso.",
      q: "¿Qué necesitas?",
      subs: [
        { l: "Redactar un contrato nuevo", full: "Hola, deseo que redacten un contrato." },
        { l: "Revisar un contrato existente", full: "Hola, deseo que revisen un contrato." },
      ],
      msg: (s) => (s && s.full ? s.full : "Hola, deseo consultar sobre la elaboración de un contrato."),
    },
    {
      t: "Representación legal",
      d: "Acompañamiento y orientación en procesos y gestiones legales.",
      msg: () => "Hola, deseo consultar sobre representación legal.",
    },
    {
      t: "Servicios notariales",
      d: "Escrituras, autenticación de firmas, testamentos, poderes y otros documentos.",
      q: "¿Qué documento?",
      subs: [
        { l: "Protocolización de escrituras" }, { l: "Autenticación de firmas" }, { l: "Testamentos y donaciones" },
        { l: "Poderes generales y especiales" }, { l: "Compraventas de inmuebles" },
        { l: "Legalización y certificación de documentos" },
      ],
      msg: (s) => (s ? `Hola, deseo consultar sobre servicios notariales: ${lc(s.l)}.` : "Hola, deseo consultar sobre servicios notariales."),
    },
  ];

  const ficha = $("#ficha");
  if (ficha) {
    const optsSvc = $("#optsSvc"), optsSub = $("#optsSub");
    const campoSub = $("#campoSub"), legendSub = $("#legendSub");
    const nota = $("#nota"), bubble = $("#bubble"), enviar = $("#enviar");
    const hint = $("#sendHint"), limpiar = $("#limpiar"), fecha = $("#fichaFecha");
    const state = { svc: null, sub: null };

    /* Fecha: siempre la del día en que se abre la página (y se renueva a medianoche) */
    const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const pad = (n) => String(n).padStart(2, "0");
    function pintarFecha() {
      if (!fecha) return;
      const n = new Date();
      fecha.dateTime = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
      fecha.textContent = `${n.getDate()} de ${MESES[n.getMonth()]} de ${n.getFullYear()}`;
    }
    function programarMedianoche() {
      const n = new Date();
      const sig = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 2);
      setTimeout(() => { pintarFecha(); programarMedianoche(); }, sig - n);
    }
    pintarFecha();
    programarMedianoche();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) pintarFecha(); });

    const needsSub = () => !!(state.svc && state.svc.subs);
    const ready = () => !!state.svc && (!needsSub() || !!state.sub);
    const message = () => {
      const base = state.svc.msg(state.sub);
      const extra = nota.value.trim();
      return extra ? `${base} ${extra}` : base;
    };

    function choice(name, id, value, title, desc) {
      const wrap = document.createElement("div");
      wrap.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.id = id;
      input.value = value;
      const label = document.createElement("label");
      label.className = "opt";
      label.htmlFor = id;
      const strong = document.createElement("strong");
      strong.textContent = title;
      label.appendChild(strong);
      if (desc) {
        const span = document.createElement("span");
        span.textContent = desc;
        label.appendChild(span);
      }
      wrap.append(input, label);
      return wrap;
    }

    SERVICES.forEach((s, i) => optsSvc.appendChild(choice("servicio", `svc-${i}`, i, s.t, s.d)));

    function renderSub() {
      optsSub.replaceChildren();
      state.sub = null;
      if (needsSub()) {
        legendSub.textContent = state.svc.q;
        state.svc.subs.forEach((s, i) => optsSub.appendChild(choice("detalle", `sub-${i}`, i, s.l)));
        campoSub.hidden = false;
      } else {
        campoSub.hidden = true;
      }
    }

    let stamped = false;
    function update() {
      const ok = ready();
      bubble.textContent = ok ? message() : "Elige un servicio para ver aquí tu mensaje.";
      enviar.href = ok ? `https://wa.me/${PHONE}?text=${encodeURIComponent(message())}` : "#";
      enviar.classList.toggle("is-disabled", !ok);
      enviar.setAttribute("aria-disabled", String(!ok));
      if (!state.svc) hint.textContent = "Elige un servicio para continuar.";
      else if (needsSub() && !state.sub) hint.textContent = `Elige una opción en «${state.svc.q}» para continuar.`;
      else hint.textContent = "";

      if (ok && !stamped) {
        stamped = true;
        ficha.classList.remove("stamped");
        void ficha.offsetWidth;
        ficha.classList.add("stamped");
      } else if (!ok && stamped) {
        stamped = false;
        ficha.classList.remove("stamped");
      }
    }

    optsSvc.addEventListener("change", (e) => {
      if (e.target.name !== "servicio") return;
      state.svc = SERVICES[Number(e.target.value)];
      renderSub();
      update();
    });
    optsSub.addEventListener("change", (e) => {
      if (e.target.name !== "detalle") return;
      state.sub = state.svc.subs[Number(e.target.value)];
      update();
    });
    nota.addEventListener("input", update);

    enviar.addEventListener("click", (e) => {
      if (ready()) return;
      e.preventDefault();
      const target = !state.svc ? optsSvc.querySelector("input") : optsSub.querySelector("input");
      if (target) target.focus();
      hint.classList.remove("shake");
      void hint.offsetWidth;
      hint.classList.add("shake");
    });

    limpiar.addEventListener("click", () => {
      $$("input[type=radio]", ficha).forEach((r) => (r.checked = false));
      nota.value = "";
      state.svc = null;
      renderSub();
      update();
    });

    update();
  }

  /* ---------- Firma que se traza al llegar ---------- */
  const signature = $("#signature");
  if (signature) {
    if ("IntersectionObserver" in window) {
      const so = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { signature.classList.add("in"); so.disconnect(); } });
      }, { threshold: .9 });
      so.observe(signature);
    } else signature.classList.add("in");
  }

  /* ---------- Copiar número ---------- */
  const copiar = $("#copiar");
  const estado = $("#copiarEstado");
  if (copiar) {
    copiar.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("7968-9930");
        estado.textContent = "Número copiado: 7968-9930";
      } catch {
        estado.textContent = "No se pudo copiar. El número es 7968-9930.";
      }
      setTimeout(() => (estado.textContent = ""), 3500);
    });
  }
})();
