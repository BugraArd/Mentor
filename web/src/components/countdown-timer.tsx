"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <span className="text-red-500 font-semibold text-sm">Süre doldu</span>
    );
  }

  const totalHours =
    timeLeft.days * 24 + timeLeft.hours;
  const colorClass =
    totalHours < 1
      ? "text-time font-bold"
      : totalHours < 24
      ? "text-time"
      : "text-ink";

  return (
    <span className={`text-sm tabular-nums ${colorClass}`}>
      {timeLeft.days > 0 && (
        <>{timeLeft.days}g{" "}</>
      )}
      {timeLeft.hours > 0 && (
        <>{timeLeft.hours}s{" "}</>
      )}
      {timeLeft.minutes}d{" "}
      {timeLeft.seconds}sn
    </span>
  );
}

function calcTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
}
