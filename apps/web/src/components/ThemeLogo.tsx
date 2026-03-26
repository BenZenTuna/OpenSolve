'use client';

import Image from 'next/image';
import { useTheme } from '@/components/ThemeProvider';

interface ThemeLogoProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function ThemeLogo({ lightSrc, darkSrc, alt, width, height, className, priority }: ThemeLogoProps) {
  const { theme } = useTheme();
  return (
    <Image
      src={theme === 'dark' ? darkSrc : lightSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
