/**
 * قالب إخراج LaTeX للتقويم التحصيلي.
 * كل المدخلات تهرّب قبل وصولها إلى XeLaTeX، والوثيقة المولّدة لا تحمل علامة منصة.
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

function extractPointBadge(heading: string): string | null {
  const match = heading.match(/[\(（]\s*(\d+)\s*(نقطة|نقاط|ن)?\s*[\)）]/);
  return match ? `${match[1]} ${match[2] || "ن"}` : null;
}

/**
 * يحافظ على مستويات Markdown الأربعة كما هي، ويضيف مساحة إجابة قصيرة لكل سؤال
 * مرقم في ورقة التلميذ فقط. نموذج الإجابة وشبكة التقويم لا يستهلكان مساحة الإجابة.
 */
function markdownToLatex(content: string, includeAnswerLines: boolean): string {
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
      const pointBadge = extractPointBadge(heading[2]);
      blocks.push(`\\${command}*{${formatInline(heading[2])}}${pointBadge ? `\\PointBadge{${pointBadge}}` : ""}`);
      continue;
    }
    if (/^\s*[-━─═─]+\s*$/.test(line) && line.length >= 3) {
      blocks.push("\\vspace{0.28em}\\textcolor{NibrasLine}{\\hrule height 0.55pt}\\vspace{0.28em}");
      continue;
    }
    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      blocks.push(`\\begin{quote} ${formatInline(quote[1])} \\end{quote}`);
      continue;
    }
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      blocks.push(`\\QuestionItem{${numbered[1]}}{${formatInline(numbered[2])}}${includeAnswerLines ? "\\AnswerLines" : ""}`);
      continue;
    }
    const bullet = line.match(/^[-*•]\s+([^─].*)$/);
    if (bullet) {
      blocks.push(`\\noindent\\textcolor{NibrasAccent}{\\textbullet}\\hspace{0.45em}${formatInline(bullet[1])}\\par`);
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

function escapeForComment(value: string): string {
  return value.replace(/[\r\n%]/g, " ").trim();
}

function buildStudentBlock(input: AssessmentLatexInput): string {
  if (input.assessmentType === "answerKey" || input.assessmentType === "rubric") return "";
  return `
\\vspace{0.4em}
\\StudentInfoBlock`;
}

function buildStudentInfoMacroDefinition(includeStudentInfo: boolean): string {
  if (!includeStudentInfo) return "\\newcommand{\\StudentInfoBlock}{}";
  return "\\newcommand{\\StudentInfoBlock}{\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasInk}{NibrasLight}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.24em}\\centering\\StudentField{0.50\\linewidth}{اللقب والاسم}\\hfill\\StudentField{0.18\\linewidth}{القسم}\\hfill\\StudentField{0.19\\linewidth}{العلامة}\\vspace{0.24em}\\end{minipage}}}\\end{center}}";
}

/** وثيقة رسمية للتلميذ: منظمة في طبقات بصرية، بلا اسم أو شعار خدمة رقمية. */
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
  const includeAnswerLines = input.assessmentType !== "answerKey" && input.assessmentType !== "rubric";
  const includeStudentInfo = input.assessmentType !== "answerKey" && input.assessmentType !== "rubric";

  return `% Nibras Print System — Assessment Template
% Compiled securely by Nibras with XeLaTeX.
% Title: ${escapeForComment(input.title)}
\\documentclass[12pt,a4paper]{article}
\\usepackage[a4paper,margin=1.25cm,headheight=18pt]{geometry}
\\usepackage{fontspec}
\\usepackage{xcolor}
\\usepackage{array,longtable,booktabs,enumitem,fancyhdr,lastpage,colortbl}
\\usepackage{polyglossia}
\\usepackage{bidi}
\\definecolor{NibrasInk}{HTML}{${theme.ink}}
\\definecolor{NibrasLight}{HTML}{${theme.light}}
\\definecolor{NibrasAccent}{HTML}{${theme.accent}}
\\definecolor{NibrasLine}{HTML}{D8DEDD}
\\definecolor{NibrasMist}{HTML}{EEF4F5}
\\definecolor{NibrasPaper}{HTML}{FFFDF8}
\\setmainlanguage{arabic}
\\setotherlanguage{english}
\\newfontfamily\\arabicfont[Script=Arabic,Scale=1.04]{Amiri}
\\newfontfamily\\englishfont{Latin Modern Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.40em}
\\renewcommand{\\arraystretch}{1.34}
\\arrayrulecolor{NibrasLine}
\\newcommand{\\DocumentFact}[2]{{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries #1}\\par\\vspace{-0.16em}{\\normalsize\\color{NibrasInk}\\bfseries #2}}}
\\newcommand{\\AssessmentTitle}[1]{\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasLine}{white}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.26em}\\centering{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries وثيقة تقويمية للتلميذ}}\\\\[-0.1em]{\\color{NibrasInk}\\LARGE\\bfseries #1}\\\\[-0.1em]\\textcolor{NibrasAccent}{\\rule{0.18\\linewidth}{1.4pt}}\\vspace{0.20em}\\end{minipage}}}\\end{center}}
\\newcommand{\\StudentField}[2]{\\parbox[t]{#1}{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries #2}\\par\\vspace{0.12em}\\textcolor{NibrasLine}{\\rule{0.94\\linewidth}{0.45pt}}}}
${buildStudentInfoMacroDefinition(includeStudentInfo)}
\\newcommand{\\InstructionPanel}[2]{\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasAccent}{NibrasPaper}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.20em}\\noindent\\textcolor{NibrasAccent}{\\rule{3pt}{2.30em}}\\hspace{0.68em}\\parbox[t]{0.84\\linewidth}{\\scriptsize\\textcolor{NibrasAccent}{\\bfseries تعليمات عامة}\\hfill\\textcolor{NibrasInk}{\\bfseries #1}\\par\\vspace{-0.06em}\\color{NibrasInk}#2}\\vspace{0.20em}\\end{minipage}}}\\end{center}}
\\newcommand{\\AssessmentBand}[1]{\\vspace{0.38em}\\noindent\\colorbox{NibrasInk}{\\parbox{0.965\\linewidth}{\\vspace{0.18em}\\textcolor{white}{\\bfseries #1}\\hfill\\colorbox{NibrasAccent}{\\strut\\scriptsize\\textcolor{white}{أجب بوضوح}\\strut}\\vspace{0.18em}}}\\vspace{0.24em}}
\\newcommand{\\PointBadge}[1]{\\hfill\\colorbox{NibrasAccent}{\\strut\\scriptsize\\textcolor{white}{#1}\\strut}\\par\\vspace{-0.14em}}
\\newcommand{\\QuestionItem}[2]{\\vspace{0.16em}\\noindent\\colorbox{NibrasLight}{\\parbox{0.955\\linewidth}{\\vspace{0.2em}\\textcolor{NibrasAccent}{\\bfseries #1}\\hspace{0.55em}\\textcolor{NibrasInk}{#2}\\vspace{0.2em}}}\\par}
\\newcommand{\\AnswerLines}{\\vspace{0.08em}\\noindent\\textcolor{NibrasLine}{\\rule{0.955\\linewidth}{0.38pt}}\\par\\vspace{0.38em}\\noindent\\textcolor{NibrasLine}{\\rule{0.955\\linewidth}{0.38pt}}\\par\\vspace{0.16em}}
\\makeatletter
\\renewcommand\\section{\\@startsection{section}{1}{\\z@}{0.98em}{0.34em}{\\color{NibrasInk}\\large\\bfseries\\leavevmode\\llap{\\textcolor{NibrasAccent}{\\rule{3pt}{1.25ex}}\\hspace{0.55em}}}}
\\renewcommand\\subsection{\\@startsection{subsection}{2}{\\z@}{0.78em}{0.27em}{\\color{NibrasInk}\\normalsize\\bfseries\\leavevmode\\llap{\\textcolor{NibrasAccent}{\\rule{2pt}{1.12ex}}\\hspace{0.45em}}}}
\\renewcommand\\subsubsection{\\@startsection{subsubsection}{3}{\\z@}{0.58em}{0.2em}{\\color{NibrasAccent}\\small\\bfseries}}
\\makeatother
\\newcommand{\\AssessmentFooter}[1]{\\vspace{0.10em}\\begin{center}{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasLine}{NibrasPaper}{\\begin{minipage}{0.935\\linewidth}\\vspace{0.16em}\\colorbox{NibrasInk}{\\parbox{0.32\\linewidth}{\\centering\\textcolor{white}{\\scriptsize\\bfseries مجموع العلامة}\\hspace{0.35em}\\textcolor{white}{\\normalsize\\bfseries #1}}}\\hfill\\parbox[t]{0.42\\linewidth}{\\small\\textcolor{NibrasInk}{\\bfseries مراجعة الأستاذ / الإمضاء}\\hspace{0.6em}\\textcolor{NibrasLine}{\\rule{0.35\\linewidth}{0.38pt}}}\\vspace{0.16em}\\end{minipage}}}\\end{center}}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small ${assessmentLabel(input.assessmentType)}}
\\fancyfoot[C]{\\small صفحة \\thepage\\ من \\pageref{LastPage}}
\\fancyfoot[R]{\\small وثيقة تربوية قابلة للتحرير}
\\begin{document}

\\begin{center}
{\\footnotesize الجمهورية الجزائرية الديمقراطية الشعبية}\\\\[-0.1em]
{\\footnotesize وزارة التربية الوطنية}\\\\[0.18em]
{\\color{NibrasInk}\\large\\bfseries ${assessmentLabel(input.assessmentType)}}\\\\[-0.25em]
{\\color{NibrasAccent}\\rule{0.22\\linewidth}{1.2pt}}
\\end{center}

\\AssessmentTitle{${title}}
\\begin{center}
{\\setlength{\\fboxsep}{0pt}\\fcolorbox{NibrasLine}{white}{\\begin{minipage}{0.935\\linewidth}
\\vspace{0.42em}
\\begin{tabular}{@{}p{0.45\\linewidth}@{\\hspace{0.35em}}p{0.25\\linewidth}@{\\hspace{0.35em}}p{0.20\\linewidth}@{}}
\\DocumentFact{المؤسسة:}{${school}} & \\DocumentFact{المادة:}{${formatInline(input.subject)}} & \\DocumentFact{المستوى:}{${formatInline(input.gradeLevel)}} \\\\
\\end{tabular}
\\vspace{0.28em}\\textcolor{NibrasLine}{\\hrule height 0.4pt}\\vspace{0.30em}
\\begin{tabular}{@{}p{0.45\\linewidth}@{\\hspace{0.35em}}p{0.25\\linewidth}@{\\hspace{0.35em}}p{0.20\\linewidth}@{}}
\\DocumentFact{الموضوع:}{${topic}} & \\DocumentFact{القسم:}{${className}} & \\DocumentFact{المدة:}{${duration}} \\\\
\\end{tabular}
\\vspace{0.28em}\\textcolor{NibrasLine}{\\hrule height 0.4pt}\\vspace{0.30em}
\\begin{tabular}{@{}p{0.58\\linewidth}@{\\hspace{0.35em}}p{0.30\\linewidth}@{}}
\\DocumentFact{الأستاذ(ة):}{${teacher}} & \\DocumentFact{التاريخ:}{${date}} \\\\
\\end{tabular}
\\vspace{0.42em}
\\end{minipage}}}
\\end{center}
${buildStudentBlock(input)}

\\InstructionPanel{${subjectNote(input.subject, input.totalPoints)}}{اقرأ التعليمة جيداً، ونظّم إجابتك، واستعمل المصطلحات المناسبة.}

\\AssessmentBand{موضوعات التقويم}
${markdownToLatex(input.content, includeAnswerLines)}

\\AssessmentFooter{${assessmentFooterLabel(theme)} — المجموع: ${points}}
\\end{document}
`;
}
