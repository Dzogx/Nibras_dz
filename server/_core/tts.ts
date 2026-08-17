// Gemini TTS (text-to-speech) — free tier via Google AI Studio.
// Converts Arabic educational text to clear speech using gemini-3.1-flash-tts-preview
// (output is PCM s16le 24kHz, converted to MP3 with the mp3lame encoder).
// Falls back gracefully: never blocks resource creation when unavailable.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import { ENV } from "./env";

const TTS_MODEL = "gemini-3.1-flash-tts-preview";
const TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;
// Default voice from Google's voice library — tested with Arabic text and
// produced correct, natural Modern Standard Arabic pronunciation.
export const DEFAULT_TTS_VOICE = "Kore";
// Maximum text length per call (TTS models cap around 10-30 seconds; keep a
// safe margin and split longer content).
const TTS_CHUNK_MAX_CHARS = 600;

export type TtsGenerateResult = {
  // S3 URL usable directly in <audio src>
  audioUrl: string;
  // Stored S3 key
  audioKey: string;
  durationSeconds: number | null;
};

// Clean Markdown/formatting symbols before reading aloud.
export const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/[-•·]\s/g, " ")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
};

async function runCommand(
  exe: string,
  args: string[]
): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(exe, args, { windowsHide: true });
    proc.once("error", () => reject(new Error(`Failed to spawn ${exe}`)));
    proc.once("close", code => resolve(code ?? 1));
  });
}

// ffmpeg is assumed available in the sandbox/dev runtime; the production
// container also ships with ffmpeg for media handling.
const ffmpeg = (args: string[]) => runCommand("ffmpeg", args);

// Converts raw PCM (s16le 24000Hz mono) into MP3 via ffmpeg and returns the
// MP3 bytes plus an approximate duration.
async function pcmToMp3(pcm: Buffer): Promise<{ mp3: Buffer; durationSeconds: number | null }> {
  const tmpIn = path.join(tmpdir(), `tts-${randomBytes(8).toString("hex")}.pcm`);
  const tmpOut = path.join(tmpdir(), `tts-${randomBytes(8).toString("hex")}.mp3`);
  fs.writeFileSync(tmpIn, pcm);
  try {
    const code = await ffmpeg([
      "-y",
      "-v", "error",
      "-f", "s16le",
      "-ar", "24000",
      "-ac", "1",
      "-i", tmpIn,
      "-c:a", "libmp3lame",
      "-q:a", "5",
      tmpOut,
    ]);
    if (code !== 0) {
      throw new Error(`ffmpeg pcm→mp3 failed with exit code ${code}`);
    }
    const mp3 = fs.readFileSync(tmpOut);
    // Duration via ffprobe is best-effort; a PCM-based estimate always works.
    const durationSeconds = Math.max(0, Math.round((pcm.length / 2 / 24000) * 10) / 10);
    return { mp3, durationSeconds };
  } finally {
    fs.rmSync(tmpIn, { force: true });
    fs.rmSync(tmpOut, { force: true });
  }
}

export async function generateTtsAudio(params: {
  text: string;
  voice?: string;
}): Promise<TtsGenerateResult> {
  const { text, voice = DEFAULT_TTS_VOICE } = params;
  if (!ENV.geminiApiKey) {
    throw new Error("TTS غير متاح: لم يُضبط مفتاح Gemini");
  }

  const cleaned = cleanTextForSpeech(text);
  if (cleaned.length === 0) {
    throw new Error("النص فارغ بعد التنظيف");
  }

  // Split into chunks when the text exceeds the per-call safety limit.
  const chunks = splitIntoChunks(cleaned, TTS_CHUNK_MAX_CHARS);

  const allPcm: Buffer[] = [];
  for (const chunk of chunks) {
    const res = await fetch(`${TTS_URL}?key=${ENV.geminiApiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: chunk }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      // 429 quota exhaustion is the most common temporary failure — surface a
      // clear Arabic message instead of a raw gateway error.
      if (res.status === 429) {
        throw new Error(
          "نفدت الحصة المجانية لتوليد الصوت اليوم. عاود المحاولة غدًا أو بعد بضع ساعات."
        );
      }
      throw new Error(
        `فشل توليد الصوت: ${res.status} ${res.statusText}${body ? ` – ${body.slice(0, 120)}` : ""}`
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }>;
    };
    const part = data.candidates?.[0]?.content?.parts?.[0];
    if (!part?.inlineData?.data) {
      throw new Error("لم يُعِد النموذج الصوتي أي بيانات");
    }
    allPcm.push(Buffer.from(part.inlineData.data, "base64"));
  }

  const { mp3, durationSeconds } = await pcmToMp3(Buffer.concat(allPcm));

  // Upload to S3 so the audio is permanently served alongside the resource.
  const { storagePut } = await import("../storage");
  const key = `audio/tts-${Date.now()}-${randomBytes(4).toString("hex")}.mp3`;
  const { url } = await storagePut(key, mp3, "audio/mpeg");

  return { audioUrl: url, audioKey: key, durationSeconds };
}

const splitIntoChunks = (text: string, maxChars: number): string[] => {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.،:؛!?])\s+/);
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length === 0 ? [text.slice(0, maxChars)] : chunks;
};
