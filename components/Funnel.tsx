"use client";

// Вся воронка — один клиентский компонент без роутинга между
// экранами: переходы мгновенные, каждый экран < 1.5 с в браузере
// Telegram. Флоу v2: вау до/после → пейволл с таймером → успех.

import InterceptSheet from "./InterceptSheet";
import Paywall from "./Paywall";
import SuccessScreen from "./SuccessScreen";
import WowScreen from "./WowScreen";
import { useFunnel } from "@/lib/funnel/useFunnel";

export default function Funnel() {
  const f = useFunnel();

  return (
    <>
      {f.step === "wow" && (
        <WowScreen scenario={f.scenario} onCta={f.goToPaywall} />
      )}
      {f.step === "paywall" && (
        <Paywall
          scenario={f.scenario}
          saved={f.saved}
          paying={f.paying}
          deadline={f.deadline}
          onBack={f.openIntercept}
          onPay={f.pay}
          onTimerExpired={f.onTimerExpired}
        />
      )}
      {f.step === "success" && (
        <SuccessScreen scenario={f.scenario} onGoToApp={f.goToApp} />
      )}
      {f.intercept && (
        <InterceptSheet
          onStay={() => f.closeIntercept("stay")}
          onTgLink={() => f.closeIntercept("tg_link")}
        />
      )}
    </>
  );
}
