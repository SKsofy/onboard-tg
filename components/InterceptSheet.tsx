"use client";

import { PRICES, TG_LINK } from "@/lib/funnel/data";

// А/Б: скидка 39 р. по промокоду — ТОЛЬКО здесь, не на основном
// пейволле (хендофф). Пока выключено.
const INTERCEPT_DISCOUNT = false;

export default function InterceptSheet({
  onStay,
  onTgLink,
}: {
  onStay: () => void;
  onTgLink: () => void;
}) {
  return (
    <div className="intercept-overlay" onClick={onStay}>
      <div className="intercept-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="intercept-sheet__title">Уходите без своего плана?</div>
        <div className="intercept-sheet__text">
          Мы сохранили подборку из 5 эффектов — она будет ждать вас.
        </div>
        <button className="intercept-sheet__primary" onClick={onStay}>
          {INTERCEPT_DISCOUNT
            ? `Забрать за ${PRICES.interceptPromo} р. по промокоду`
            : `Забрать за ${PRICES.trial} р.`}
        </button>
        <a
          className="intercept-sheet__secondary"
          href={TG_LINK}
          onClick={onTgLink}
        >
          Прислать ссылку в Телеграм
        </a>
      </div>
    </div>
  );
}
