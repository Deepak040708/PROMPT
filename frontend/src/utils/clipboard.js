/**
 * Robust clipboard copy utility.
 * Attempts modern navigator.clipboard.writeText first,
 * with document.execCommand('copy') fallback for restricted environments,
 * mobile webviews, and iOS Safari.
 * Returns true if copied successfully, false otherwise.
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;

  // Try modern Clipboard API
  if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback below
    }
  }

  // Fallback for mobile WebViews, older browsers, or unprivileged contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);

    // iOS specific range selection
    if (typeof navigator !== 'undefined' && /ipad|iphone|ipod/i.test(navigator.userAgent)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.focus();
      textArea.select();
    }

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Boolean(successful);
  } catch (err) {
    return false;
  }
}
