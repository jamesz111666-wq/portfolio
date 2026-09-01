(() => {
  "use strict";

  /* Footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Theme toggle (persisted) */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  themeToggle?.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    if (next === "dark") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", next);
    }
    localStorage.setItem("theme", next);
  });

  /* Mobile nav */
  const navBurger = document.getElementById("navBurger");
  const navLinks = document.querySelector(".nav__links");
  navBurger?.addEventListener("click", () => {
    navLinks?.classList.toggle("is-open");
  });
  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("is-open"));
  });

  /* Nav background on scroll */
  const nav = document.querySelector(".nav");
  window.addEventListener("scroll", () => {
    nav?.classList.toggle("is-scrolled", window.scrollY > 20);
  }, { passive: true });

  /* Reveal on scroll — anything already on screen shows at once, the rest
     fades in as it scrolls into view. A timeout backstops both paths so
     content is never left invisible. */
  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  const show = (el) => el.classList.add("is-visible");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        show(el);
      } else {
        io.observe(el);
      }
    });
  } else {
    revealEls.forEach(show);
  }

  setTimeout(() => revealEls.forEach(show), 1500);

  /* Typewriter roles — the page supplies its own list via data-roles so the
     Chinese and English versions can share this script. */
  const typewriterEl = document.getElementById("typewriter");
  const roles = (typewriterEl?.dataset.roles || "").split("|").filter(Boolean);
  if (typewriterEl && roles.length) {
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const current = roles[roleIndex];
      if (!deleting) {
        charIndex++;
        typewriterEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, 1600);
          return;
        }
      } else {
        charIndex--;
        typewriterEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(tick, deleting ? 40 : 80);
    };
    tick();
  }

  /* Custom cursor dot (pointer devices only) */
  const cursorDot = document.getElementById("cursorDot");
  if (cursorDot && window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("mousemove", (e) => {
      cursorDot.style.left = `${e.clientX}px`;
      cursorDot.style.top = `${e.clientY}px`;
    });
    document.querySelectorAll("a, button, .project-card, .tag").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursorDot.style.width = "26px";
        cursorDot.style.height = "26px";
        cursorDot.style.background = "var(--accent-2)";
      });
      el.addEventListener("mouseleave", () => {
        cursorDot.style.width = "10px";
        cursorDot.style.height = "10px";
        cursorDot.style.background = "var(--accent)";
      });
    });
  } else if (cursorDot) {
    cursorDot.style.display = "none";
  }

  /* Ambient animated background: soft drifting gradient orbs */
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas?.getContext("2d");
  if (canvas && ctx) {
    let width, height, dpr;
    const orbs = [
      { x: 0.2, y: 0.3, r: 0.35, dx: 0.00012, dy: 0.00009, color: "124,92,255" },
      { x: 0.75, y: 0.65, r: 0.4, dx: -0.00010, dy: 0.00013, color: "79,214,196" },
      { x: 0.5, y: 0.85, r: 0.3, dx: 0.00008, dy: -0.00011, color: "124,92,255" },
    ];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      orbs.forEach((orb) => {
        const x = (orb.x + Math.sin(t * orb.dy * 1000) * 0.05) * width;
        const y = (orb.y + Math.cos(t * orb.dx * 1000) * 0.05) * height;
        const r = orb.r * Math.max(width, height);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(${orb.color}, 0.25)`);
        gradient.addColorStop(1, `rgba(${orb.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (!prefersReducedMotion) {
        t += 1;
        requestAnimationFrame(draw);
      }
    };
    draw();
  }
})();
