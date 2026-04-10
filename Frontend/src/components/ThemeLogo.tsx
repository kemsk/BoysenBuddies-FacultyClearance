import { useTheme } from '../hooks/useTheme';

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

export function ThemeLogo({ className = "", alt = "Faculty ClearTrack" }: ThemeLogoProps) {
  const isDark = useTheme();
  
  const logoSrc = isDark 
    ? "/Pen Swish White_FacultyClearTrack.png"
    : "/Pen Swish Dark Blue_FacultyClearTrack.png";

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={className}
    />
  );
}
