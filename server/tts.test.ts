import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Enforce db-mock: any real DB connection must fail in tests.
vi.mock("./db", () => ({
  getDb: () => {
    throw new Error("TEST_ENVIRONMENT: direct DB access is forbidden in tests — use db-mock");
  },
}));

// Mock storage so no real S3 upload happens during tests.
vi.mock("./storage", () => ({
  storagePut: vi.fn(async (_key: string, _data: Buffer, _type: string) => ({
    key: "audio/tts-test.mp3",
    url: "/manus-storage/audio/tts-test.mp3",
  })),
}));

// Mock ffmpeg: PCM -> "mp3" passthrough so the pipeline stays pure-node in tests.
vi.mock("node:child_process", async importOriginal => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    spawn: vi.fn((exe: string, args: string[]) => {
      const { EventEmitter } = require("events");
      const proc = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.on = proc.on.bind(proc);
      // ffmpeg writes the output synchronously, then closes — mimicking how
      // pcmToMp3 awaits the process: the "close" event must fire AFTER the
      // output file exists, so write the file in-process (not in setImmediate).
      // Output file is always the last positional arg, not tied to -c:a's
      // position (flags like -q:a sit between the codec and the output).
      const outFile = args[args.length - 1];
      if (exe === "ffmpeg" && outFile.endsWith(".mp3")) {
        const fs = require("fs");
        const inIdx = args.indexOf("-i");
        const inFile = args[inIdx + 1];
        try {
          fs.copyFileSync(inFile, outFile);
          process.nextTick(() => {
            proc.emit("close", 0);
          });
        } catch {
          process.nextTick(() => {
            proc.emit("close", 1);
          });
        }
      } else {
        process.nextTick(() => {
          proc.emit("close", 1);
        });
      }
      return proc;
    }),
  };
});

import { generateTtsAudio, cleanTextForSpeech } from "./_core/tts";
import { storagePut } from "./storage";

describe("TTS unit (no network, db-mock enforced)", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-api-key";
    // ENV in tts.ts is a module-level constant snapshot — re-import every test
    // so it sees the current GEMINI_API_KEY value.
    vi.resetModules();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws when the Gemini key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    vi.unstubAllEnvs();
    const mod = await import("./_core/tts");
    await expect(
      mod.generateTtsAudio({ text: "نص تجريبي" })
    ).rejects.toThrow(/لم يُضبط مفتاح Gemini/);
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  it("throws on empty text after cleaning", async () => {
    const mod = await import("./_core/tts");
    await expect(
      mod.generateTtsAudio({ text: "### **** ````" })
    ).rejects.toThrow(/النص فارغ/);
  });

  it("splits long text into safe chunks", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-api-key");
    // A working Gemini TTS response for EVERY chunk (mockResolvedValue, not
    // Once — the text is split into 3 chunks).
    const fakeTtsResponse = {
      ok: true,
      text: async () => "",
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: "audio/l16; rate=24000", data: Buffer.alloc(24000 * 2).toString("base64") } }],
            },
          },
        ],
      }),
    } as unknown as Response;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(fakeTtsResponse);

    // 1400+ characters → must split into 3 chunks of ≤600 chars
    const longText = "بسم الله الرحمن الرحيم هذا نص تربوي طويل. ".repeat(35);
    const { generateTtsAudio: chunkTts } = await import("./_core/tts");
    const result = await chunkTts({ text: longText });
    expect(result.audioUrl).toContain("/manus-storage/");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    const bodies = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(
      c => (c[1] as RequestInit).body as string
    );
    for (const body of bodies) {
      const parsed = JSON.parse(body);
      expect(parsed.contents[0].parts[0].text.length).toBeLessThanOrEqual(600);
    }
  });

  it("surfaces a clear Arabic message on 429 quota exhaustion", async () => {
    const { generateTtsAudio: quotaTts } = await import("./_core/tts");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "quota exceeded",
      json: async () => ({}),
    } as unknown as Response);

    await expect(
      quotaTts({ text: "نص تجريبي قصير" })
    ).rejects.toThrow(/نفدت الحصة المجانية/);
  });

  it("passes the correct speechConfig payload shape to Gemini", async () => {
    // ENV is a module-level constant, so mutate the env variable then
    // re-import the module fresh so the new key flows into the URL.
    const { generateTtsAudio: freshTts } = await import("./_core/tts");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "",
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: "audio/l16; rate=24000", data: Buffer.alloc(24000 * 2).toString("base64") } }],
            },
          },
        ],
      }),
    } as Response);

    await freshTts({ text: "مرحبا بكم في درس الجغرافيا.", voice: "Puck" });
    vi.unstubAllEnvs();

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.generationConfig.responseModalities).toEqual(["AUDIO"]);
    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Puck");
    expect(body.contents[0].parts[0].text).toBe("مرحبا بكم في درس الجغرافيا.");
    expect(call[0]).toContain("gemini-3.1-flash-tts-preview");
    expect(call[0]).toContain("key=test-api-key");
  });

  it("converts PCM to MP3 and uploads via storagePut", async () => {
    const { generateTtsAudio: convTts } = await import("./_core/tts");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "",
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { mimeType: "audio/l16; rate=24000", data: Buffer.alloc(24000 * 4).toString("base64") } }],
            },
          },
        ],
      }),
    } as Response);

    const result = await convTts({ text: "نص اختبار التحويل" });
    vi.unstubAllEnvs();
    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(storagePut).toHaveBeenCalledTimes(1);
    const uploaded = (storagePut as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(uploaded[0]).toMatch(/\.mp3$/);
    expect(uploaded[2]).toBe("audio/mpeg");
    expect(result.audioUrl).toBe("/manus-storage/audio/tts-test.mp3");
  });

  it("cleanTextForSpeech strips Markdown and normalizes punctuation", () => {
    expect(cleanTextForSpeech("### عنوان **عريض** `كود`")).toBe("عنوان عريض كود");
    expect(cleanTextForSpeech("بند واحد\nبند اثنان\nبند ثالث")).toBe("بند واحد. بند اثنان. بند ثالث");
    expect(cleanTextForSpeech("رابط [نبراس](https://nibras.io) منصة")).toBe("رابط نبراس منصة");
  });
});
