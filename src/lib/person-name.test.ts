import { describe, expect, it } from "vitest";
import { firstName } from "./person-name";

describe("firstName", () => {
  it("prefers the profile full name", () => {
    expect(firstName({
      profileName: "Dario Breggie",
      metadataFirstName: "Wrong",
      email: "wrong@example.com",
    })).toBe("Dario");
  });

  it("uses Auth first_name when the profile is empty", () => {
    expect(firstName({
      metadataFirstName: "Maurizio",
      metadataFullName: "Wrong Name",
      email: "wrong@example.com",
    })).toBe("Maurizio");
  });

  it("uses the first word of Auth full_name before the email", () => {
    expect(firstName({
      metadataFullName: "Valentina Marchioro",
      email: "wrong@example.com",
    })).toBe("Valentina");
  });

  it("uses the local email part only as a last resort", () => {
    expect(firstName({ email: "dario.breggie@truedesign.it" })).toBe("dario");
  });
});
