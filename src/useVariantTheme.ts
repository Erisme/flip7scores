import { useEffect } from 'react';

/** Applique le thème « Vengeance » (bleu foncé) tant que le composant est monté et `active` vrai */
export function useVariantTheme(active: boolean): void {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-vengeance', active);
    return () => root.classList.remove('theme-vengeance');
  }, [active]);
}
