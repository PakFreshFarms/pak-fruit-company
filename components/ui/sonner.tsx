"use client";
import { Toaster as Sonner } from "sonner";

function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "bg-card! text-foreground! border-border!",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
