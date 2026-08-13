import { describe, expect, it } from "vitest";
import { decodeBase64Pdf } from "../shared/pdfDownload";

describe("PDF browser download helper", () => {
  it("decodes a PDF base64 payload without changing its bytes", () => {
    const bytes = decodeBase64Pdf("JVBERi0xLjQK");
    expect(new TextDecoder().decode(bytes)).toBe("%PDF-1.4\n");
    expect(bytes[0]).toBe(0x25);
    expect(bytes[1]).toBe(0x50);
  });
});
