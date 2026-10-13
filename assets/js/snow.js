// ヒーローの降雪。画面外・タブ非表示では停止し、prefers-reduced-motion では静止表示にする。
(() => {
  const canvas = document.querySelector("[data-snow]");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const COLOR = "rgb(108, 170, 200)";

  let width = 0;
  let height = 0;
  let flakes = [];
  let frame = 0;
  let onScreen = true;

  function createFlake(anywhere) {
    // 小さい粒を多めに、大きい結晶はまれに
    const r = Math.random() ** 2 * 3.2 + 0.8;
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -12,
      r,
      fall: 0.25 + r * 0.18,
      phase: Math.random() * Math.PI * 2,
      sway: 0.2 + Math.random() * 0.5,
      alpha: 0.35 + Math.random() * 0.4,
      crystal: r > 2.9,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.01,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(Math.min(150, (width * height) / 8500));
    flakes = Array.from({ length: count }, () => createFlake(true));
    draw();
  }

  function drawCrystal(f) {
    const len = f.r * 2.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = f.rotation + (i * Math.PI) / 3;
      const dx = Math.cos(a) * len;
      const dy = Math.sin(a) * len;
      ctx.moveTo(f.x - dx, f.y - dy);
      ctx.lineTo(f.x + dx, f.y + dy);
    }
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = COLOR;
    ctx.strokeStyle = COLOR;
    for (const f of flakes) {
      ctx.globalAlpha = f.alpha;
      if (f.crystal) {
        drawCrystal(f);
      } else {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function update() {
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.phase += 0.01;
      f.y += f.fall;
      f.x += Math.sin(f.phase) * f.sway * 0.4;
      f.rotation += f.spin;
      if (f.y - f.r * 3 > height || f.x < -20 || f.x > width + 20) {
        flakes[i] = createFlake(false);
      }
    }
  }

  function tick() {
    update();
    draw();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const shouldRun = onScreen && !document.hidden && !reduceMotion.matches;
    if (shouldRun && !frame) {
      frame = requestAnimationFrame(tick);
    } else if (!shouldRun && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  new ResizeObserver(resize).observe(canvas);

  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  }).observe(canvas);

  document.addEventListener("visibilitychange", sync);
  reduceMotion.addEventListener("change", () => {
    draw();
    sync();
  });

  resize();
  sync();
})();
