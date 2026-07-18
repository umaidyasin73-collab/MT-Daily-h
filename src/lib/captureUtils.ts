import html2canvas from 'html2canvas';

// Helper to replace oklch colors with standard hex colors to prevent html2canvas crashes
function replaceOklchWithFallback(str: string): string {
  return str.replace(/oklch\s*\(([^)]+)\)/gi, (match, p1) => {
    const parts = p1.trim().split(/\s+/);
    const lightnessPart = parts[0];
    let lightness = 0.5;

    if (lightnessPart.endsWith('%')) {
      lightness = parseFloat(lightnessPart) / 100;
    } else {
      lightness = parseFloat(lightnessPart);
    }

    if (isNaN(lightness)) {
      lightness = 0.5;
    }

    // Dynamic fallback based on color lightness to preserve visual contrast
    if (lightness >= 0.85) {
      return '#f8fafc'; // light background/borders
    } else if (lightness >= 0.7) {
      return '#cbd5e1'; // light slate borders
    } else if (lightness <= 0.2) {
      return '#0f172a'; // deep slate text/backgrounds
    } else if (lightness <= 0.4) {
      return '#1e293b'; // medium dark slate text
    } else {
      return '#4f46e5'; // active brand indigo
    }
  });
}

export async function captureWithSafeStylesheets(
  element: HTMLElement,
  options: Parameters<typeof html2canvas>[1]
): ReturnType<typeof html2canvas> {
  const stylesBackup: Array<
    | { type: 'style'; element: HTMLStyleElement; originalText: string }
    | { type: 'link'; element: HTMLLinkElement; originalDisabled: boolean }
    | { type: 'temp'; element: HTMLStyleElement }
  > = [];

  const originalGetComputedStyle = window.getComputedStyle;

  try {
    // 1. Monkey-patch getComputedStyle to intercept oklch values returned by browser computed properties
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string' && val.includes('oklch')) {
                return replaceOklchWithFallback(val);
              }
              return val;
            };
          }
          
          const val = Reflect.get(target, prop);
          if (typeof val === 'string' && val.includes('oklch')) {
            return replaceOklchWithFallback(val);
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };

    // 2. Read and replace oklch in accessible style tags and link tags
    const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));

    for (const el of styleElements) {
      if (el.tagName === 'STYLE') {
        const styleEl = el as HTMLStyleElement;
        const originalText = styleEl.textContent || '';
        if (originalText.includes('oklch')) {
          stylesBackup.push({ type: 'style', element: styleEl, originalText });
          const safeText = replaceOklchWithFallback(originalText);
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
              linkEl.disabled = true;

              const tempStyle = document.createElement('style');
              tempStyle.setAttribute('data-temp-style', 'true');
              tempStyle.textContent = replaceOklchWithFallback(cssText);
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
                tempStyle.textContent = replaceOklchWithFallback(text);
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

    // Call html2canvas with the temporary clean styles and proxies in place
    return await html2canvas(element, options);
  } finally {
    // Restore original getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;

    // Restore original stylesheets
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
