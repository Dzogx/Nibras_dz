/**
 * قالب إخراج LaTeX للتقويم التحصيلي الرسمي.
 * كل المدخلات تهرّب قبل وصولها إلى XeLaTeX، والوثيقة المولّدة لا تحمل علامة منصة.
 */

export const ASSESSMENT_PRINT_THEMES = {
  nibras: { label: "رسمي رمادي", ink: "000000", light: "F1F1F1", accent: "6C6C6C" },
  official: { label: "رسمي اقتصادي", ink: "000000", light: "F1F1F1", accent: "6C6C6C" },
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

/**
 * ترويسة التقويم يملكها قالب الطباعة وحده. بعض المخرجات تعيد كتابة العنوان
 * وبيانات الوزارة قبل «الجزء الأول»، وهو ما يكرر الترويسة داخل جسم الورقة.
 */
function stripGeneratedInstitutionalPreamble(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const firstPartIndex = lines.findIndex((line) => /^#{1,6}\s*الجزء\s+(الأول|الثاني|الثالث)/.test(line.trim()));
  if (firstPartIndex <= 0) return content;

  const preamble = lines.slice(0, firstPartIndex).join("\n");
  const containsInstitutionalPreamble = /(الجمهورية الجزائرية|وزارة التربية الوطنية|اختبار في|تقويم تحصيلي|المستوى\s*:|المدة\s*:)/.test(preamble);
  return containsInstitutionalPreamble ? lines.slice(firstPartIndex).join("\n").trim() : content;
}

function extractPointBadge(heading: string): string | null {
  const match = heading.match(/(?:[\(（]\s*)?(\d+)\s*(نقطة|نقاط|ن)(?:\s*[\)）])?/);
  return match ? `${match[1]} ${match[2] || "ن"}` : null;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => formatInline(cell));
}

function isTableSeparator(line: string): boolean {
  const cells = line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

/**
 * يحوّل جدول Markdown البسيط إلى جدول سؤال رسمي داخل ورقة الاختبار.
 * يبقى الجدول في كل المستويات؛ اختلاف المستوى يقتصر على سطور الإجابة المدمجة
 * التي لا تظهر في الثالثة والرابعة لأن الإجابة تكون في ورقة مستقلة.
 */
function buildFormalTable(rows: string[][]): string {
  const columns = Math.max(...rows.map((row) => row.length));
  const width = (0.92 / columns).toFixed(3);
  const columnSpec = Array.from(
    { length: columns },
    () => `>{\\centering\\arraybackslash}p{${width}\\linewidth}`,
  ).join("|");
  const row = (cells: string[], shade = false) => {
    const values = Array.from({ length: columns }, (_, index) => cells[index] ?? "");
    return `${shade ? "\\rowcolor{NibrasLight}" : ""}${values.join(" & ")} \\\\ \\hline`;
  };

  return `\\begin{center}\\renewcommand{\\arraystretch}{1.45}\\begin{tabular}{|${columnSpec}|}\\hline
${row(rows[0], true)}
${rows.slice(1).map((cells) => row(cells)).join("\n")}
\\end{tabular}\\end{center}`;
}

/**
 * يحافظ على مستويات Markdown الأربعة كما هي، ويضيف مساحة إجابة قصيرة لكل سؤال
 * مرقم في ورقة التلميذ فقط. نموذج الإجابة وشبكة التقويم لا يستهلكان مساحة الإجابة.
 */
function markdownToLatex(content: string, includeAnswerLines: boolean): string {
  const lines = stripGeneratedInstitutionalPreamble(stripCurriculumCitations(content)).replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (line.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const rows = [splitTableRow(line)];
      index += 2;
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      index -= 1;
      blocks.push(buildFormalTable(rows));
      continue;
    }

    if (!line) {
      blocks.push("\\par\\smallskip");
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const command = heading[1].length === 1 ? "section" : heading[1].length <= 3 ? "subsection" : "subsubsection";
      const pointBadge = extractPointBadge(heading[2]);
      const isPartHeading = heading[1].length <= 3 && /^الجزء\s+(الأول|الثاني|الثالث)/.test(heading[2].trim());
      if (isPartHeading && pointBadge) {
        blocks.push(`\\FormalPartHeading{${formatInline(heading[2])}}{${pointBadge}}`);
        continue;
      }
      blocks.push(`\\${command}*{${formatInline(heading[2])}}${pointBadge ? `\\PointBadge{${pointBadge}}` : ""}`);
      continue;
    }
    if (/^\s*[-━─═─]+\s*$/.test(line) && line.length >= 3) {
      blocks.push("\\vspace{0.28em}\\hrule height 0.45pt\\vspace{0.28em}");
      continue;
    }
    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      blocks.push(`\\begin{quote}\\small ${formatInline(quote[1])} \\end{quote}`);
      continue;
    }
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      blocks.push(`\\QuestionItem{${numbered[1]}}{${formatInline(numbered[2])}}${includeAnswerLines ? "\\AnswerLines" : ""}`);
      continue;
    }
    const bullet = line.match(/^[-*•]\s+([^─].*)$/);
    if (bullet) {
      blocks.push(`\\noindent\\textbf{—}\\hspace{0.4em}${formatInline(bullet[1])}\\par`);
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
  if (subject === "التربية المدنية") return "اقرأ التعليمات جيداً، واكتب إجابتك بخط واضح ومنظم. المجموع: 20 نقطة.";
  if (subject === "التاريخ" || subject === "الجغرافيا") {
    return `اقرأ التعليمات جيداً، ونظّم إجابتك، واستعمل المصطلحات المناسبة.${totalPoints ? ` المجموع: ${totalPoints} نقطة.` : ""}`;
  }
  return totalPoints ? `اقرأ التعليمات جيداً، ونظّم إجابتك. المجموع: ${totalPoints} نقطة.` : "اقرأ التعليمات جيداً، ونظّم إجابتك.";
}

/** حيادي: وثيقة التقويم رسمية ولا تحمل اسم المنصة في تذييلها. */
function assessmentFooterLabel(theme: (typeof ASSESSMENT_PRINT_THEMES)[keyof typeof ASSESSMENT_PRINT_THEMES]): string {
  return theme === ASSESSMENT_PRINT_THEMES.mono ? "أبيض وأسود" : "تقويم تحصيلي";
}

/**
 * في السنوات الأولى تُستثمر ورقة الاختبار نفسها للإجابة الموجزة،
 * أما الثالثة والرابعة فتُسلَّم فيهما ورقة أسئلة فقط وفق قاعدة الأستاذ.
 * القيمة غير المتعرف عليها تعامل باحتياط كورقة أسئلة بلا إجابة مدمجة.
 */
function allowsEmbeddedAnswerSpace(gradeLevel: string): boolean {
  const normalized = gradeLevel.replace(/\s+/g, " ").trim();
  return /(?:الأولى|الثانية|(?:^|\s)[12](?:\s*م)?(?:\s|$))/.test(normalized);
}

function escapeForComment(value: string): string {
  return value.replace(/[\r\n%]/g, " ").trim();
}

function buildStudentBlock(input: AssessmentLatexInput): string {
  if (input.assessmentType === "answerKey" || input.assessmentType === "rubric") return "";
  return "\\vspace{0.32em}\\StudentInfoBlock";
}

function buildStudentInfoMacroDefinition(includeStudentInfo: boolean): string {
  if (!includeStudentInfo) return "\\newcommand{\\StudentInfoBlock}{}";
  return "\\newcommand{\\StudentInfoBlock}{\\begin{center}\\renewcommand{\\arraystretch}{1.55}\\begin{tabular}{|>{\\centering\\arraybackslash}p{0.48\\linewidth}|>{\\centering\\arraybackslash}p{0.20\\linewidth}|>{\\centering\\arraybackslash}p{0.20\\linewidth}|}\\hline\\StudentField{اللقب والاسم} & \\StudentField{القسم} & \\StudentField{العلامة} \\\\ \\hline\\end{tabular}\\end{center}}";
}

/** وثيقة اختبار رسمية للتلميذ: هرمية مدرسية أحادية اللون وبلا هوية منصة. */
export function buildAssessmentLatexDocument(input: AssessmentLatexInput): string {
  const theme = ASSESSMENT_PRINT_THEMES[input.printTheme ?? "official"];
  const title = formatInline(input.title);
  const topic = input.topic ? formatInline(input.topic) : "........................................................";
  const school = input.school ? formatInline(input.school) : "........................................";
  const className = input.className ? formatInline(input.className) : "........................................";
  const date = input.assessmentDate ? formatInline(input.assessmentDate) : ".... / .... / ........";
  const duration = input.duration ? formatInline(input.duration) : "................................";
  const points = input.totalPoints ? `${input.totalPoints} نقطة` : "................................";
  const isStudentPaper = input.assessmentType !== "answerKey" && input.assessmentType !== "rubric";
  const includeAnswerLines = isStudentPaper && allowsEmbeddedAnswerSpace(input.gradeLevel);
  const includeStudentInfo = isStudentPaper;

  return `% Nibras Print System — Official Assessment Template
% Compiled securely with XeLaTeX.
% Title: ${escapeForComment(input.title)}
\\documentclass[12pt,a4paper]{article}
\\usepackage[a4paper,margin=1.28cm,headheight=14pt]{geometry}
\\usepackage{fontspec}
\\usepackage{xcolor}
\\usepackage{array,longtable,booktabs,enumitem,fancyhdr,lastpage,colortbl}
\\usepackage{polyglossia}
\\usepackage{bidi}
\\definecolor{NibrasInk}{HTML}{${theme.ink}}
\\definecolor{NibrasLight}{HTML}{${theme.light}}
\\definecolor{NibrasAccent}{HTML}{${theme.accent}}
\\definecolor{NibrasLine}{HTML}{8A8A8A}
\\setmainlanguage{arabic}
\\setotherlanguage{english}
\\newfontfamily\\arabicfont[Script=Arabic,Scale=1.04]{Amiri}
\\newfontfamily\\englishfont{Latin Modern Roman}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.32em}
\\renewcommand{\\arraystretch}{1.26}
\\arrayrulecolor{NibrasInk}
\\newcommand{\\AssessmentTitle}[1]{\\begin{center}\\vspace{-0.10em}{\\Large\\bfseries\\underline{#1}}\\end{center}}
\\newcommand{\\OfficialHeader}[5]{\\begin{center}\\renewcommand{\\arraystretch}{1.42}\\begin{tabular}{|>{\\centering\\arraybackslash}p{0.30\\linewidth}|>{\\centering\\arraybackslash}p{0.34\\linewidth}|>{\\centering\\arraybackslash}p{0.26\\linewidth}|}\\hline\\small\\textbf{مديرية التربية لولاية:} & \\small\\textbf{المؤسسة: #1} & \\small\\textbf{المستوى: #2} \\\\ \\hline\\small\\textbf{التاريخ: #3} & \\small\\textbf{#4} & \\small\\textbf{المدة: #5} \\\\ \\hline\\end{tabular}\\end{center}}
\\newcommand{\\StudentField}[1]{\\scriptsize\\textbf{#1}\\par\\vspace{0.45em}\\rule{0.90\\linewidth}{0.45pt}}
${buildStudentInfoMacroDefinition(includeStudentInfo)}
\\newcommand{\\InstructionPanel}[1]{\\vspace{0.10em}\\noindent\\hrule height 0.45pt\\vspace{0.18em}{\\small\\textbf{تعليمات:} #1}\\vspace{0.18em}\\noindent\\hrule height 0.45pt\\vspace{0.18em}}
\\newcommand{\\AssessmentBand}[1]{\\vspace{0.16em}\\noindent\\textcolor{NibrasLine}{\\rule{\\linewidth}{0.7pt}}\\par\\vspace{0.08em}}
\\newcommand{\\PointBadge}[1]{\\hfill\\textbf{\\underline{#1}}\\par\\vspace{-0.10em}}
\\newcommand{\\FormalPartHeading}[2]{\\vspace{0.46em}\\noindent\\colorbox{NibrasLight}{\\parbox{0.975\\linewidth}{\\vspace{0.18em}\\hspace{0.45em}\\textbf{#1}\\hfill\\colorbox{NibrasAccent}{\\textcolor{white}{\\small\\bfseries #2}}\\hspace{0.45em}\\vspace{0.18em}}}\\par\\vspace{0.12em}}
\\newcommand{\\QuestionItem}[2]{\\vspace{0.16em}\\noindent\\textbf{#1.}\\hspace{0.35em}#2\\par}
\\newcommand{\\AnswerLines}{\\vspace{0.08em}\\noindent\\textcolor{NibrasLine}{\\rule{0.98\\linewidth}{0.36pt}}\\par\\vspace{0.28em}\\noindent\\textcolor{NibrasLine}{\\rule{0.98\\linewidth}{0.36pt}}\\par\\vspace{0.16em}}
\\makeatletter
\\renewcommand\\section{\\@startsection{section}{1}{\\z@}{0.80em}{0.26em}{\\color{NibrasInk}\\large\\bfseries}}
\\renewcommand\\subsection{\\@startsection{subsection}{2}{\\z@}{0.64em}{0.20em}{\\color{NibrasInk}\\normalsize\\bfseries}}
\\renewcommand\\subsubsection{\\@startsection{subsubsection}{3}{\\z@}{0.48em}{0.16em}{\\color{NibrasInk}\\normalsize\\bfseries}}
\\makeatother
\\newcommand{\\AssessmentFooter}[1]{\\vfill\\begin{center}\\renewcommand{\\arraystretch}{1.20}\\begin{tabular}{|>{\\centering\\arraybackslash}p{0.31\\linewidth}|>{\\centering\\arraybackslash}p{0.26\\linewidth}|>{\\centering\\arraybackslash}p{0.33\\linewidth}|}\\hline\\small\\textbf{بالتوفيق والنجاح} & \\small\\textbf{صفحة \\thepage\\ من \\pageref{LastPage}} & \\small\\textbf{علامة التقويم: #1} \\\\ \\hline\\end{tabular}\\end{center}}
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\begin{document}

\\OfficialHeader{${school}}{${formatInline(input.gradeLevel)}}{${date}}{${assessmentLabel(input.assessmentType)} في مادة ${formatInline(input.subject)}}{${duration}}
\\AssessmentTitle{${title}}
\\noindent\\small\\textbf{الموضوع:} ${topic}\\hfill\\textbf{القسم:} ${className}\\par
${buildStudentBlock(input)}
\\InstructionPanel{${subjectNote(input.subject, input.totalPoints)}}
\\AssessmentBand{موضوعات التقويم}
${markdownToLatex(input.content, includeAnswerLines)}
\\AssessmentFooter{${points}} % ${assessmentFooterLabel(theme)} — المجموع: ${points}
\\end{document}
`;
}
