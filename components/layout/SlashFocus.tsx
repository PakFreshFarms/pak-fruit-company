"use client";

import { useEffect } from "react";

/** Focuses the page's primary search box when "/" is pressed anywhere outside an active input (spec section 8). */
export function SlashFocus() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const active = document.activeElement;
      const isTyping = active instanceof HTMLElement && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
      if (isTyping) return;
      const target = document.querySelector<HTMLInputElement>("[data-slash-focus]");
      if (target) {
        e.preventDefault();
        target.focus();
        target.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return null;
}
