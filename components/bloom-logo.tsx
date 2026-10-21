import Image from "next/image";

interface BloomLogoProps {
  size?: number;
  className?: string;
  rounded?: string;
}

export function BloomLogo({ size = 40, className = "", rounded = "14" }: BloomLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 overflow-hidden bg-[#fff7fb] shadow-[0_12px_28px_-22px_rgba(161,42,96,0.68)] ${className}`}
      style={{ width: size, height: size, borderRadius: `${rounded}px` }}
    >
      <Image src="/logo-core.png" alt="" fill sizes={`${size}px`} className="object-cover" priority={size >= 50} />
    </span>
  );
}
