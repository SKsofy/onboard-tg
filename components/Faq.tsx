"use client";

import { useState } from "react";
import { FAQ } from "@/lib/funnel/data";

export default function Faq() {
  const [open, setOpen] = useState(-1); // один открытый пункт

  return (
    <div className="faq">
      {FAQ.map((f, i) => (
        <div key={i} className="faq__item">
          <button
            className="faq__q"
            onClick={() => setOpen((p) => (p === i ? -1 : i))}
            aria-expanded={open === i}
          >
            <span>{f.q}</span>
            <span className="faq__chev">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <div className="faq__a">{f.a}</div>}
        </div>
      ))}
    </div>
  );
}
