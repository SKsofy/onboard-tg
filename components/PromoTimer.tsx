"use client";

// Личный таймер промокода из поста: 24 часа с момента первого захода
// (дедлайн в localStorage, назначается на старте — переживает
// перезагрузку). После истечения полоска меняет текст, цена НЕ
// меняется (обещание «49 р.» с вау-экрана нарушать нельзя).

import { useEffect, useState } from "react";

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function PromoTimer({
  deadline,
  onExpired,
}: {
  deadline: number;
  onExpired: () => void;
}) {
  const [left, setLeft] = useState(() =>
    deadline ? deadline - Date.now() : 0
  );

  useEffect(() => {
    if (!deadline) return;
    setLeft(deadline - Date.now());
    const id = setInterval(() => {
      const rest = deadline - Date.now();
      setLeft(rest);
      if (rest <= 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    if (deadline && left <= 0) onExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0]);

  if (!deadline) return null;

  if (left <= 0) {
    return (
      <div className="timer-strip">
        Промокод из поста истёк — но доступ ещё можно забрать по той же цене
      </div>
    );
  }

  return (
    <div className="timer-strip timer-strip--big">
      <div className="timer-strip__label">Цена по промокоду из поста</div>
      <div className="timer-strip__digits">{fmt(left)}</div>
    </div>
  );
}
