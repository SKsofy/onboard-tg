import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Волшебный — крутые фото из обычных селфи",
  description:
    "Два вопроса — и подборка из 5 эффектов под ваш запрос. Первый результат через минуту после загрузки фото.",
  robots: { index: false }, // страница воронки, не для поиска
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximum-scale НЕ ставим: он блокирует пинч-зум (WCAG 1.4.4).
  themeColor: "#141218",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Превью экрана 1 — background-image, браузер находит их поздно;
            preload качает сразу с HTML (4 × 20–65 КБ). */}
        <link rel="preload" as="image" href="/img/dating-q1.jpg" />
        <link rel="preload" as="image" href="/img/social-q1.jpg" />
        <link rel="preload" as="image" href="/img/work-q1.jpg" />
        <link rel="preload" as="image" href="/img/self-q1.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
