import { describe, expect, it } from "vitest";
import { createOffersRepository } from "./offers-repository";
import type { Offer } from "../domain/types";

const offer: Offer = {
  id: "offer-1", userId: "user-1", number: "OFF-1", priceList: "ITAENG", currency: "EUR",
  customer: { name: "Cliente" }, project: { reference: "Hotel" }, lines: [],
  globalDiscountPercent: 0, createdAt: "2026-07-20T00:00:00.000Z", updatedAt: "2026-07-20T00:00:00.000Z",
};

class Query {
  filters: Array<[string, unknown]> = [];
  operation = "";
  payload: unknown;
  select() { this.operation ||= "select"; return this; }
  upsert(payload: unknown) { this.operation = "upsert"; this.payload = payload; return this; }
  delete() { this.operation = "delete"; return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  order() { return Promise.resolve({ data: [{ payload: offer }], error: null }); }
  single() { return Promise.resolve({ data: { payload: offer }, error: null }); }
  then(resolve: (value: unknown) => void) { return Promise.resolve({ data: null, error: null }).then(resolve); }
}

describe("offers repository", () => {
  it("always scopes list queries to the authenticated user", async () => {
    const query = new Query();
    const repository = createOffersRepository({ from: () => query } as never);
    const offers = await repository.listOffers("user-1");
    expect(query.filters).toContainEqual(["user_id", "user-1"]);
    expect(offers).toEqual([offer]);
  });

  it("writes the user id both as a column and inside the payload", async () => {
    const query = new Query();
    const repository = createOffersRepository({ from: () => query } as never);
    await repository.saveOffer(offer);
    expect(query.operation).toBe("upsert");
    expect(query.payload).toMatchObject({ id: "offer-1", user_id: "user-1", payload: { userId: "user-1" } });
  });
});
