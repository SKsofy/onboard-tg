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
      </head>
      <body>{children}</body>
    </html>
  );
}
