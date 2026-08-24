/**
 * Wave-style theme transition using the View Transitions API.
 *
 * A circular "wave" expands from the toggle button's click position and
 * reveals the new theme across the entire page. Gracefully falls back to an
 * instant toggle when the browser lacks support or the user prefers
 * reduced motion.
 */

type StartViewTransition = (
  updateCallback: () => void | Promise<void>,
) => { ready: Promise<void> };

type DocumentWithViewTransition = Document & {
  startViewTransition?: StartViewTransition;
};

interface ToggleOrigin {
  clientX: number;
  clientY: number;
}

/** Duration of the expanding-wave reveal, in milliseconds. */
const WAVE_DURATION_MS = 600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Runs `performToggle` inside a circular wave reveal originating at the
 * click point (falls back to the viewport's right edge, where theme
 * togglers usually live, when no event is available).
 */
export function toggleThemeWithWave(
  performToggle: () => void,
  origin?: ToggleOrigin,
): void {
  if (prefersReducedMotion()) {
    performToggle();
    return;
  }

  const doc = document as DocumentWithViewTransition;
  if (typeof doc.startViewTransition !== "function") {
    // Browser without View Transitions support — switch instantly.
    performToggle();
    return;
  }

  const x = origin?.clientX ?? window.innerWidth - 64;
  const y = origin?.clientY ?? 64;

  // Radius needed for the circle to cover the farthest viewport corner.
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
    performToggle();
  });

  // Animate the incoming snapshot with an expanding circle clipped to the
  // click origin. If the transition is skipped (e.g. rapid double-clicks)
  // `ready` rejects — swallow it so it never surfaces as an unhandled error.
  void transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: WAVE_DURATION_MS,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      /* transition was skipped — nothing to animate */
    });
}