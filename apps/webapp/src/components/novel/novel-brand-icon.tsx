import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
};

export function NovelBrandIcon({ className, size = 24 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary select-none", className)}
      aria-hidden="true"
    >
      {/* Sleek outer droplet contour with dynamic gradient/alpha filling */}
      <path
        d="M12 3C8.5 7 6.5 10.5 6.5 14.5C6.5 17.5 9 20 12 20C15 20 17.5 17.5 17.5 14.5C17.5 10.5 15.5 7 12 3Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Precision fountain pen center slit */}
      <path
        d="M12 9.5V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Minimalist circular breather hole */}
      <circle
        cx="12"
        cy="9.5"
        r="1.2"
        fill="currentColor"
      />
    </svg>
  );
}
