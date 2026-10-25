/**
 * Robust clipboard copy utility.
 * Attempts modern navigator.clipboard.writeText first,
 * with document.execCommand('copy') fallback for restricted environments.
 * Returns true if copied successfully, false otherwise.
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;

  // Try modern Clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback below
    }
  }

  // Fallback for older browsers or insecure contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    return false;
  }
}
