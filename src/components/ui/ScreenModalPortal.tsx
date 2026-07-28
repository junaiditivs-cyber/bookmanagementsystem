import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ScreenModalPortalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: React.ReactNode;
}

export default function ScreenModalPortal({
  children,
  className = "",
  ...props
}: ScreenModalPortalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex min-h-full items-center justify-center overflow-y-auto bg-transparent px-3 py-6 backdrop-blur-[2px] sm:px-6 ${className}`}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}