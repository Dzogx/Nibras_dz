import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const COMPILATION_TIMEOUT_MS = 25_000;

export class LatexCompilationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LatexCompilationError";
  }
}

/** تمنع التجميعات المتزامنة حتى لا تستنزف ذاكرة نسخة الخادم الصغيرة. */
let pendingCompilation: Promise<void> = Promise.resolve();

async function runExclusively<T>(work: () => Promise<T>): Promise<T> {
  const previous = pendingCompilation.catch(() => undefined);
  let release!: () => void;
  pendingCompilation = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await work();
  } finally {
    release();
  }
}

/**
 * يجمع مصدراً سبق تهريبه من مدخلات المستخدم إلى PDF في دليل مؤقت معزول.
 * لا يسمح بفتح shell أو تنفيذ أوامر LaTeX خارج القالب، وينظف كل المخرجات فوراً.
 */
export async function compileLatexToPdf(texContent: string): Promise<Buffer> {
  if (!texContent.startsWith("% Nibras Print System")) {
    throw new LatexCompilationError("مصدر الطباعة غير صالح.");
  }

  return runExclusively(async () => {
    const directory = await mkdtemp(join(tmpdir(), "nibras-latex-"));
    const sourcePath = join(directory, "assessment.tex");
    const outputPath = join(directory, "assessment.pdf");
    const compiler = process.env.NIBRAS_XELATEX_PATH || "xelatex";

    try {
      await writeFile(sourcePath, texContent, { encoding: "utf8", mode: 0o600 });
      const compilerArgs = [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-no-shell-escape",
        "-output-directory",
        directory,
        sourcePath,
      ];
      const compilerOptions = {
        cwd: directory,
        timeout: COMPILATION_TIMEOUT_MS,
        maxBuffer: 256 * 1024,
        windowsHide: true,
      };

      // الجولة الثانية تحسم مراجع LastPage والتخطيطات المتقاطعة في التذييل.
      await execFileAsync(compiler, compilerArgs, compilerOptions);
      await execFileAsync(compiler, compilerArgs, compilerOptions);

      const pdf = await readFile(outputPath);
      if (pdf.length === 0 || pdf.length > MAX_PDF_BYTES || !pdf.subarray(0, 4).equals(Buffer.from("%PDF"))) {
        throw new LatexCompilationError("تعذر إنشاء ملف PDF طباعي صالح.");
      }
      return pdf;
    } catch (error) {
      if (error instanceof LatexCompilationError) throw error;
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw new LatexCompilationError("محرك الطباعة غير متاح مؤقتاً. حاول لاحقاً.");
      }
      throw new LatexCompilationError("تعذر تجهيز ملف PDF الآن. راجع محتوى التقويم ثم أعد المحاولة.");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}
