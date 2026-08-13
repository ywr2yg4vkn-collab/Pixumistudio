import { describe, expect, it, afterEach } from "vitest";
import { isPersonalAuthConfigured, PERSONAL_COOKIE_NAME } from "./_core/personalAuth";

const previousPassword = process.env.PERSONAL_PASSWORD;

afterEach(() => {
  if (previousPassword === undefined) delete process.env.PERSONAL_PASSWORD;
  else process.env.PERSONAL_PASSWORD = previousPassword;
});

describe("personal authentication configuration", () => {
  it("requires a password with at least eight characters", () => {
    process.env.PERSONAL_PASSWORD = "short";
    expect(isPersonalAuthConfigured()).toBe(false);
    process.env.PERSONAL_PASSWORD = "personal-pass-123";
    expect(isPersonalAuthConfigured()).toBe(true);
  });

  it("uses a dedicated session cookie name", () => {
    expect(PERSONAL_COOKIE_NAME).toBe("pixumi_personal_session");
  });
});
