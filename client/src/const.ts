import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Starts the independent single-user login flow. */
export const startLogin = () => {
  if (typeof window !== "undefined") window.location.href = "/api/personal-login";
};
