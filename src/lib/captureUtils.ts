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
  // Save original scroll positions
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // Scroll to top-left of the viewport to completely avoid any scrolling/viewport cuts in html2canvas
  window.scrollTo(0, 0);

  const stylesBackup: Array<
    | { type: 'style'; element: HTMLStyleElement; originalText: string }
    | { type: 'link'; element: HTMLLinkElement; originalDisabled: boolean }
    | { type: 'temp'; element: HTMLStyleElement }
  > = [];

  const originalGetComputedStyle = window.getComputedStyle;

  try {
    // 1. Monkey-patch getComputedStyle safely using prototype delegation instead of Proxy
    // This avoids throwing TypeErrors on non-configurable/non-writable internal browser properties
    window.getComputedStyle = function (elt, pseudoElt) {
      const style = originalGetComputedStyle(elt, pseudoElt);
      const wrapper = Object.create(style);

      wrapper.getPropertyValue = function (propertyName: string) {
        const val = style.getPropertyValue(propertyName);
        if (typeof val === 'string' && val.includes('oklch')) {
          return replaceOklchWithFallback(val);
        }
        return val;
      };

      const colorProps = [
        'color', 'backgroundColor', 'borderColor', 
        'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 
        'fill', 'stroke'
      ];
      
      for (const prop of colorProps) {
        Object.defineProperty(wrapper, prop, {
          get() {
            const val = (style as any)[prop];
            if (typeof val === 'string' && val.includes('oklch')) {
              return replaceOklchWithFallback(val);
            }
            return val;
          },
          configurable: true,
          enumerable: true
        });
      }

      return wrapper;
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

    // Call html2canvas with the temporary clean styles, forcing scroll options to 0 since we scrolled to top
    return await html2canvas(element, {
      ...options,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    // Restore original getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;

    // Restore original scroll positions
    window.scrollTo(originalScrollX, originalScrollY);

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
