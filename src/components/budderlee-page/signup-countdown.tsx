"use client";

import { useEffect, useState } from "react";
import s from "./budderlee-page.module.css";

const UNITS = ["days", "hrs", "min", "sec"] as const;

function remaining(deadline: number) {
  const t = Math.max(0, deadline - Date.now()) / 1000;
  return [Math.floor(t / 86400), Math.floor((t % 86400) / 3600), Math.floor((t % 3600) / 60), Math.floor(t % 60)];
}

/** Ticks down to the signup cutoff for the next mailing. */
export function SignupCountdown({ deadline, label }: { deadline: string; label: React.ReactNode }) {
  const end = new Date(deadline).getTime();
  // Rendered empty on the server so the first client render matches; the
  // numbers fill in on mount.
  const [parts, setParts] = useState<number[] | null>(null);

  useEffect(() => {
    const tick = () => setParts(remaining(end));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  return (
    <div className={s.countdown} role="timer" aria-live="off">
      <div className="text-[13px] leading-snug text-on-surface-muted max-w-[180px]">{label}</div>
      <div className={s.countdownUnits}>
        {UNITS.map((unit, i) => (
          <div key={unit} className={s.countdownUnit}>
            <b>{parts ? String(parts[i]).padStart(i ? 2 : 1, "0") : "–"}</b>
            <span>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
