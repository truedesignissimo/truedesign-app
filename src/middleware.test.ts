import { describe, expect, it } from "vitest";
import {
  getCatalogAppPath,
  isProtectedPath,
  shouldTrackAppNavigation,
} from "./middleware";

describe("protected routes", () => {
  it("protects the account areas", () => {
    expect(isProtectedPath("/apps/true-generatore-offerte")).toBe(false);
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("maps nested app routes to the catalog URL", () => {
    expect(getCatalogAppPath("/apps/true-sondaggio-iconici/api")).toBe(
      "/apps/true-sondaggio-iconici"
    );
  });
});

describe("app usage tracking", () => {
  it("tracks a real browser document navigation", () => {
    const request = new Request("https://www.truedesign.app/apps/example", {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "sec-fetch-dest": "document",
      },
    });

    expect(shouldTrackAppNavigation(request)).toBe(true);
  });

  it("does not track Next.js prefetch or RSC requests", () => {
    const prefetch = new Request("https://www.truedesign.app/apps/example", {
      headers: {
        accept: "text/x-component",
        "next-router-prefetch": "1",
        "sec-fetch-dest": "empty",
      },
    });
    const rsc = new Request("https://www.truedesign.app/apps/example", {
      headers: { accept: "text/x-component", rsc: "1" },
    });

    expect(shouldTrackAppNavigation(prefetch)).toBe(false);
    expect(shouldTrackAppNavigation(rsc)).toBe(false);
  });

  it("falls back to the HTML accept header when fetch metadata is unavailable", () => {
    const request = new Request("https://www.truedesign.app/apps/example", {
      headers: { accept: "text/html" },
    });

    expect(shouldTrackAppNavigation(request)).toBe(true);
  });

  it("does not track non-document or non-GET requests", () => {
    const image = new Request("https://www.truedesign.app/apps/example/logo.png", {
      headers: { accept: "image/avif,image/webp", "sec-fetch-dest": "image" },
    });
    const post = new Request("https://www.truedesign.app/apps/example", {
      method: "POST",
      headers: { accept: "text/html", "sec-fetch-dest": "document" },
    });

    expect(shouldTrackAppNavigation(image)).toBe(false);
    expect(shouldTrackAppNavigation(post)).toBe(false);
  });
});
