(() => {
  "use strict";

  const pet = document.getElementById("miloPet");
  if (!pet) return;

  // A wandering pet is decoration: skip it for anyone who asked for less
  // motion, and on touch screens where there is no cursor to react to and the
  // viewport is too tight to spare the room.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = window.matchMedia("(hover: hover)").matches;
  if (reduced || !pointer) { pet.remove(); return; }

  const sprite = pet.querySelector(".pet__sprite");
  const bubble = pet.querySelector(".pet__say");
  const lines = (pet.dataset.say || "!").split("|").filter(Boolean);

  const SPEED = 46;          // px per second — an amble, not a commute
  const MARGIN = 28;
  const size = 76;

  const floor = pet.parentElement;
  const span = () => Math.max(0, floor.clientWidth - size - MARGIN * 2);

  let x = MARGIN + span() * 0.12;
  let target = x;
  let facing = 1;
  let walking = false;
  let restUntil = performance.now() + 1200;
  let hopUntil = 0;
  let bubbleUntil = 0;
  let last = performance.now();

  const maxX = () => MARGIN + span();

  function chooseTarget(now) {
    // wander somewhere else along the floor, but never a pointless half-step
    const reach = span();
    let next;
    do {
      next = MARGIN + Math.random() * reach;
    } while (Math.abs(next - x) < reach * 0.18);
    target = next;
    facing = next > x ? 1 : -1;
    walking = true;
    restUntil = 0;
  }

  function say(now) {
    if (!lines.length) return;
    bubble.textContent = lines[Math.floor(Math.random() * lines.length)];
    bubble.classList.add("is-on");
    bubbleUntil = now + 1500;
  }

  pet.addEventListener("click", () => {
    const now = performance.now();
    hopUntil = now + 520;
    say(now);
  });

  // pause while being looked at
  let hovered = false;
  pet.addEventListener("mouseenter", () => { hovered = true; });
  pet.addEventListener("mouseleave", () => { hovered = false; });

  window.addEventListener("resize", () => {
    x = Math.min(x, maxX());
    target = Math.min(target, maxX());
  });

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (hovered) {
      walking = false;
      restUntil = Math.max(restUntil, now + 400);
    } else if (walking) {
      const step = SPEED * dt * facing;
      x += step;
      if ((facing > 0 && x >= target) || (facing < 0 && x <= target)) {
        x = target;
        walking = false;
        restUntil = now + 1400 + Math.random() * 3600;   // stop and look around
      }
    } else if (now >= restUntil) {
      chooseTarget(now);
    }

    // gait: a small bob per step while walking, plus a hop on click
    const bob = walking ? Math.abs(Math.sin(now / 125)) * -4 : 0;
    let hop = 0;
    if (now < hopUntil) {
      const t = 1 - (hopUntil - now) / 520;
      hop = -Math.sin(t * Math.PI) * 26;
    }

    pet.style.transform = `translate3d(${x}px, ${bob + hop}px, 0)`;
    // the drawing faces right, so walking left is a mirror, not a rotation
    sprite.style.transform = `scaleX(${facing})`;
    pet.classList.toggle("is-walking", walking);

    if (bubbleUntil && now > bubbleUntil) {
      bubble.classList.remove("is-on");
      bubbleUntil = 0;
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
