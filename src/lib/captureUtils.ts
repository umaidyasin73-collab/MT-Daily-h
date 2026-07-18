import html2canvas from 'html2canvas';

export async function captureWithSafeStylesheets(
  element: HTMLElement,
  options: Parameters<typeof html2canvas>[1]
): ReturnType<typeof html2canvas> {
  const stylesBackup: Array<
    | { type: 'style'; element: HTMLStyleElement; originalText: string }
    | { type: 'link'; element: HTMLLinkElement; originalDisabled: boolean }
    | { type: 'temp'; element: HTMLStyleElement }
  > = [];

  try {
    const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));

    for (const el of styleElements) {
      if (el.tagName === 'STYLE') {
        const styleEl = el as HTMLStyleElement;
        const originalText = styleEl.textContent || '';
        if (originalText.includes('oklch')) {
          stylesBackup.push({ type: 'style', element: styleEl, originalText });
          // Replace oklch(...) with a standard fallback color that html2canvas won't crash on
          const safeText = originalText.replace(/oklch\([^)]+\)/g, 'rgb(100, 116, 139)');
          styleEl.textContent = safeText;
        }
      } else if (el.tagName === 'LINK') {
        const linkEl = el as HTMLLinkElement;
        try {
          const sheet = linkEl.sheet;
          if (sheet) {
            const rules = Array.from(sheet.cssRules);
            let cssText = '';
            for (const rule of rules) {
              cssText += rule.cssText + '\n';
            }
            if (cssText.includes('oklch')) {
              stylesBackup.push({ type: 'link', element: linkEl, originalDisabled: linkEl.disabled });
              
              // Disable original stylesheet
              linkEl.disabled = true;

              // Create temporary style element with oklch values replaced
              const tempStyle = document.createElement('style');
              tempStyle.setAttribute('data-temp-style', 'true');
              tempStyle.textContent = cssText.replace(/oklch\([^)]+\)/g, 'rgb(100, 116, 139)');
              document.head.appendChild(tempStyle);

              stylesBackup.push({ type: 'temp', element: tempStyle });
            }
          }
        } catch (e) {
          // If CORS prevents reading cssRules, let's fall back to fetching if same-origin
          console.warn('Could not read link stylesheet rules directly:', e);
          if (linkEl.href && linkEl.href.startsWith(window.location.origin)) {
            try {
              const res = await fetch(linkEl.href);
              const text = await res.text();
              if (text.includes('oklch')) {
                stylesBackup.push({ type: 'link', element: linkEl, originalDisabled: linkEl.disabled });
                linkEl.disabled = true;

                const tempStyle = document.createElement('style');
                tempStyle.setAttribute('data-temp-style', 'true');
                tempStyle.textContent = text.replace(/oklch\([^)]+\)/g, 'rgb(100, 116, 139)');
                document.head.appendChild(tempStyle);

                stylesBackup.push({ type: 'temp', element: tempStyle });
              }
            } catch (fetchErr) {
              console.error('Failed to fetch fallback stylesheet:', fetchErr);
            }
          }
        }
      }
    }

    // Call html2canvas with the temporary clean styles
    return await html2canvas(element, options);
  } finally {
    // Restore everything in finally block to ensure styles are never left broken
    for (const backup of stylesBackup) {
      if (backup.type === 'style') {
        backup.element.textContent = backup.originalText;
      } else if (backup.type === 'link') {
        backup.element.disabled = backup.originalDisabled;
      } else if (backup.type === 'temp') {
        if (backup.element.parentNode) {
          backup.element.parentNode.removeChild(backup.element);
        }
      }
    }
  }
}
