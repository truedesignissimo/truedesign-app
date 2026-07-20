import { describe, expect, it } from "vitest";
import { createOffersRepository } from "./offers-repository";
import type { Offer } from "../domain/types";
import { createEmptyOffer } from "../state/offer-reducer";

const offer: Offer = {
  ...createEmptyOffer("user-1", "offer-1", "2026-07-20T00:00:00.000Z"),
  number: "OFF-1",
  customer: { name: "Cliente" },
  project: { reference: "Hotel" },
};

class Query {
  filters: Array<[string, unknown]> = [];
  operation = "";
  payload: unknown;
  constructor(private readonly returnedPayload: unknown = offer) {}
  select() { this.operation ||= "select"; return this; }
  upsert(payload: unknown) { this.operation = "upsert"; this.payload = payload; return this; }
  delete() { this.operation = "delete"; return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  order() { return Promise.resolve({ data: [{ payload: this.returnedPayload }], error: null }); }
  single() { return Promise.resolve({ data: { payload: this.returnedPayload }, error: null }); }
  then(resolve: (value: unknown) => void) { return Promise.resolve({ data: null, error: null }).then(resolve); }
}

describe("offers repository", () => {
  it("always scopes list queries to the authenticated user", async () => {
    const query = new Query();
    const repository = createOffersRepository({ from: () => query } as never);
    const offers = await repository.listOffers("user-1");
    expect(query.filters).toContainEqual(["user_id", "user-1"]);
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject(offer);
  });

  it("writes the user id both as a column and inside the payload", async () => {
    const query = new Query();
    const repository = createOffersRepository({ from: () => query } as never);
    await repository.saveOffer(offer);
    expect(query.operation).toBe("upsert");
    expect(query.payload).toMatchObject({ id: "offer-1", user_id: "user-1", payload: { userId: "user-1" } });
  });

  it("normalizes reduced saved payloads before returning them", async () => {
    const query = new Query({
      id: "legacy-1",
      userId: "user-1",
      number: "OLD-1",
      priceList: "ITAENG",
      customer: { name: "Cliente storico" },
      project: {},
      lines: [],
      globalDiscountPercent: 0,
    });
    const repository = createOffersRepository({ from: () => query } as never);

    const [normalized] = await repository.listOffers("user-1");

    expect(normalized).toMatchObject({
      schemaVersion: 3,
      userId: "user-1",
      vatRate: 22,
      globalDiscount: "0",
      customer: { name: "Cliente storico", vatNumber: "" },
    });
  });
});
