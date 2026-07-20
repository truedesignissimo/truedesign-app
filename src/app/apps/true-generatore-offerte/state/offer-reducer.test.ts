import { describe, expect, it } from "vitest";
import { createEmptyOffer, offerReducer } from "./offer-reducer";
import type { OfferLine } from "../domain/types";

const configuredLine: OfferLine = {
  id: "line-1",
  productCode: "AB 1000",
  quantity: 1,
  unitPrice: 1000,
  pricesByList: { ITAENG: 1000, ENGFRA: 1250 },
  extras: [80],
  extrasByList: { ITAENG: [80], ENGFRA: [90] },
  discount: "0",
  manualSurcharge: 0,
  note: "",
  configuration: { fabric: "Camira Era CSE30", finish: "Ashwood" },
};

describe("offerReducer", () => {
  it("adds, updates and removes a line immutably", () => {
    const initial = createEmptyOffer("user-1", "offer-1", "2026-07-20T00:00:00.000Z");
    const added = offerReducer(initial, { type: "line/add", line: configuredLine });
    const updated = offerReducer(added, { type: "line/update", lineId: "line-1", patch: { quantity: 3 } });
    const removed = offerReducer(updated, { type: "line/remove", lineId: "line-1" });

    expect(initial.lines).toHaveLength(0);
    expect(added.lines[0].quantity).toBe(1);
    expect(updated.lines[0].quantity).toBe(3);
    expect(removed.lines).toHaveLength(0);
  });

  it("switches price list without losing product configuration", () => {
    const initial = {
      ...createEmptyOffer("user-1", "offer-1", "2026-07-20T00:00:00.000Z"),
      lines: [configuredLine],
    };
    const switched = offerReducer(initial, { type: "price-list/set", priceList: "ENGFRA" });

    expect(switched.lines[0].unitPrice).toBe(1250);
    expect(switched.lines[0].extras).toEqual([90]);
    expect(switched.lines[0].configuration).toEqual(configuredLine.configuration);
  });
});
