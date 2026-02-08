"use client";

import Image from "next/image";

/** Shared logo from public/logo.png - plain background, no box. */
export function Logo({
  size = 34,
  className,
  alt = "AutoResolve",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden ${className ?? ""}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <Image
        src="/logo.png"
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        priority
        sizes={`${size}px`}
      />
    </span>
  );
}
