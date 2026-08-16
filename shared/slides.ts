/**
 * خطة العرض الصفي (Classroom Slides)
 * تقسيم محتوى المذكرة إلى شرائح عرض جاهزة للشرح على الشاشة أثناء الحصة.
 *
 * القواعد:
 * - الغلاف: عنوان الوضعية + المقطع + المادة + المستوى + المدة
 * - الأهداف: من حقل objectives (Markdown)
 * - مراحل الحصة: تقسيم content/plan حسب العناوين الرئيسية في Markdown (##) —
 *   كل قسم يصبح شريحة بعنوانه ومحتواه
 * - التقويم/الواجب: إن وُجد قسم «التقويم» أو «الواجب» يصبح شريحة ختامية
 * - شريحة نهاية الحصة دائماً في الختام
 * الوحدة قابلة للاختبار بالكامل (لا تعتمد على React أو DB).
 */

export interface Slide {
  kind: "cover" | "objectives" | "stage" | "assessment" | "closing";
  title: string;
  /** Markdown — كل المحتوى داخل الشريحة */
  body: string;
}

export interface SlidesSource {
  title?: string;
  unitTitle?: string;
  subject?: string;
  gradeLevel?: string;
  duration?: string;
  objectives?: string;
  plan?: string;
  content?: string;
}

/** تنظيف سطر Markdown من رموز التنسيق */
export function cleanInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

/** تقسيم نص Markdown إلى أقسام حسب العناوين الرئيسية (##) */
export function splitIntoSections(md: string): { title: string; body: string }[] {
  const lines = md.split("\n");
  const sections: { title: string; body: string }[] = [{ title: "", body: "" }];
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^#{2,6}\s+(.+)$/);
    if (h2) {
      sections.push({ title: cleanInline(h2[1]), body: "" });
    } else {
      const last = sections[sections.length - 1];
      if (!last.title || last.body || line.trim()) {
        last.body += (last.body ? "\n" : "") + line;
      }
    }
  }
  return sections;
}

/** كلمات دلالة لأقسام التقويم والواجب (بداية القسم) */
function isAssessmentSection(title: string): boolean {
  const t = cleanInline(title).trim();
  return /^(التقويم|التقويم التكويني|الوضعية الإدماجية|الواجب|واجب منزلي|تمارين|فرض)/.test(t);
}

/** تقسيم شريحة إذا كان محتواها طويلاً جدًا (أكثر من ~1500 حرف تقريبيًا) */
const MAX_SLIDE_BODY = 1500;

function splitLongBody(title: string, body: string, kind: Slide["kind"]): Slide[] {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length <= MAX_SLIDE_BODY) {
    return trimmed ? [{ kind, title, body: trimmed }] : [];
  }
  // التقسيم على فواصل الأسطر الفارغة (فقرات)
  const paragraphs = trimmed.split(/\n\s*\n+/);
  const slides: Slide[] = [];
  let acc = "";
  let index = 0;
  for (const p of paragraphs) {
    if (acc && acc.length + p.length + 2 > MAX_SLIDE_BODY) {
      slides.push({ kind, title: index === 0 ? title : `${title} (تابع ${index})`, body: acc.trim() });
      acc = "";
      index++;
    }
    acc += (acc ? "\n\n" : "") + p;
  }
  if (acc.trim()) {
    slides.push({ kind, title: index === 0 ? title : `${title} (تابع ${index})`, body: acc.trim() });
  }
  return slides;
}

/**
 * تحويل مذكرة درس إلى شرائح عرض صفي.
 * لا يقذف أبدًا — إذا كان المحتوى فارغًا ينتج غلافًا وشريحة نهاية فقط.
 */
export function lessonToSlides(source: SlidesSource): Slide[] {
  const slides: Slide[] = [];

  // 1) الغلاف
  slides.push({
    kind: "cover",
    title: (source.title || "").trim() || "الدرس",
    body: [
      source.unitTitle ? `المقطع: ${cleanInline(source.unitTitle)}` : "",
      source.subject ? `المادة: ${source.subject}` : "",
      source.gradeLevel ? `المستوى: ${source.gradeLevel}` : "",
      source.duration ? `المدة: ${source.duration}` : "",
    ].filter(Boolean).join("\n"),
  });

  // 2) الأهداف
  if (source.objectives?.trim()) {
    slides.push({ kind: "objectives", title: "الأهداف", body: source.objectives.trim() });
  }

  // 3) مراحل الحصة: نفضّل content أولًا (محتوى المذكرة الكامل من AI) ثم plan
  const primary = (source.content || "").trim();
  const secondary = (source.plan || "").trim();

  if (primary) {
    const sections = splitIntoSections(primary);
    let assessmentAppended = false;
    for (const section of sections) {
      if (!section.title && !section.body.trim()) continue;
      const title = section.title || "مراحل الحصة";
      const kind: Slide["kind"] = isAssessmentSection(title) ? "assessment" : "stage";
      for (const s of splitLongBody(title, section.body.trim(), kind)) slides.push(s);
      if (kind === "assessment") assessmentAppended = true;
    }
    // إن لم يكن content مقسّمًا إلى أقسام (لا يوجد ##) → شريحة واحدة للمحتوى
    if (sections.length === 1 && sections[0].body.trim() && !sections[0].title) {
      const body = sections[0].body.trim();
      for (const s of splitLongBody("محتوى الدرس", body, "stage")) slides.push(s);
    }
    // إن كان content أقسامًا لكن لا يوجد قسم تقويم → نبحث في plan
    if (!assessmentAppended && secondary) {
      const planSections = splitIntoSections(secondary);
      for (const section of planSections) {
        if (!section.title || !isAssessmentSection(section.title)) continue;
        for (const s of splitLongBody(section.title, section.body.trim(), "assessment")) slides.push(s);
      }
    }
  } else if (secondary) {
    const sections = splitIntoSections(secondary);
    for (const section of sections) {
      if (!section.title && !section.body.trim()) continue;
      const title = section.title || "خطة سير الحصة";
      const kind: Slide["kind"] = isAssessmentSection(title) ? "assessment" : "stage";
      for (const s of splitLongBody(title, section.body.trim(), kind)) slides.push(s);
    }
  }

  // 4) شريحة النهاية
  slides.push({ kind: "closing", title: "نهاية الحصة", body: "" });

  return slides;
}

export function slideCountByKind(slides: Slide[]): Record<Slide["kind"], number> {
  const counts: Record<Slide["kind"], number> = { cover: 0, objectives: 0, stage: 0, assessment: 0, closing: 0 };
  for (const s of slides) counts[s.kind]++;
  return counts;
}
