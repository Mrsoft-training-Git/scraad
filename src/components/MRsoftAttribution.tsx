import mrsoftLogo from "@/assets/mrsoft-logo.jpeg";
import { cn } from "@/lib/utils";

interface MRsoftAttributionProps {
  className?: string;
  textClassName?: string;
  logoClassName?: string;
}

export const MRsoftAttribution = ({
  className,
  textClassName,
  logoClassName,
}: MRsoftAttributionProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <span className={cn("text-xs text-muted-foreground", textClassName)}>
        Product of
      </span>
      <a
        href="https://m-rinternational.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="MRsoft - M-R International"
        className="bg-white rounded-md px-2 py-1 flex items-center hover:opacity-90 transition-opacity shadow-sm"
      >
        <img
          src={mrsoftLogo}
          alt="MRsoft"
          className={cn("h-4 w-auto object-contain", logoClassName)}
        />
      </a>
    </div>
  );
};
