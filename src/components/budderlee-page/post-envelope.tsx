"use client";

import Image from "next/image";
import { useRef } from "react";
import s from "./budderlee-page.module.css";

// The Budderlee Post arriving: the envelope lands addressed, flips to its
// sealed back, the wax seal breaks, the flap opens and Walter's month rises
// out while the envelope fades away. Pure CSS animation (see the module);
// the only script is the gentle tilt toward the pointer. Reduced motion
// shows the settled end state.

const FLAT_LAY = "/budderlee/post/walter-month-flat-lay.webp";
const SEAL = "/budderlee/seal.webp";

export function PostEnvelope() {
  const tilt = useRef<HTMLDivElement>(null);

  function lean(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    tilt.current?.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
    tilt.current?.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
  }
  function settle() {
    tilt.current?.style.setProperty("--ry", "0deg");
    tilt.current?.style.setProperty("--rx", "0deg");
  }

  return (
    <div className={s.stage} onPointerMove={lean} onPointerLeave={settle}>
      <div ref={tilt} className={s.tilt}>
        <div className={s.env}>
          {/* The flap side, which the envelope flips to */}
          <div className={s.back}>
            <div className={`${s.backPanel} ${s.paper} ${s.shell}`}>
              <div className={s.edge} />
            </div>
            <div className={s.contents}>
              <Image
                src={FLAT_LAY}
                alt="Walter's month from The Budderlee Post: the Tales from Budderlee gazette, his resident art card, a paper doll, a shortbread recipe card, the Budderlee sticker and a Walter iron-on"
                width={1384}
                height={869}
                sizes="(min-width: 768px) 560px, 100vw"
                priority
              />
            </div>
            <div className={`${s.pocketWrap} ${s.shell}`}>
              <div className={`${s.pocket} ${s.paper}`}>
                <div className={s.seam} />
                <div className={s.edge} />
                <div className={s.hand}>
                  <span>Good Stories</span>
                  <span>
                    Brighter Days <span className={s.heart}>♥</span>
                  </span>
                </div>
              </div>
            </div>
            <div className={s.flapGroup}>
              <div className={s.flapShadow} />
              <div className={s.flap}>
                <div className={`${s.flapFace} ${s.paper}`} />
                <div className={s.flapLiner} />
              </div>
            </div>
            <div className={s.wax} aria-hidden="true">
              <div className={s.waxBlob} />
              <div className={s.waxRing}>
                <Image src={SEAL} alt="" width={54} height={54} />
              </div>
            </div>
          </div>

          {/* The addressed front, which lands first */}
          <div className={`${s.front} ${s.paper}`} aria-hidden="true">
            <div className={s.edge} />
            <Sprig />
            <div className={s.returnAddr}>
              <div className={s.returnName}>BUDDERLEE</div>
              <div className={s.returnRule} />
              <div className={s.returnLine}>THE BUDDERLEE POST · MARKET STREET</div>
            </div>
            <div className={s.recipient}>
              <span>A Friend of Budderlee</span>
              <span>1 Front Porch Lane</span>
              <span>Anywhere, U.S.A.</span>
            </div>
            <Postmark />
            <div className={s.stamp}>
              <div className={s.stampIn}>
                <Image src={SEAL} alt="" width={66} height={66} />
                <div className={s.stampCap}>
                  Kindness
                  <br />
                  Travels Far
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Daisy className={s.daisy} style={{ left: "8%", top: "6%", animationDelay: "4.1s" }} />
      <Daisy className={s.daisy} style={{ left: "88%", top: "2%", width: 22, animationDelay: "5.9s" }} />
    </div>
  );
}

function Sprig() {
  return (
    <svg className={s.sprig} viewBox="0 0 200 90" aria-hidden="true">
      <path d="M6 78 C60 66 110 44 194 14" fill="none" stroke="#5a6630" strokeWidth="2" strokeLinecap="round" />
      <g fill="#66733a">
        <ellipse cx="38" cy="62" rx="15" ry="5.5" transform="rotate(-48 38 62)" />
        <ellipse cx="46" cy="78" rx="14" ry="5" transform="rotate(20 46 78)" />
        <ellipse cx="78" cy="48" rx="16" ry="5.5" transform="rotate(-52 78 48)" />
        <ellipse cx="88" cy="64" rx="15" ry="5" transform="rotate(16 88 64)" />
        <ellipse cx="118" cy="34" rx="15" ry="5" transform="rotate(-55 118 34)" />
        <ellipse cx="128" cy="49" rx="14" ry="5" transform="rotate(12 128 49)" />
        <ellipse cx="156" cy="22" rx="13" ry="4.5" transform="rotate(-58 156 22)" />
        <ellipse cx="164" cy="34" rx="12" ry="4.5" transform="rotate(8 164 34)" />
        <ellipse cx="190" cy="12" rx="10" ry="4" transform="rotate(-20 190 12)" />
      </g>
    </svg>
  );
}

function Postmark() {
  const wave = (y: number) => `M78 ${y} q14 -7 28 0 t28 0 t28 0 t28 0 t28 0`;
  return (
    <svg className={s.cancel} viewBox="0 0 220 80" aria-hidden="true">
      <g fill="none" stroke="#6f5a3a" strokeWidth="1.6">
        <circle cx="40" cy="40" r="30" />
        <circle cx="40" cy="40" r="24" strokeWidth=".8" />
        {[22, 34, 46, 58].map((y) => (
          <path key={y} d={wave(y)} />
        ))}
      </g>
      <g fill="#6f5a3a" fontFamily="var(--font-cinzel), serif" fontWeight="700" textAnchor="middle">
        <text x="40" y="38" fontSize="7">BUDDERLEE</text>
        <text x="40" y="49" fontSize="8">POST</text>
      </g>
    </svg>
  );
}

function Daisy({ className, style }: { className: string; style: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 30 30" aria-hidden="true">
      <g fill="#fffaf0" stroke="#e6dcc0" strokeWidth=".6">
        {[0, 45, 90, 135].map((a) => (
          <g key={a} transform={`rotate(${a} 15 15)`}>
            <ellipse cx="15" cy="6" rx="3.4" ry="6" />
            <ellipse cx="15" cy="24" rx="3.4" ry="6" />
          </g>
        ))}
      </g>
      <circle cx="15" cy="15" r="3.6" fill="#f0b429" />
    </svg>
  );
}
