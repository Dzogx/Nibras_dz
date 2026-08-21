# حالة تنفيذ Nibras Signature (الإبداع البصري) — تحديث مستمر

## المهمة
المستخدم قال "لقد خيبت ظني أظن أنه يمكنك أن تبدع أكثر": المطلوب رفع التصميم من «مكتب نظيف» إلى هوية إبداعية مميزة "المسار المضاء".

## ما أُنجز حتى الآن
1. ✅ todo.md: أضيفت بنود الإبداع البصري (السطور الجديدة، راجع todo.md: "إبداع بصري/Signature")
2. ✅ ux-audit/06-creative-direction.md: التوجه المكتوب (يقرأه أي مرحلة قادمة)
3. ✅ index.css (نهاية الملف، بعد سطر 931): أُضيف نظام CSS كامل `nb-*`:
   - `.nb-stage` مسرح داكن (تدرج بنفسجي-حكّي + حبيبات ضوئية + حد ذهبي سفلي)
   - `.nb-stage-title` `.nb-stage-eyebrow` `.nb-stage-sub`
   - `.nb-stage-track` `.nb-stage-node` `.nb-stage-node__dot` `.nb-stage-connector`
   - `.nb-trail` `.nb-trail-item` (timeline عمودي مضاء)
   - `.nb-story` `.nb-story__kicker/title/narration/actions` (بطاقة سردية)
   - `.nb-story--in-dark` `.nb-lum` `.nb-glow`
   - `@keyframes nb-arrive` + `.nb-arrive-d1..d8` + prefers-reduced-motion
4. ✅ OfficeChrome.tsx (نهاية الملف): أضيفت:
   - `StageHeader({ eyebrow, title, subtitle, track, children })` — مسرح داكن
   - `StageTrack({ steps, className })` — خطوات مضاءة داخل المسرح (الاستخدام: `track={[{label, href?, done?}]}`)
   - `SignatureSection({ title, children, className })` — فاصل بنقطة ضوء
   - `Trail` + `TrailItem({ title, children, state: upcoming|current|done })`
5. ✅ TypeScript نظيف (0 أخطاء)، لقطة مرجعية لـ /dashboard ملتقطة قبل التطبيق.

## المرجع البصري الحالي (/dashboard لقطة)
- الترويسة الحالية: «مرحباً، الهاشمي عبيدلي» + «مساحة الأستاذ اليومية» + سطر ثانوي (السنة الدراسية)، ثم بطاقة «قرار واحد واضح — مسار حصتك الآن» (رقم 1 ذهبي دائري)، ثم «لا توجد وضعية معلقة» + زر «الذهاب إلى الخطة»، ثم شريط خطوات 1-4 (المذكرة/التنفيذ/النتيجة/التقويم) بأرقام دائرية رمادية + نشط ذهبي، ثم بطاقات أقسام للأسبوع القادم (1م1/3م2/2م3).
- Sidebar داكن على اليمين مع عناصر اليوم/الأسبوع/المخططات/التقويم/المكتبة/النتائج/دفتر التنقيط/التجارب/الكفاءات/الإعدادات.

## خطة التطبيق المتبقية
- [ ] Dashboard.tsx: استبدال ترويسة «مساحة الأستاذ اليومية» بـ `StageHeader` (eyebrow: التاريخ، subtitle قصير) مع الحفاظ على كل المنطق الحالي. تحويل «مسار حصتك الآن» إلى nb-story. أعمدة الأسبوع القادم إلى nb-story أيضاً. إضافة nb-arrive للبطاقات.
  - استيراد: `import { StageHeader, StageTrack } from "@/components/OfficeChrome";`
  - البطاقة الحالية في Dashboard تستخدم classes office-* — تبقى كهيكل وتُستكمل بـ nb-*
- [ ] WeeklyPlan.tsx: StageHeader (eyebrow: «الأسبوع الحالي») + بطاقات أيام nb-story
- [ ] AnnualPlanDetail.tsx: StageHeader للسطر الأول (المادة/المستوى) + TrailItem لكل مقطع/وضعية
- [ ] LessonDetail.tsx: StageHeader (eyebrow: المادة والمستوى)
- [ ] Assessment.tsx: StageHeader
- [ ] Results/StudentResults/Gradebook/Competencies/ExperimentLog/Inspector/ContentLibrary: ترقية ترويسة OfficeHeader الحالية → إضافة StageHeader (ترويسة داكنة) أو على الأقل SignatureSection + nb-lum في العناوين
- [ ] تفاصيل دقيقة: nb-glow حول أزرار «توليد» الذهبية، nb-story__kicker لوسوم المواد (نبراس-tag)
- [ ] فحص بصري: /dashboard، /weekly، /annual-plans/90001، /assessment، + هاتف 375px
- [ ] pnpm test + tsc → checkpoint + نشر تلقائي (auto-publish مفعّل)
- [ ] دفع إلى github Dzogx/Nibras_dz (remote باسم github، branch main) + تسليم للملف + رسالة شرح

## ملاحظات تقنية
- خطأ Vite «ExperimentLog.tsx Unexpected token (203:6)» هو من 12:28 (حادثة قديمة قبل هذا الطلب) — الملف سليم الآن، tsc=0. تجاهله.
- auto-publish: مفعّل. كل checkpoint ينشر فوراً على nibrasai-ktdz6wzy.manus.space
- خط Cairo موجود. الألوان: brand-ink (حكّي داكن)، brand-wax (ذهبي)، brand-sand (خلفية فاتحة)
- صفحة اليوم تستخدم StepTrack الحالية (office-track) — StageTrack يستبدلها داخل المسرح
- الترويسة الداكنة يجب ألا تكسر Sidebar الدائم (DashboardLayout) — توضع داخل main

## تفاصيل تطبيق Dashboard (جاهزة للتنفيذ)
- الترويسة الحالية: خطوط 432-466 (div يفتح، سطر "حصة اليوم جاهزة/مساحة الأستاذ اليومية" 433، h1 "مرحباً،..." 434، office-subtitle 437-440، DropdownMenu اختيار القسم 441-465، إغلاق div 467)
- StepTrack الحالي (469-488): يحول إلى `StageTrack` داخل المسرح الداكن، مع track prop في StageHeader
- بطاقة المسار (481): `<Card className="lesson-sheet border-none ...">` تصبح مسرح داكن واحد يجمع العنوان + الخطوة + المحتوى: استخدام StageHeader بدل سطر «قرار واحد واضح» + بطارية البطاقة: استبدال Card بـ div.nb-stage مع إبقاء <CardContent> كـ div عادي داخلي (المحتوى الحالي يستخدم ألوان بيضاء/نص داكن على خلفية فاتحة في content — لكن البطاقة حالياً خلفية فاتحة؛ الحل: تحويل البطاقة نفسها إلى nb-stage داكنة (تستخدم النصوص البيضاء white/75 الموجودة أصلاً في محتوى الحالات الفارغة)، والحالة hasDailySession تستخدم white/90)
- ملاحظة: في الحالة hasDailySession المحتوى يستخدم text-muted-foreground (داكن) — يجب تحويله إلى أبيض/رمادي فاتح داخل المسرح: نضيف className خاص أو نحيط المحتوى بـ div.nb-story--in-dark
- خطة: StageHeader {eyebrow: `حصة اليوم جاهزة | مساحة الأستاذ اليومية`, title: `مرحباً، ${name}`, subtitle: (نفس subtitle الحالي), track: steps} + بعد العنوان: StepTrack/StageTrack
- import StageHeader من OfficeChrome
- بطاقات «جاهزية الأسبوع القادم» (600+): تحويل nibras-week-card إلى nb-story (فاتحة) مع nb-story__kicker للوضعية التالية
-WeeklyPlan: نفس النمط: StageHeader فوق
- ألوان: brand-ink (حكّي)، brand-wax (ذهبي)، brand-sand

## تحديث — Dashboard اكتمل ✅
- الترويسة + شريط الخطوات + بطاقة «مسار حصتك الآن» اندمجت في مسرح داكن واحد (StageHeader + ContentInside nb-stage). TypeScript = 0. لقطة فحص: المسرح ظهر بنجاح — سطر علوي ذهبي، عنوان كبير، مسار 4 خطوات مضاء، وزر «تغيير القسم» داخل المسرح.
- ملاحظة بصرية: «لا توجد وضعية معلقة» تظهر كاستمرار للمرح الداكن — مقصود ومقبول.
- ملاحظة للتحسين لاحقاً: «نظرة استباقية» في التقرير الأسبوعي الكيكر باهت — يوحَّد مع eyebrow ذهبي.

## المتبقي الآن
1. [ ] LessonDetail.tsx: StageHeader + nb-story للبطاقات
2. [ ] AnnualPlanDetail.tsx: StageHeader + TrailItem للمقاطع
3. [ ] WeeklyPlan.tsx: StageHeader + nb-story لأيام الأسبوع
4. [ ] Assessment.tsx: StageHeader
5. [ ] ContentLibrary/Results/StudentResults/Gradebook/Competencies/ExperimentLog/Inspector: إضافة nb-lum/nb-story للكارات الرئيسية على الأقل
6. [ ] فحص بصري شامل + هاتف + pnpm test + tsc
7. [ ] checkpoint + push github + تسليم


## حالة إصلاح Dashboard (00:54)
- خطأ Vite الحالي: Dashboard.tsx سطر 553 — div غير مغلق. السبب: StageHeader يعرّف `<header>` فقط بلا children-card، لكن الكود الحالي يضع بعد `</StageHeader>` سطرًا: `<CardContent className="nb-stage px-5 ...">` داخل wrapper div مفتوح (431 rounded-t-lg) دون Card. أي: div 431 فُتح، StageHeader افتُتح وأُغلق، ثم CardContent و div إغلاق 553-554 — CardContent بلا Card = خطأ JSX.
- الإصلاح: حذف `<CardContent ...>` (541) و `</div>` (553...?) والتحقق: الفتحات 431 div → ... المحتوى → 554 `</div>`. بعد حذف CardContent و إغلاقه: يجب التحقق من الإغلاقات.
- LessonDetail: أُعيد تصميمها بـ StageHeader بنجاح (TypeScript نظيف). OfficeTag لا يدعم tone — استخدم className="nb-story--in-dark".
- المتبقي بعد إصلاح Dashboard: WeeklyPlan / AnnualPlanDetail / Assessment / ContentLibrary / Results / Gradebook / Competencies / ExperimentLog / StudentResults بـ StageHeader، ثم فحص بصري شامل، تسليم.


## فحص بصري 01:00 (بعد إصلاح JSX)
المسارات الصحيحة: /dashboard (وليست /) و/lessons/:id و/annual-plans/:id و/assessment. لوحة القيادة تعمل الآن بمسرحين داكنين: مسرح الترحيب (يعمل جيدًا مع المسار المضاء) ومسرح «حصة اليوم» يعمل. `/lessons/1` غير موجود في البيانات، `/annual-plans/1` يعرض «الخطة غير موجودة». `/weekly-plan` و`/assessment` بترويسات OfficeHeader قديمة — يحتاجان StageHeader. `/content-library` قائمة قديمة تحتاج SignatureSection.


## تقدم المرحلة 5 (01:05)
- [x] Dashboard.tsx: أُصلح خطأ JSX (CardContent→div)، المسرحان الداكنان يعملان (لقطة /dashboard مؤكدة).
- [x] WeeklyPlan.tsx: StageHeader {eyebrow: `الأسبوع الحالي · ${academicYear}`, title: "خطة الأسبوع", subtitle: "راجع حصصك القادمة..."} + OfficeTag className="nb-story--in-dark". TypeScript نظيف.
- متبقٍ: AnnualPlanDetail (سطر 172-198 OfficeHeader مع crumbs[{label:"المخططات",href:"/annual-plans"}] وعنوان plan.title وsubtitle يجمع subject/gradeLevel/academicYear/progress، actions: مرجع رسمي وZر تحرير) → StageHeader مع crumbs (يدعمها؟ لا، StageHeader لا يدعم crumbs — نضعها كـ eyebrow نصي أو نضيف دعمها لاحقًا).
- Assessment.tsx (سطر 517): OfficeHeader title="استوديو التقييم" subtitle="توليد الاختبارات والامتحانات..." → StageHeader.
- ContentLibrary (سطر 69)، Results (135)، Gradebook (230)، Competencies (527)، ExperimentLog (191)، StudentResults (229): ترقيات أخف = إضافة SignatureSection أو مجرد إضافة nb-lum.
- LessonDetail.tsx: مكتمل بـ StageHeader.
- بعد كل الصفحات: فحص بصري desktop+mobile، pnpm test، tsc، checkpoint (auto-publish مفعّل)، تسليم.
- معرفات للفحص: /annual-plans/90001 يعمل، /dashboard، /weekly-plan، /assessment، /content-library.


## مواضع الترويسات المتبقية (بعد WeeklyPlan ✅ + AnnualPlanDetail ✅ + Assessment ✅ + ContentLibrary ✅)
المتبقي للترقية إلى StageHeader (كلها: استيراد `StageHeader` من OfficeChrome وإضافة eyebrow):
1. Results.tsx سطر 135: `<OfficeHeader title="نتائج التقويم" subtitle="إدخال النتائج المجمعة وتحليل الأداء" />` — استيراد في السطر 16.
2. Gradebook.tsx سطر 230-233: OfficeHeader title="دفتر التنقيط" subtitle طويل "علامة التقويم المستمر (/20=..." — داخل `<div className="mb-6">` في سطر 229 (wrapper div يبقى كما هو حول StageHeader بلا مشكلة).
3. Competencies.tsx سطر 527-530: OfficeHeader title="سلم الكفاءات" subtitle طويل.
4. ExperimentLog.tsx سطر 191-201: OfficeHeader مع children (زر إضافة استراتيجية بـ className="office-primary") — أضيف nb-story--in-dark للزر وأحول OfficeTag/OfficeHeader إلى StageHeader (eyebrow: "دفتر التجارب").
5. StudentResults.tsx سطر 229-235: OfficeHeader مع children (زر استيراد بـ className="office-primary") — نفس الأسلوب.
6. Inspector.tsx سطر ~233-235: OfficeHeader بسيط (اختياري، أخف).

بعد ذلك: فحص بصري (desktop /mobile 375)، pnpm test + tsc، checkpoint، تسليم.
ملاحظة: OfficeHeader ما زال يُستخدم في بعض الصفحات (Home/Lessons/LessonGenerator...) ولا مشكلة ببقائه؛ التركيز على الصفحات المدرجة في نبراس Signature.


## فحص بصري مكتمل (01:08)
جميع الصفحات المرقّاة تعمل: weekly-plan، annual-plans/90001 (مسار المقاطع المضاء جميل)، assessment، content-library، competencies، experiment-log، gradebook، student-results، results، inspector، dashboard — desktop سليم والهاتف 375px سليم (المسار والزر مدمجان جيداً).
المتبقي: pnpm test + tsc --noEmit + pnpm run build → checkpoint → تسليم.
