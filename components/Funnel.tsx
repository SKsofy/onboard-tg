"use client";

// Вся воронка — один клиентский компонент без роутинга между
// экранами: переходы мгновенные (требование ТЗ — тап по варианту
// сразу ведёт дальше, каждый экран < 1.5 с в браузере Telegram).

import InterceptSheet from "./InterceptSheet";
import LoaderScreen from "./LoaderScreen";
import Paywall from "./Paywall";
import Quiz1 from "./Quiz1";
import Quiz2 from "./Quiz2";
import SuccessScreen from "./SuccessScreen";
import { useFunnel } from "@/lib/funnel/useFunnel";

export default function Funnel() {
  const f = useFunnel();
  const scenario = f.scenario ?? "self";

  return (
    <>
      {f.step === "q1" && <Quiz1 onPick={f.pickScenario} />}
      {f.step === "q2" && <Quiz2 scenario={scenario} onPick={f.pickPain} />}
      {f.step === "loader" && (
        <LoaderScreen scenario={scenario} loaderN={f.loaderN} />
      )}
      {f.step === "paywall" && (
        <Paywall
          scenario={scenario}
          saved={f.saved}
          paying={f.paying}
          onBack={f.openIntercept}
          onPay={f.pay}
        />
      )}
      {f.step === "success" && (
        <SuccessScreen scenario={scenario} onGoToApp={f.goToApp} />
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
