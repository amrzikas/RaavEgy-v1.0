/**
 * Dynamic Next-Gen Image Optimization Utility for luxury fast loading (Lighthouse Pro)
 * This helper dynamically rewrites Unsplash URLs to inject optimized sizing and quality constraints.
 * It drastically reduces image payloads on mobile networks, solving speed and layout shift issues
 * while maintaining the high-definition luxury aesthetic.
 */

export function optimizeUnsplashUrl(url: string | undefined, width: number, quality = 70): string {
  if (!url) return '';
  
  // If not an Unsplash URL, return as-is
  if (!url.includes('images.unsplash.com')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    
    // Inject size, quality and high-compression modern formats (webp/auto)
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('fit', 'crop');
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', quality.toString());
    
    return urlObj.toString();
  } catch (error) {
    // Fallback if URL parsing fails: append securely
    if (url.includes('?')) {
      return `${url.split('?')[0]}?auto=format&fit=crop&w=${width}&q=${quality}`;
    }
    return `${url}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }
}

/**
 * Hook or check to dynamically choose a size based on mobile vs desktop.
 * Helpful for critical above-the-fold content like Hero banners.
 */
export function getResponsiveUnsplashWidth(isMobile: boolean, desktopWidth = 1200, mobileWidth = 600): number {
  return isMobile ? mobileWidth : desktopWidth;
}
