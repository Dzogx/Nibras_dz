/**
 * قالب إخراج LaTeX للمذكرة البيداغوجية في نبراس.
 *
 * يحضّر هذا الملف مصدراً مهرباً وآمناً ليجمعه خادم نبراس إلى PDF. لا يمرر أي
 * مدخل للمترجم ولا ينفّذ أي أمر LaTeX يأتي من الأستاذ أو من مخرج الذكاء الاصطناعي.
 */

export const LESSON_PLAN_PRINT_THEMES = {
  nibras: { label: "متوازن", ink: "113B5D", light: "F4F7F5", accent: "B8812C" },
  official: { label: "رسمي اقتصادي", ink: "25364B", light: "F5F6F2", accent: "52677E" },
  mono: { label: "أبيض وأسود", ink: "000000", light: "F4F4F4", accent: "000000" },
} as const;

export type LessonPlanPrintTheme = keyof typeof LESSON_PLAN_PRINT_THEMES;

export type LessonPlanLatexInput = {
  title: string;
  content: string;
  subject?: string;
  gradeLevel?: string;
  className?: string;
  sectionName?: string;
  unitTitle?: string;
  duration?: string;
  date?: string;
  academicYear?: string;
  teacherName?: string;
  school?: string;
  province?: string;
  objectives?: string;
  lessonNumber?: number;
  unitNumber?: number;
  serialNumber?: string;
  printTheme?: LessonPlanPrintTheme;
  isClassroomPlan?: boolean;
};

function escapeLatex(value: string): string {
  const escapes: Record<string, string> = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    "#": "\\#",
    "$": "\\$",
    "%": "\\%",
    "&": "\\&",
    "_": "\\_",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };
  return value.replace(/[\\{}#$%&_~^]/g, (character) => escapes[character]);
}

function formatInline(value: string): string {
  const escaped = escapeLatex(value.trim());
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}")
    .replace(/`([^`]+)`/g, "\\texttt{$1}");
}

/**
 * يحول سطر Markdown إلى كتلة LaTeX مع دعم العناوين الستة والعلامات
 * الأفقية والاقتباسات والقوائم المرقمة والنقطية والأسطر العادية.
 */
function markdownToLatex(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let tableBuffer: string[][] = [];

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer
      .filter((row) => !row.every((cell) => /^\s*[-:━─═]+\s*$/.test(cell)))
      .map((row) => row.map((cell) => formatInline(cell.trim())).join(" & ") + " \\\\");
    if (rows.length === 0) {
      tableBuffer = [];
      return;
    }
    const colCount = rows[0].split(" & ").length;
    const colSpec = Array.from({ length: colCount }, () => `p{${(0.88 / colCount).toFixed(2)}\\linewidth}`).join(" ");
    blocks.push(
      `\\begin{tabular}{${colSpec}}\n` +
        "\\toprule\n" +
        rows.join("\n\\midrule\n") + "\n\\bottomrule\n\\end{tabular}",
    );
    blocks.push("\\par\\smallskip");
    tableBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushTable();
      blocks.push("\\par\\smallskip");
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      tableBuffer.push(
        line
          .slice(1, -1)
          .split("|")
          .map((cell) => cell),
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const command = heading[1].length === 1 ? "section" : heading[1].length <= 3 ? "subsection" : "subsubsection";
      blocks.push(`\\${command}*{${formatInline(heading[2])}}`);
      continue;
    }

    if (/^\s*[-━─═─]+\s*$/.test(line) && line.length >= 3) {
      blocks.push("\\vspace{0.3em}\\hrule\\vspace{0.3em}");
      continue;
    }

    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      blocks.push(`\\begin{quote} ${formatInline(quote[1])} \\end{quote}`);
      continue;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      blocks.push(`\\noindent\\textbf{${numbered[1]}.} ${formatInline(numbered[2])}\\\\`);
      continue;
    }

    const bullet = line.match(/^[-*•]\s+([^─].*)$/);
    if (bullet) {
      blocks.push(`\\noindent\\textbullet\\quad ${formatInline(bullet[1])}\\\\`);
      continue;
    }

    blocks.push(`\\noindent ${formatInline(line)}\\par`);
  }

  flushTable();

  return blocks.join("\n");
}

function escapeForComment(value: string): string {
  return value.replace(/[\r\n%#]/g, " ").trim();
}

/** بطاقة بيانات المذكرة: المؤسسة والأستاذ والمادة والمستوى والمدة والتاريخ. */
function buildHeaderBox(input: LessonPlanLatexInput, theme: (typeof LESSON_PLAN_PRINT_THEMES)[keyof typeof LESSON_PLAN_PRINT_THEMES]): string {
  const school = input.school ? formatInline(input.school) : "........................................";
  const teacher = input.teacherName ? formatInline(input.teacherName) : "........................................";
  const province = input.province ? formatInline(input.province) : "........................................";
  const levelSection = [
    input.gradeLevel ? formatInline(input.gradeLevel) : undefined,
    input.sectionName ? `القسم ${formatInline(input.sectionName)}` : undefined,
  ].filter(Boolean).join(" — ") || "........................................";
  const date = input.date ? formatInline(input.date) : ".... / .... / ........";
  const duration = input.duration ? formatInline(input.duration) : "................................";

  let rows = `المؤسسة: ${school} & الأستاذ(ة): ${teacher} \\\\\n`;
  rows += `المادة: ${input.subject ? formatInline(input.subject) : "........"} & المستوى والقسم: ${levelSection} \\\\\n`;
  rows += `الموضوع: ${formatInline(input.title)} & المدة: ${duration} \\\\\n`;
  if (input.academicYear || input.date) rows += `الموسم الدراسي: ${input.academicYear ? formatInline(input.academicYear) : ".........."} & التاريخ: ${date} \\\\\n`;

  return `\\begin{center}\\fcolorbox{NibrasInk}{NibrasLight}{\\begin{minipage}{0.90\\linewidth}
\\renewcommand{\\arraystretch}{1.55}
\\begin{tabular}{@{}p{0.43\\linewidth}@{\\hspace{1.1em}}p{0.43\\linewidth}@{}}
${rows}
\\end{tabular}
\\end{minipage}}\\end{center}`;
}

/** بطاقة الأهداف إن وجدت. */
function buildObjectivesBox(input: LessonPlanLatexInput): string {
  if (!input.objectives) return "";
  return `\\vspace{0.85em}
\\begin{center}\\fcolorbox{NibrasAccent}{white}{\\begin{minipage}{0.90\\linewidth}
\\textcolor{NibrasInk}{\\textbf{الهدف(ة) التعلمية}}\\hfill\\textcolor{NibrasAccent}{\\rule{0.16\\linewidth}{1.1pt}}\\\\[-0.15em]
${formatInline(input.objectives)}
\\end{minipage}}\\end{center}`;
}

/**
 * المذكرة وثيقة عمل للأستاذ تحمل بيانات المعلم وترويسة وزارية محايدة،
 * دون أي إشارة لمنصة التحضير (نفس قاعدة الحياد في وثائق التقويم الرسمية).
 */
export function buildLessonPlanLatexDocument(input: LessonPlanLatexInput): string {
  const theme = LESSON_PLAN_PRINT_THEMES[input.printTheme ?? "nibras"];

  return `% Nibras Print System — Lesson Plan Template
% Compiled securely by Nibras with XeLaTeX. Required packages: polyglossia, fontspec, geometry, array, longtable, fancyhdr, lastpage.
% Title: ${escapeForComment(input.title)}
\\documentclass[12pt,a4paper]{article}
\\usepackage[a4paper,margin=1.8cm,headheight=18pt]{geometry}
\\usepackage{fontspec}
\\usepackage{array,longtable,booktabs,enumitem,fancyhdr,lastpage,colortbl}
\\usepackage{xcolor}
\\usepackage{polyglossia}
\\usepackage{bidi}
\\definecolor{NibrasInk}{HTML}{${theme.ink}}
\\definecolor{NibrasLight}{HTML}{${theme.light}}
\\definecolor{NibrasAccent}{HTML}{${theme.accent}}
\\definecolor{NibrasLine}{HTML}{D8DEDD}
\\setmainlanguage[numerals=maghrib]{arabic}
\\setotherlanguage{english}
\\newfontfamily\\arabicfont[Script=Arabic,Scale=1.04]{Amiri}
\\newfontfamily\\englishfont{Latin Modern Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.45em}
\\renewcommand{\\arraystretch}{1.45}
\\arrayrulecolor{NibrasLine}
\\newcommand{\\DocumentBand}[1]{\\vspace{0.8em}\\noindent\\colorbox{NibrasInk}{\\parbox{0.965\\linewidth}{\\centering\\color{white}\\bfseries #1}}\\vspace{0.45em}}
\\newcommand{\\DocumentTitle}[1]{\\begin{center}\\fcolorbox{NibrasAccent}{white}{\\begin{minipage}{0.90\\linewidth}\\centering\\color{NibrasInk}\\LARGE\\bfseries #1\\end{minipage}}\\end{center}}
\\makeatletter
\\renewcommand\\section{\\@startsection{section}{1}{\\z@}{1.15em}{0.42em}{\\color{NibrasInk}\\large\\bfseries}}
\\renewcommand\\subsection{\\@startsection{subsection}{2}{\\z@}{0.85em}{0.3em}{\\color{NibrasAccent}\\normalsize\\bfseries}}
\\makeatother
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small مذكرة بيداغوجية${input.unitTitle ? ` — ${formatInline(input.unitTitle)}` : ""}}
\\fancyfoot[C]{\\small صفحة \\thepage\\ من \\pageref{LastPage}}
\\fancyfoot[R]{\\small وثيقة تحضير للأستاذ}
\\begin{document}

\\begin{center}
{\\footnotesize الجمهورية الجزائرية الديمقراطية الشعبية}\\\\[-0.1em]
{\\footnotesize وزارة التربية الوطنية}\\\\[0.35em]
{\\color{NibrasInk}\\large\\bfseries مذكرة بيداغوجية}\\\\[-0.25em]
{\\color{NibrasAccent}\\rule{0.22\\linewidth}{1.2pt}}
\\end{center}

\\DocumentTitle{${formatInline(input.title)}}
\\vspace{0.8em}
${buildHeaderBox(input, theme)}
${buildObjectivesBox(input)}

\\DocumentBand{سير الحصة}
${markdownToLatex(input.content)}

\\vfill
\\begin{center}
\\textcolor{NibrasInk}{وثيقة تحضير تربوية قابلة للتحرير}
\\end{center}
\\end{document}
`;
}
