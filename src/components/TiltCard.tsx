import { useRef, ReactNode, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

/**
 * 3D tilt card driven by pointer position.
 * Disabled on touch and reduced-motion via CSS.
 */
export const TiltCard = ({ children, className, intensity = 8 }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
    if (reduced || isTouch) return;
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `perspective(1000px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateY(-4px)`;
  };

  const handleLeave = () => {
    const node = ref.current;
    if (node) node.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn("transition-transform duration-300 ease-out will-change-transform", className)}
    >
      {children}
    </div>
  );
};
