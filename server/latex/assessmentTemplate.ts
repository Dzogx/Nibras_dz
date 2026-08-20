/**
 * قالب إخراج LaTeX للتقويم التحصيلي في نبراس.
 *
 * يحضّر هذا الملف مصدراً مهرباً وآمناً ليجمعه خادم نبراس إلى PDF. لا يمرر أي
 * مدخل للمترجم ولا ينفّذ أي أمر LaTeX يأتي من الأستاذ أو من مخرج الذكاء الاصطناعي.
 */

export const ASSESSMENT_PRINT_THEMES = {
  nibras: { label: "متوازن", ink: "113B5D", light: "F4F7F5", accent: "B8812C" },
  official: { label: "رسمي اقتصادي", ink: "25364B", light: "F5F6F2", accent: "52677E" },
  mono: { label: "أبيض وأسود", ink: "000000", light: "F4F4F4", accent: "000000" },
} as const;

export type AssessmentPrintTheme = keyof typeof ASSESSMENT_PRINT_THEMES;

export type AssessmentLatexInput = {
  title: string;
  content: string;
  subject: string;
  gradeLevel: string;
  assessmentType: "quiz" | "exam" | "rubric" | "answerKey";
  printTheme?: AssessmentPrintTheme;
  topic?: string;
  duration?: string;
  totalPoints?: number;
  teacherName?: string;
  school?: string;
  className?: string;
  assessmentDate?: string;
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

/** يحذف الاستشهادات الداخلية من نسخة التلاميذ مع إبقاء نص السؤال سليماً. */
function stripCurriculumCitations(content: string): string {
  return content.replace(/\s*\[مرجع:[^\]]+\]/g, "");
}

function markdownToLatex(content: string): string {
  const lines = stripCurriculumCitations(content).replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      blocks.push("\\par\\smallskip");
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

  return blocks.join("\n");
}

function assessmentLabel(type: AssessmentLatexInput["assessmentType"]): string {
  const labels = {
    quiz: "تقويم تحصيلي",
    exam: "اختبار تحصيلي",
    rubric: "شبكة تقويم",
    answerKey: "نموذج الإجابة وسلم التنقيط",
  } as const;
  return labels[type];
}

function subjectNote(subject: string, totalPoints?: number): string {
  if (subject === "التربية المدنية") return "التربية المدنية: تقويم مستقل على 20 نقطة.";
  if (subject === "التاريخ" || subject === "الجغرافيا") {
    return `المادة: ${escapeLatex(subject)}${totalPoints ? ` — المجموع: ${totalPoints} نقطة` : ""}.`;
  }
  return totalPoints ? `المجموع: ${totalPoints} نقطة.` : "";
}


/** حيادي: وثيقة التقويم رسمية ولا تحمل اسم المنصة في تذييلها. */
function assessmentFooterLabel(theme: (typeof ASSESSMENT_PRINT_THEMES)[keyof typeof ASSESSMENT_PRINT_THEMES]): string {
  return theme === ASSESSMENT_PRINT_THEMES.mono ? "أبيض وأسود" : "تقويم تحصيلي";
}


/** حيادي: وثيقة التقويم رسمية ولا تحمل اسم المنصة في تذييلها. */

function escapeForComment(value: string): string {
  return value.replace(/[\r\n%]/g, " ").trim();
}


export function buildAssessmentLatexDocument(input: AssessmentLatexInput): string {
  const theme = ASSESSMENT_PRINT_THEMES[input.printTheme ?? "nibras"];
  const title = formatInline(input.title);
  const topic = input.topic ? formatInline(input.topic) : "—";
  const school = input.school ? formatInline(input.school) : "........................................";
  const teacher = input.teacherName ? formatInline(input.teacherName) : "........................................";
  const className = input.className ? formatInline(input.className) : "........................................";
  const date = input.assessmentDate ? formatInline(input.assessmentDate) : ".... / .... / ........";
  const duration = input.duration ? formatInline(input.duration) : "................................";
  const points = input.totalPoints ? `${input.totalPoints} نقطة` : "................................";
  // وثيقة رسمية تُقدَّم للمؤسسة والتلاميذ: لا تحمل أي إشارة لاسم المنصة.
  const studentBlock = input.assessmentType === "answerKey" || input.assessmentType === "rubric"
    ? ""
    : `
\\vspace{0.4em}
\\noindent\\fcolorbox{NibrasInk}{NibrasLight}{\\parbox{0.93\\linewidth}{
\\textbf{اللقب والاسم:} \\hrulefill\\hfill \\textbf{القسم:} \\hrulefill\\hfill \\textbf{العلامة:} \\hrulefill
}}`;

  return `% Nibras Print System — Assessment Template
% Compiled securely by Nibras with XeLaTeX. Required packages: polyglossia, fontspec, geometry, array, longtable, fancyhdr.
% Title: ${escapeForComment(input.title)}
\\documentclass[12pt,a4paper]{article}
\\usepackage[a4paper,margin=1.8cm,headheight=18pt]{geometry}
\\usepackage{fontspec}
\\usepackage{xcolor}
\\usepackage{array,longtable,booktabs,enumitem,fancyhdr,lastpage,colortbl}
\\usepackage{polyglossia}
\\definecolor{NibrasInk}{HTML}{${theme.ink}}
\\definecolor{NibrasLight}{HTML}{${theme.light}}
\\definecolor{NibrasAccent}{HTML}{${theme.accent}}
\\definecolor{NibrasLine}{HTML}{D8DEDD}
\\setmainlanguage{arabic}
\\setotherlanguage{english}
\\newfontfamily\\arabicfont[Script=Arabic,Scale=1.04]{Amiri}
\\newfontfamily\\englishfont{Latin Modern Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.45em}
\\renewcommand{\\arraystretch}{1.45}
\\arrayrulecolor{NibrasLine}
\\newcommand{\\AssessmentTitle}[1]{\\noindent\\fcolorbox{NibrasAccent}{white}{\\parbox{0.93\\linewidth}{\\centering\\color{NibrasInk}\\LARGE\\bfseries #1}}}
\\newcommand{\\AssessmentBand}[1]{\\vspace{0.65em}\\noindent\\colorbox{NibrasInk}{\\parbox{0.965\\linewidth}{\\centering\\color{white}\\bfseries #1}}\\vspace{0.35em}}
\\makeatletter
\\renewcommand\\section{\\@startsection{section}{1}{\\z@}{1.05em}{0.38em}{\\color{NibrasInk}\\large\\bfseries}}
\\renewcommand\\subsection{\\@startsection{subsection}{2}{\\z@}{0.8em}{0.28em}{\\color{NibrasAccent}\\normalsize\\bfseries}}
\\makeatother
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small ${assessmentLabel(input.assessmentType)}}
\\fancyfoot[C]{\\small صفحة \\thepage\\ من \\pageref{LastPage}}
\\fancyfoot[R]{\\small وثيقة تربوية قابلة للتحرير}
\\begin{document}

\\begin{center}
{\\large\\bfseries الجمهورية الجزائرية الديمقراطية الشعبية}\\\\
وزارة التربية الوطنية\\\\[0.6em]
{\\color{NibrasInk}\\large\\bfseries ${assessmentLabel(input.assessmentType)}}\\\\[-0.25em]
{\\color{NibrasAccent}\\rule{0.22\\linewidth}{1.2pt}}
\\end{center}

\\AssessmentTitle{${title}}
\\vspace{0.4em}
\\noindent\\fcolorbox{NibrasInk}{NibrasLight}{\\parbox{0.93\\linewidth}{
\\renewcommand{\\arraystretch}{1.55}
\\begin{tabular}{@{}p{0.47\\linewidth}@{\\hspace{1em}}p{0.47\\linewidth}@{}}
المؤسسة: ${school} & الأستاذ(ة): ${teacher} \\\\
المستوى: ${formatInline(input.gradeLevel)} & القسم: ${className} \\\\
المادة: ${formatInline(input.subject)} & المدة: ${duration} \\\\
الموضوع: ${topic} & التاريخ: ${date} \\\\
\\end{tabular}
}}
${studentBlock}

\\vspace{0.7em}
\\noindent\\fcolorbox{NibrasAccent}{white}{\\parbox{0.93\\linewidth}{
\\textcolor{NibrasInk}{\\textbf{تعليمات عامة}}\\hfill\\textbf{${subjectNote(input.subject, input.totalPoints)}}\\\\[-0.1em]
اقرأ التعليمة جيداً، ونظّم إجابتك، واستعمل المصطلحات المناسبة.
}}

\\AssessmentBand{موضوعات التقويم}
${markdownToLatex(input.content)}

\\vfill
\\begin{center}
\\fcolorbox{NibrasInk}{NibrasLight}{\\parbox{0.48\\linewidth}{\\centering\\textcolor{NibrasInk}{\\textbf{${assessmentFooterLabel(theme)} — المجموع: ${points}}}}}
\\end{center}
\\end{document}
`;
}
