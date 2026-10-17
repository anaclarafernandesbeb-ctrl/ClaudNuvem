/* Pulso Lab — interações do site (leve, sem dependências) */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: borda ao rolar */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Menu mobile */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Ano no rodapé */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Brilho que acompanha o cursor nos cards (.spot) */
  if (!reduce) {
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* Console do hero: destaca cada evento do fluxo e a etapa da jornada */
  var logItems = document.querySelectorAll(".log li");
  var stageItems = document.querySelectorAll(".stages span");
  var stageOf = [0, 1, 2, 3, 3];
  if (logItems.length && !reduce) {
    var current = 0;
    setInterval(function () {
      if (document.hidden) return;
      current = (current + 1) % logItems.length;
      logItems.forEach(function (li, k) { li.classList.toggle("is-active", k === current); });
      stageItems.forEach(function (s, k) { s.classList.toggle("is-active", k === stageOf[current]); });
    }, 1800);
  }

  /* Vídeos em loop: tocam só quando visíveis e nunca para quem pediu menos movimento */
  var loops = document.querySelectorAll("video[data-loop]");
  if (loops.length && !reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var p = e.target.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          e.target.pause();
        }
      });
    }, { threshold: 0.15 });
    loops.forEach(function (v) { vio.observe(v); });
  }

  /* Barra de CTA no celular: aparece depois do hero e some no CTA final */
  var sticky = document.querySelector(".sticky-cta");
  var heroEl = document.querySelector(".hero, .page-hero");
  var ctaEl = document.getElementById("agendar");
  if (sticky && heroEl && "IntersectionObserver" in window) {
    var pastHero = false, atCta = false;
    var updateSticky = function () {
      var on = pastHero && !atCta;
      sticky.classList.toggle("is-on", on);
      sticky.inert = !on;
    };
    updateSticky();
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; updateSticky(); }).observe(heroEl);
    if (ctaEl) new IntersectionObserver(function (es) { atCta = es[0].isIntersecting; updateSticky(); }).observe(ctaEl);
  }

  /* Rede de nós no fundo do hero (canvas) */
  var canvas = document.querySelector(".hero-bg canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var colors = ["43,224,255", "154,91,255", "255,61,154"];
    var nodes = [], w = 0, h = 0, raf = 0, running = false, inView = true;
    var LINK = 130;

    var size = function () {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(22, Math.min(80, Math.round((w * h) / 16000)));
      nodes = [];
      for (var k = 0; k < n; k++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.7, c: colors[k % colors.length]
        });
      }
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (var a = 0; a < nodes.length; a++) {
        var p = nodes[a];
        for (var b = a + 1; b < nodes.length; b++) {
          var q = nodes[b], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var o = (1 - Math.sqrt(d2) / LINK) * 0.35;
            ctx.strokeStyle = "rgba(" + p.c + "," + o.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        ctx.fillStyle = "rgba(" + n.c + ",.9)";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    };

    var tick = function () {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    var start = function () { if (running || reduce) return; running = true; raf = requestAnimationFrame(tick); };
    var stop = function () { running = false; cancelAnimationFrame(raf); };

    size();
    draw();

    if (!reduce) {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          if (inView && !document.hidden) start(); else stop();
        }).observe(canvas);
      } else {
        start();
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else if (inView) start();
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { size(); draw(); }, 150);
    });
  }
})();
