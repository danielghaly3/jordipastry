import { describe, expect, it } from "vitest";
import { normalizeEgyptPhone, normalizeWhatsApp, prettyPhone, whatsappLink } from "./phone";

describe("normalizeEgyptPhone", () => {
  it.each([
    ["01012345678", "+201012345678"],
    ["010 1234 5678", "+201012345678"],
    ["+20 115-123-4567", "+201151234567"],
    ["00201212345678", "+201212345678"],
    ["201512345678", "+201512345678"],
    ["1012345678", "+201012345678"],
    ["٠١٠١٢٣٤٥٦٧٨", "+201012345678"],
    ["+20 010 1234 5678", "+201012345678"],
    ["0020 010 1234 5678", "+201012345678"],
  ])("%s -> %s", (input, expected) => expect(normalizeEgyptPhone(input)).toBe(expected));

  it.each(["0101234567", "01312345678", "0221234567", "+971501234567", "", "hello"])("rejects %s", (input) =>
    expect(normalizeEgyptPhone(input)).toBeNull());
});

describe("normalizeWhatsApp", () => {
  it("accepts Egyptian and international numbers", () => {
    expect(normalizeWhatsApp("01012345678")).toBe("+201012345678");
    expect(normalizeWhatsApp("+971 50 123 4567")).toBe("+971501234567");
    expect(normalizeWhatsApp("00966501234567")).toBe("+966501234567");
    expect(normalizeWhatsApp("12345")).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("uses digits only and encodes the message", () => {
    expect(whatsappLink("+201012345678", "Hi Ahmed! Order #JP-000105 🍩 & more")).toBe(
      "https://wa.me/201012345678?text=Hi%20Ahmed!%20Order%20%23JP-000105%20%F0%9F%8D%A9%20%26%20more",
    );
    expect(whatsappLink("010 1234 5678")).toBe("https://wa.me/201012345678");
  });
  it("formats for display", () => expect(prettyPhone("+201012345678")).toBe("+20 10 1234 5678"));
});
