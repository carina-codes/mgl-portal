import confetti from "canvas-confetti";

/**
 * Carina-branded celebratory confetti burst.
 * Uses brand blue + complementary accents and stays tasteful (short duration).
 */
export function celebrate(originX = 0.5, originY = 0.6) {
  const colors = ["#0049FE", "#5B8CFF", "#000000", "#FFD166", "#F2F2F2"];
  const defaults = {
    spread: 70,
    ticks: 80,
    gravity: 0.9,
    decay: 0.92,
    startVelocity: 32,
    colors,
    scalar: 0.95,
    disableForReducedMotion: true,
  } as const;

  confetti({
    ...defaults,
    particleCount: 60,
    origin: { x: originX, y: originY },
  });
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 30,
      angle: 60,
      origin: { x: Math.max(0, originX - 0.15), y: originY },
    });
    confetti({
      ...defaults,
      particleCount: 30,
      angle: 120,
      origin: { x: Math.min(1, originX + 0.15), y: originY },
    });
  }, 120);
}

/** Celebrate centered on a DOM element (e.g. a task card moved to Done). */
export function celebrateFromElement(el: HTMLElement | null) {
  if (!el) return celebrate();
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width / 2) / window.innerWidth;
  const y = (r.top + r.height / 2) / window.innerHeight;
  celebrate(x, y);
}
