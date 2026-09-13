"use client";

import React from "react";

// A submit button that asks first. Used for the irreversible actions on
// the Fulfillment page (marking a whole issue shipped).
export function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
