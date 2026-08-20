import { describe, expect, it } from "vitest";
import { pdfBlobFromBase64 } from "./pdfDownload";

describe("pdfBlobFromBase64", () => {
  it("يحافظ على بايتات ملف PDF ونوعه عند فك الاستجابة", async () => {
    const blob = pdfBlobFromBase64({
      pdfBase64: "JVBERi0xLjQK",
      mimeType: "application/pdf",
      filename: "document.pdf",
    });

    expect(blob.type).toBe("application/pdf");
    expect(await blob.text()).toBe("%PDF-1.4\n");
  });
});
