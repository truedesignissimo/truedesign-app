import { describe, expect, it, vi } from "vitest";
import { syncUserApps } from "./user-app-sync";

function gatewayWith(current: string[]) {
  return {
    list: vi.fn().mockResolvedValue(current),
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

describe("syncUserApps", () => {
  it("adds missing assignments and removes stale assignments", async () => {
    const gateway = gatewayWith(["offers", "legacy"]);

    const result = await syncUserApps("user-1", ["offers", "survey"], gateway);

    expect(gateway.add).toHaveBeenCalledWith("user-1", ["survey"]);
    expect(gateway.remove).toHaveBeenCalledWith("user-1", ["legacy"]);
    expect(result).toEqual(["offers", "survey"]);
  });

  it("removes every assignment when the desired set is empty", async () => {
    const gateway = gatewayWith(["offers", "survey"]);

    await syncUserApps("user-1", [], gateway);

    expect(gateway.add).not.toHaveBeenCalled();
    expect(gateway.remove).toHaveBeenCalledWith("user-1", ["offers", "survey"]);
  });

  it("performs no writes when assignments already match", async () => {
    const gateway = gatewayWith(["survey"]);

    await syncUserApps("user-1", ["survey"], gateway);

    expect(gateway.add).not.toHaveBeenCalled();
    expect(gateway.remove).not.toHaveBeenCalled();
  });
});
