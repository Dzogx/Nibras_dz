export type GeneratedPdfPayload = {
  pdfBase64: string;
  mimeType: string;
  filename: string;
};

/** يحوّل استجابة PDF من الخادم إلى ملف متصفح صالح للتنزيل دون خفض الجودة. */
export function pdfBlobFromBase64({ pdfBase64, mimeType }: GeneratedPdfPayload): Blob {
  const binary = atob(pdfBase64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

/** يبدأ تنزيل PDF في المتصفح ويحرر الرابط المؤقت بعد أن يلتقطه المتصفح. */
export function downloadGeneratedPdf(payload: GeneratedPdfPayload) {
  const file = pdfBlobFromBase64(payload);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = payload.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
