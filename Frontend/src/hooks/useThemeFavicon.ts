import { useEffect } from 'react';

export function useThemeFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = hasDarkClass || prefersDark;
      
      const faviconPath = isDark 
        ? '/Pen Swish White_FacultyClearTrack.png'
        : '/Pen Swish Dark Blue_FacultyClearTrack.png';
      
      // Update favicon
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        document.head.appendChild(link);
      }
      link.href = faviconPath;

      // Update apple-touch-icon as well
      let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = faviconPath;
    };

    // Initial update
    updateFavicon();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      updateFavicon();
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateFavicon();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, []);
}
