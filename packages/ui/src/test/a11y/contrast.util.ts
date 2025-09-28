// Minimal WCAG contrast helpers for deterministic tests
type RGB = { r: number; g: number; b: number };

const srgbToLin = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const relLuminance = ({ r, g, b }: RGB) =>
  0.2126 * srgbToLin(r / 255) +
  0.7152 * srgbToLin(g / 255) +
  0.0722 * srgbToLin(b / 255);

const parseColor = (css: string): RGB | null => {
  // Simple regex-based parsing for common CSS color formats
  // This works better in jsdom than canvas-based parsing
  
  if (!css || css.trim() === '') {
    return null;
  }
  
  const trimmedCss = css.trim();
  
  // Handle rgb/rgba
  const rgbMatch = trimmedCss.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }
  
  // Handle hex colors
  const hexMatch = trimmedCss.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch && hexMatch[1]) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      // Short hex: #abc -> #aabbcc
      return {
        r: parseInt(hex[0]! + hex[0]!, 16),
        g: parseInt(hex[1]! + hex[1]!, 16),
        b: parseInt(hex[2]! + hex[2]!, 16),
      };
    } else {
      // Long hex: #aabbcc
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }
  
  // Handle named colors (basic set)
  const namedColors: Record<string, RGB> = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    cyan: { r: 0, g: 255, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    transparent: { r: 0, g: 0, b: 0 }, // treat transparent as black for contrast
    
    // System colors (jsdom fallbacks)
    buttontext: { r: 0, g: 0, b: 0 }, // dark text on buttons
    buttonface: { r: 240, g: 240, b: 240 }, // light button background
    windowtext: { r: 0, g: 0, b: 0 }, // dark text
    window: { r: 255, g: 255, b: 255 }, // white background
    highlighttext: { r: 255, g: 255, b: 255 }, // white text on selection
    highlight: { r: 0, g: 120, b: 215 }, // blue selection background
    captiontext: { r: 0, g: 0, b: 0 }, // dark caption text
    menutext: { r: 0, g: 0, b: 0 }, // dark menu text
    menu: { r: 255, g: 255, b: 255 }, // white menu background
  };
  
  const lowerCss = trimmedCss.toLowerCase();
  if (namedColors[lowerCss]) {
    return namedColors[lowerCss];
  }
  
  // Debug logging for unparseable colors
  if (process.env.NODE_ENV === 'development') {
    console.log(`[contrast] unparseable color: "${css}"`);
  }
  
  return null;
};

export const contrastRatio = (fgCss: string, bgCss: string): number => {
  const fg = parseColor(fgCss);
  const bg = parseColor(bgCss);
  if (!fg || !bg) return NaN;
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getElementContrast = (el: Element): number => {
  const cs = getComputedStyle(el as HTMLElement);
  let fg = cs.color;
  
  // Fallback for empty or invalid foreground colors
  if (!fg || fg.trim() === '') {
    // Default to black text for most elements
    fg = 'black';
  }
  
  // Walk up for background (handles transparent layers reasonably)
  let bgEl: Element | null = el;
  let bg = 'rgb(255,255,255)'; // default white if nothing found
  while (bgEl && bgEl !== document.documentElement) {
    const s = getComputedStyle(bgEl as HTMLElement);
    const c = s.backgroundColor;
    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
      bg = c;
      break;
    }
    bgEl = bgEl.parentElement;
  }
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[contrast] element: ${el.tagName}, fg: "${fg}", bg: "${bg}"`);
  }
  
  return contrastRatio(fg, bg);
};
