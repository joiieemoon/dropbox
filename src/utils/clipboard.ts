/**
 * Copy text to the clipboard silently — no popups or prompts.
 * Tries the modern Clipboard API first, then falls back to a
 * hidden textarea + document.execCommand("copy") for older browsers
 * or environments where the Clipboard API is unavailable.
 */
export function copyToClipboard(text: string): boolean {
  // Try the modern async Clipboard API first.
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopy(text);
    });
    return true;
  }

  // Fallback: hidden textarea + execCommand (synchronous, no popup).
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}