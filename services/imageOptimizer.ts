import { createHash } from 'crypto';
import NodeCache from 'node-cache';

// Image optimization and caching service
class ImageOptimizationService {
  private cache = new NodeCache({ 
    stdTTL: 86400, // 24 hours
    maxKeys: 1000,
    useClones: false 
  });

  // Generate optimized Unsplash URLs
  optimizeUnsplashUrl(originalUrl: string, width?: number, height?: number): string {
    try {
      const url = new URL(originalUrl);
      
      // Apply optimizations
      if (width) url.searchParams.set('w', Math.min(width, 2000).toString());
      if (height) url.searchParams.set('h', Math.min(height, 2000).toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('q', '80');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('fm', 'webp');
      
      return url.toString();
    } catch {
      return originalUrl;
    }
  }

  // Generate local flag SVG for faster loading
  generateFlagSvg(countryCode: string, width = 80, height = 60): string {
    const code = countryCode.toUpperCase();
    
    // Common flag colors based on country codes
    const flagColors: Record<string, { bg: string; text: string }> = {
      'US': { bg: '#B22234', text: '#FFFFFF' },
      'GB': { bg: '#012169', text: '#FFFFFF' },
      'DE': { bg: '#000000', text: '#FFCE00' },
      'FR': { bg: '#0055A4', text: '#FFFFFF' },
      'JP': { bg: '#BC002D', text: '#FFFFFF' },
      'CN': { bg: '#DE2910', text: '#FFDE00' },
      'CA': { bg: '#FF0000', text: '#FFFFFF' },
      'AU': { bg: '#012169', text: '#FFFFFF' },
      'BR': { bg: '#009739', text: '#FFDF00' },
      'IN': { bg: '#FF9933', text: '#FFFFFF' }
    };

    const colors = flagColors[code] || { bg: '#6B7280', text: '#FFFFFF' };

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${colors.bg}" stroke="#D1D5DB" stroke-width="1"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${colors.text}" 
              font-family="Arial, sans-serif" font-size="12" font-weight="bold">
          ${code}
        </text>
      </svg>
    `;
  }

  // Cache and optimize images
  async cacheOptimizedImage(url: string, optimizations?: { width?: number; height?: number }): Promise<string> {
    const cacheKey = createHash('md5').update(url + JSON.stringify(optimizations)).digest('hex');
    
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    let optimizedUrl = url;

    // Apply optimizations based on URL patterns
    if (url.includes('unsplash.com')) {
      optimizedUrl = this.optimizeUnsplashUrl(url, optimizations?.width, optimizations?.height);
    } else if (url.includes('flagcdn.com')) {
      const flagMatch = url.match(/\/([a-z]{2})\.png/);
      if (flagMatch) {
        const countryCode = flagMatch[1];
        optimizedUrl = `/api/flag/${countryCode}`;
      }
    }

    this.cache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      size: this.cache.getStats()
    };
  }

  // Clear cache
  clearCache() {
    this.cache.flushAll();
  }
}

export const imageOptimizer = new ImageOptimizationService();