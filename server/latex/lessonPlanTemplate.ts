/**
 * قالب إخراج LaTeX للمذكرة البيداغوجية.
 * كل المدخلات تهرّب قبل وصولها إلى XeLaTeX، وتبقى الوثيقة الرسمية محايدة تماماً.
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

/** يحول Markdown إلى كتل ذات مسار بصري واضح، مع الإبقاء على دعم الجداول والقوائم. */
function markdownToLatex(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let tableBuffer: string[][] = [];

  const flushTable = () => {
    if (tableBuffer.length === 0) return;
    const usableRows = tableBuffer.filter((row) => !row.every((cell) => /^\s*[-:━─═─]+\s*$/.test(cell)));
    if (usableRows.length === 0) {
      tableBuffer = [];
      return;
    }
    const colCount = usableRows[0].length;
    const colSpec = Array.from({ length: colCount }, () => `p{${(0.88 / colCount).toFixed(2)}\\linewidth}`).join(" ");
    const header = usableRows[0]
      .map((cell) => `\\textcolor{white}{\\textbf{${formatInline(cell.trim())}}}`)
      .join(" & ") + " \\\\";
    const rows = usableRows.slice(1)
      .map((row) => row.map((cell) => formatInline(cell.trim())).join(" & ") + " \\\\"
      ).join("\n\\midrule\n");
    blocks.push(
      "\\begin{center}\\small\n" +
      "\\renewcommand{\\arraystretch}{1.4}\n" +
      "\\rowcolors{2}{NibrasMist}{white}\n" +
      `\\begin{tabular}{${colSpec}}\n\\toprule\n\\rowcolor{NibrasInk}${header}\n` +
      (rows ? `\\midrule\n${rows}\n` : "") +
      "\\bottomrule\n\\end{tabular}\n\\end{center}\\par\\smallskip",
    );
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
      tableBuffer.push(line.slice(1, -1).split("|").map((cell) => cell));
      continue;
    }
    flushTable();

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const command = heading[1].length === 1 ? "section" : heading[1].length <= 3 ? "subsection" : "subsubsection";
      blocks.push(`\\${command}*{${formatInline(heading[2])}}`);
      continue;
    }
    if (/^\s*[-━─═─]+\s*$/.test(line) && line.length >= 3) {
      blocks.push("\\vspace{0.28em}\\textcolor{NibrasLine}{\\hrule height 0.55pt}\\vspace{0.28em}");
      continue;
    }
    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      blocks.push(`\\begin{quote}\\small\\textcolor{NibrasInk}{${formatInline(quote[1])}}\\end{quote}`);
      continue;
    }
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      blocks.push(`\\noindent\\textbf{${numbered[1]}.} ${formatInline(numbered[2])}\\par`);
      continue;
    }
    const bullet = line.match(/^[-*•]\s+([^─].*)$/);
    if (bullet) {
      blocks.push(`\\noindent\\textbullet\\quad ${formatInline(bullet[1])}\\par`);
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

/** ملخص نصي آمن يحافظ على تتبع حقول الترويسة في المستهلكين القدامى. */
function buildCompatibilityMetadata(input: LessonPlanLatexInput): string {
  const levelSection = [input.gradeLevel, input.sectionName ? `القسم ${input.sectionName}` : undefined]
    .filter(Boolean)
    .join(" — ") || "........................................";
  return `% المؤسسة: ${escapeForComment(input.school || "........................................")}
% المادة: ${escapeForComment(input.subject || "........")}
% المستوى والقسم: ${escapeForComment(levelSection)}
% الموضوع: ${escapeForComment(input.title)}
% الأستاذ(ة): ${escapeForComment(input.teacherName || "........................................")}`;
}

/** شبكة حقائق مختصرة تفصل الملصق عن القيمة، كي تُقرأ المذكرة في ثوانٍ. */
function buildHeaderBox(input: LessonPlanLatexInput): string {
  const school = input.school ? formatInline(input.school) : "........................................";
  const teacher = input.teacherName ? formatInline(input.teacherName) : "........................................";
  const province = input.province ? formatInline(input.province) : "........................................";
  const levelSection = [
    input.gradeLevel ? formatInline(input.gradeLevel) : undefined,
    input.sectionName ? `القسم ${formatInline(input.sectionName)}` : undefined,
  ].filter(Boolean).join(" — ") || "........................................";
  const date = input.date ? formatInline(input.date) : ".... / .... / ........";
  const duration = input.duration ? formatInline(input.duration) : "................................";
  const lessonReference = input.serialNumber
    ? formatInline(input.serialNumber)
    : input.lessonNumber
      ? `الحصة ${input.lessonNumber}`
      : "................................";
  const additionalContext = input.academicYear || input.province || input.serialNumber || input.lessonNumber
    ? `
\\vspace{0.22em}\\textcolor{NibrasLine}{\\hrule height 0.4pt}\\vspace{0.3em}
\\begin{tabular}{@{}p{0.40\\linewidth}@{\\hspace{0.35em}}p{0.25\\linewidth}@{\\hspace{0.35em}}p{0.25\\linewidth}@{}}
\\DocumentFact{الموسم الدراسي:}{${input.academicYear ? formatInline(input.academicYear) : ".........."}} &
\\DocumentFact{الولاية:}{${province}} &
\\DocumentFact{مرجع الحصة:}{${lessonReference}} \\\\
\\end{tabular}`
    : "";

  return `\\begin{center}
{\\setlength{\\fboxsep}{0pt}
\\fcolorbox{NibrasLine}{white}{\\begin{minipage}{0.935\\linewidth}
\\vspace{0.46em}
\\begin{tabular}{@{}p{0.225\\linewidth}@{\\hspace{0.28em}}p{0.205\\linewidth}@{\\hspace{0.28em}}p{0.245\\linewidth}@{\\hspace{0.28em}}p{0.205\\linewidth}@{}}
\\DocumentFact{المؤسسة:}{${school}} &
\\DocumentFact{المادة:}{${input.subject ? formatInline(input.subject) : "........"}} &
\\DocumentFact{المستوى والقسم:}{${levelSection}} &
\\DocumentFact{المدة:}{${duration}} \\\\
\\end{tabular}
\\vspace{0.3em}\\textcolor{NibrasLine}{\\hrule height 0.4pt}\\vspace{0.32em}
\\begin{tabular}{@{}p{0.45\\linewidth}@{\\hspace{0.35em}}p{0.25\\linewidth}@{\\hspace{0.35em}}p{0.20\\linewidth}@{}}
\\DocumentFact{الموضوع:}{${formatInline(input.title)}} &
\\DocumentFact{الأستاذ(ة):}{${teacher}} &
\\DocumentFact{التاريخ:}{${date}} \\\\
\\end{tabular}
${additionalContext}
\\vspace{0.46em}
\\end{minipage}}}
\\end{center}`;
}

function buildObjectivesBox(input: LessonPlanLatexInput): string {
  if (!input.objectives) return "";
  return `\\vspace{0.42em}\\ObjectivePanel{${formatInline(input.objectives)}}`;
}

function buildLessonRoadmap(input: LessonPlanLatexInput): string {
  const context = input.sectionName
    ? `الوضعية: ${formatInline(input.sectionName)}`
    : input.subject
      ? `المادة: ${formatInline(input.subject)}`
      : "خطة تنفيذ الحصة";
  return `\\LessonRoadmap{${context}}`;
}

/**
 * المذكرة وثيقة عمل رسمية محايدة؛ تُستخدم لغة تصميم منظمة لا اسم منصة أو شعاراً.
 */
export function buildLessonPlanLatexDocument(input: LessonPlanLatexInput): string {
  const theme = LESSON_PLAN_PRINT_THEMES[input.printTheme ?? "nibras"];
  return `% Nibras Print System — Lesson Plan Template
% Compiled securely by Nibras with XeLaTeX.
% Title: ${escapeForComment(input.title)}
${buildCompatibilityMetadata(input)}
\\documentclass[12pt,a4paper]{article}
\\usepackage[a4paper,margin=1.55cm,headheight=18pt]{geometry}
\\usepackage{fontspec}
\\usepackage{array,longtable,booktabs,enumitem,fancyhdr,lastpage,colortbl}
\\usepackage{xcolor}
\\usepackage{polyglossia}
\\usepackage{bidi}
\\definecolor{NibrasInk}{HTML}{${theme.ink}}
\\definecolor{NibrasLight}{HTML}{${theme.light}}
\\definecolor{NibrasAccent}{HTML}{${theme.accent}}
\\definecolor{NibrasLine}{HTML}{D8DEDD}
\\definecolor{NibrasMist}{HTML}{EEF4F5}
\\definecolor{NibrasPaper}{HTML}{FFFDF8}
\\setmainlanguage[numerals=maghrib]{arabic}
\\setotherlanguage{english}
\\newfontfamily\\arabicfont[Script=Arabic,Scale=1.04]{Amiri}
\\newfontfamily\\englishfont{Latin Modern Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.40em}
\\renewcommand{\\arraystretch}{1.34}
\\arrayrulecolor{NibrasLine}
\\newcommand{\\DocumentFact}[2]{{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries #1}\\par\\vspace{-0.16em}{\\normalsize\\color{NibrasInk}\\bfseries #2}}}
\\newcommand{\\DocumentTitle}[1]{\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasLine}{white}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.42em}\\centering{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries وثيقة تحضير للحصة}}\\\\[-0.1em]{\\color{NibrasInk}\\LARGE\\bfseries #1}\\\\[-0.1em]\\textcolor{NibrasAccent}{\\rule{0.18\\linewidth}{1.4pt}}\\vspace{0.34em}\\end{minipage}}}\\end{center}}
\\newcommand{\\ObjectivePanel}[1]{\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasAccent}{NibrasPaper}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.36em}\\noindent\\textcolor{NibrasAccent}{\\rule{3pt}{2.65em}}\\hspace{0.7em}\\parbox[t]{0.84\\linewidth}{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries الهدف(ة) التعلمية}\\par\\vspace{-0.08em}\\color{NibrasInk}#1}\\vspace{0.36em}\\end{minipage}}}\\end{center}}
\\newcommand{\\LessonRoadmap}[1]{\\vspace{0.14em}\\noindent{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasLine}{NibrasLight}{\\begin{minipage}{0.965\\linewidth}\\vspace{0.34em}\\noindent\\scriptsize\\textcolor{NibrasInk}{\\bfseries مسار الحصة}\\hfill\\textcolor{NibrasAccent}{\\bfseries #1}\\par\\vspace{0.12em}\\centering\\small\\textcolor{NibrasInk}{\\bfseries تهيئة}\\hspace{0.55em}\\textcolor{NibrasAccent}{\\textbullet}\\hspace{0.55em}\\textcolor{NibrasInk}{\\bfseries بناء التعلمات}\\hspace{0.55em}\\textcolor{NibrasAccent}{\\textbullet}\\hspace{0.55em}\\textcolor{NibrasInk}{\\bfseries ممارسة}\\hspace{0.55em}\\textcolor{NibrasAccent}{\\textbullet}\\hspace{0.55em}\\textcolor{NibrasInk}{\\bfseries تقويم}\\vspace{0.34em}\\end{minipage}}}}
\\newcommand{\\DocumentBand}[1]{\\vspace{0.7em}\\noindent\\colorbox{NibrasInk}{\\parbox{0.965\\linewidth}{\\vspace{0.22em}\\textcolor{white}{\\bfseries #1}\\hfill\\colorbox{NibrasAccent}{\\strut\\scriptsize\\textcolor{white}{خطة التنفيذ}\\strut}\\vspace{0.22em}}}\\vspace{0.35em}}
\\newcommand{\\LessonStep}[2]{\\vspace{0.14em}\\noindent\\colorbox{NibrasLight}{\\parbox{0.955\\linewidth}{\\vspace{0.18em}\\textcolor{NibrasAccent}{\\bfseries #1}\\hspace{0.5em}\\textcolor{NibrasInk}{#2}\\vspace{0.18em}}}\\par}
\\newcommand{\\NotePanel}[1]{\\vspace{0.18em}\\noindent{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasAccent}{NibrasPaper}{\\begin{minipage}{0.92\\linewidth}\\vspace{0.28em}\\scriptsize\\textcolor{NibrasAccent}{\\bfseries ملاحظة تربوية}\\par\\vspace{-0.08em}\\color{NibrasInk}#1\\vspace{0.28em}\\end{minipage}}}\\par}
\\makeatletter
\\renewcommand\\section{\\@startsection{section}{1}{\\z@}{1.03em}{0.36em}{\\color{NibrasInk}\\large\\bfseries\\leavevmode\\llap{\\textcolor{NibrasAccent}{\\rule{3pt}{1.25ex}}\\hspace{0.55em}}}}
\\renewcommand\\subsection{\\@startsection{subsection}{2}{\\z@}{0.80em}{0.28em}{\\color{NibrasInk}\\normalsize\\bfseries\\leavevmode\\llap{\\textcolor{NibrasAccent}{\\rule{2pt}{1.15ex}}\\hspace{0.45em}}}}
\\renewcommand\\subsubsection{\\@startsection{subsubsection}{3}{\\z@}{0.6em}{0.2em}{\\color{NibrasAccent}\\small\\bfseries}}
\\makeatother
\\newcommand{\\TeacherFooter}{\\vfill\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasLine}{NibrasPaper}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.34em}\\parbox[t]{0.63\\linewidth}{\\small\\textcolor{NibrasInk}{\\bfseries ملاحظات الأستاذ بعد الحصة}\\par\\vspace{0.18em}\\textcolor{NibrasLine}{\\rule{\\linewidth}{0.35pt}}\\par\\vspace{0.22em}\\textcolor{NibrasLine}{\\rule{\\linewidth}{0.35pt}}}\\hfill\\parbox[t]{0.27\\linewidth}{\\centering\\small\\textcolor{NibrasInk}{\\bfseries تأشيرة / إمضاء}\\par\\vspace{0.32em}\\textcolor{NibrasLine}{\\rule{0.82\\linewidth}{0.35pt}}\\par\\vspace{0.22em}\\scriptsize\\textcolor{NibrasAccent}{وثيقة تحضير للأستاذ}}\\vspace{0.30em}\\end{minipage}}}\\end{center}}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small مذكرة بيداغوجية${input.unitTitle ? ` — ${formatInline(input.unitTitle)}` : ""}}
\\fancyfoot[C]{\\small صفحة \\thepage\\ من \\pageref{LastPage}}
\\fancyfoot[R]{\\small وثيقة تحضير تربوية قابلة للتحرير}
\\begin{document}

\\begin{center}
{\\footnotesize الجمهورية الجزائرية الديمقراطية الشعبية}\\\\[-0.1em]
{\\footnotesize وزارة التربية الوطنية}\\\\[0.28em]
{\\color{NibrasInk}\\large\\bfseries مذكرة بيداغوجية}\\\\[-0.25em]
{\\color{NibrasAccent}\\rule{0.22\\linewidth}{1.2pt}}
\\end{center}

\\DocumentTitle{${formatInline(input.title)}}
${buildHeaderBox(input)}
${buildObjectivesBox(input)}
${buildLessonRoadmap(input)}

\\DocumentBand{سير الحصة}
${markdownToLatex(input.content)}

\\TeacherFooter
\\end{document}
`;
}
