(() => {
  "use strict";

  /* Footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Reveal on scroll — anything already on screen shows at once, the rest
     fades in as it scrolls into view. A timeout backstops both paths so
     content is never left invisible if something goes wrong. */
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
    }, { threshold: 0.12 });

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
})();
