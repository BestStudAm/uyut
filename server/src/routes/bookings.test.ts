import { describe, expect, it } from "vitest";

import {
  calcPrice,
  SERVICE_FEE_PERCENT,
} from "./bookings.js";

describe("расчёт стоимости брони", () => {
  it("считает одну ночь", () => {
    const price = calcPrice(
      "2026-09-12",
      "2026-09-13",
      4200,
    );

    expect(price.nights).toBe(1);
    expect(price.subtotal).toBe(4200);
    expect(price.serviceFee).toBe(294);
    expect(price.total).toBe(4494);
  });

  it("считает три ночи с сервисным сбором", () => {
    const price = calcPrice(
      "2026-09-12",
      "2026-09-15",
      4200,
    );

    expect(price.nights).toBe(3);
    expect(price.subtotal).toBe(12600);
    expect(price.serviceFee).toBe(882);
    expect(price.total).toBe(13482);
  });

  it("не ломается на переходе через месяц", () => {
    const price = calcPrice(
      "2026-09-29",
      "2026-10-02",
      5000,
    );

    expect(price.nights).toBe(3);
    expect(price.total).toBe(16050);
  });

  it("округляет сбор до целых рублей", () => {
    const price = calcPrice(
      "2026-09-01",
      "2026-09-02",
      3333,
    );

    // 3333 * 7% = 233.31 — в базе деньги целые, дробей быть не должно
    expect(price.serviceFee).toBe(233);
    expect(
      Number.isInteger(price.total),
    ).toBe(true);
  });

  it("считает минимум одну ночь, даже если даты совпали", () => {
    const price = calcPrice(
      "2026-09-12",
      "2026-09-12",
      4200,
    );

    expect(price.nights).toBe(1);
  });

  it("держит сбор равным заявленному проценту", () => {
    const price = calcPrice(
      "2026-09-01",
      "2026-09-11",
      1000,
    );

    expect(price.subtotal).toBe(10000);
    expect(price.serviceFee).toBe(
      (10000 * SERVICE_FEE_PERCENT) / 100,
    );
  });
});
