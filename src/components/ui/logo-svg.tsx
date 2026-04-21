"use client";

/**
 * LogoSvg Component
 * Planymaps logo using the official SVG asset
 * Accepts size props and optional className for flexible usage
 */

interface LogoSvgProps {
  className?: string;
  alt?: string;
}

export function LogoSvg({
  className = "",
  alt = "Planymaps Logo",
}: LogoSvgProps) {
  return <img src="/planymaps.svg" alt={alt} className={className} />;
}

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = "" }: LogoIconProps) {
  return (
    <img
      src="/planymaps.svg"
      alt="Planymaps"
      width={size}
      height={size}
      className={className}
    />
  );
}
