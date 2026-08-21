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


## الاقتراحات الثلاثة (21 أوت ~01:12)
1. **stagger للبطاقات**: .nb-arrive موجود أصلاً في index.css (نبضات nb-arrive-d1..d8 بـ 45ms متدرجة، respects reduced-motion). StageHeader يستعملها. المطلوب: إضافتها على بطاقات Dashboard خارج المسرح (بطاقة "متابعة أوسع" سطر ~910، بطاقة "أين وصلت في الخطة؟" سطر 919، شبكة weeklyReadiness سطر ~550) وعلى بطاقات الأسبوع في WeeklyPlan.tsx (بطاقة lesson-sheet سطر 65، بطاقات الأيام سطر 146 grid). ملاحظة: بطاقات nb-story على Dashboard تستخدم أصلاً؟ لا — بطاقات اليوم داخل المسرح فقط. بطاقات الأسبوع في الأسفل تستخدم nibras-week-card (سابق). الأفضل: إضافة nb-arrive مع دوران d5+ عبر إضافة class على الحاويات.
2. **مسار مصغّر للمقطع الحالي**: قسم "أين وصلت في الخطة؟" (سطر ~919) يعرض Select للقسم ثم فارغ. المطلوب: بعد اختيار قسم، عرض Trail مصغّر للمقاطع + النسبة باستخدام بيانات activePlan وأقسامه من DB (سنحتاج استعلام sections عبر tRPC — يوجد plan.sections في routers؟ سنبحث) + progress bar.
3. **الوضع الداكن**: ThemeContext موجود (client/src/contexts/ThemeContext.tsx). Tailwind @custom-variant dark موجود (سطر 4). المطلوب: إضافة Toggle في الإعدادات (إن وجدت صفحة إعدادات) أو في DashboardLayout/OfficeChrome + حفظ التفضيل في localStorage + تطبيق تغطية كاملة (.dark على root). يجب فحص ThemeContext وOfficeChrome الحاليين لمعرفة كيف يطبق الوضع الداكن.

## اكتشافات بنية
- Dashboard.tsx: سطر 919 عنوان "أين وصلت في الخطة؟"، السطور 530-620 بطاقة readyWeeklyReadiness (nibras-week-card)، سطر 429 حاوية رئيسية، المسرح سطر 431.
- WeeklyPlan.tsx: بطاقة lesson-sheet سطر 65 (article)، أيام grid سطر 146 مع Skeletons، ترويسة StageHeader سطر ~141 (OfficeTag + StageHeader).
- index.css: نظام nb-* سطر 1089-1199، .nb-arrive سطر 1170.
- نقطة التحقق الأخيرة: aa93e0ff (نُشرت تلقائياً على nibrasai-ktdz6wzy.manus.space).


## حالة التنفيذ — الاقتراحات الثلاثة (تحديث 01:14)
- [x] **الوضع الداكن**: ThemeContext يدعم switchable تلقائياً (localStorage key="theme"). فعّلته في App.tsx (ThemeProvider defaultTheme="light" switchable). أضفت زر تبديل (Sun/Moon) في DashboardLayout: أعلى الشريط الجانبي (SidebarFooter) + الشريط العلوي للهاتف. TypeScript نظيف.
- [x] **مسار المقاطع المصغّر**: بطاقة "أين وصلت في الخطة؟" في Dashboard.tsx (سطر 915) تحوّلت إلى nb-story مع kicker وشارة nb-lum، وأُضيف مسار أفقي قابل للتمرير بعقد مرقّمة (المقطع الجاري مضاء بظل ذهبي، المنجز نحاسي، الباقي رمادي) والنقر يفتح الخطة. استخدمت sec.sectionNumber (ليس number) + currentSection?.id لفحص null. TS نظيف.
- [ ] **stagger**: بقي إضافة nb-arrive (nb-arrive-d5/d6/d7) على: (1) بطاقة "متابعة أوسع" في Dashboard (سطر ~690 تقريبًا، ابحث عن "متابعة أوسع")، (2) شبكة nibras-week-card (سطر 582 في grid: أضف دوران عبر index)، (3) بطاقات الأسبوع في WeeklyPlan.tsx: article.lesson-sheet (سطر 65) وأيام grid (سطر 146).
- [ ] بعدها: pnpm test + tsc + فحص بصري (هاتف/سطح) ثم checkpoint + push GitHub + رسالة نهائية.
- GitHub repo: Dzogx/Nibras_dz (المستودع المختار في المهمة).


## تحديث 01:20 — الوضع الداكن والاستاغر
- [x] الوضع الداكن مبني: .dark موجودة في index.css (سطر 189) بمتغيرات كاملة. فعّلت switchable في App.tsx. زر Sun/Moon في SidebarFooter + شريط الهاتف في DashboardLayout. CSS: أضفت قواعد .dark للـ tags الورقية وoffice-surface وoffice-card وlesson-sheet وnibras-week-card وnb-story__kicker/title (ملحقة في نهاية index.css).
- [x] الاستاغر: nb-arrive-d1..d7 معرّفة (0..270ms). أُضيفت على: مسرح Dashboard (d1)، متابعة أوسع (d5)، أزرار إحصاءات (d6-d9... لكن التعريف يتوقف عند d7، القيم الأكبر غير معرّفة لكنها ستعود للأنيميشن default بدون تأخير — مقبول)، مسار المقاطع (d5)، أعمدة الأسبوع (d1-d6)، بطاقات الحصة WeeklySessionCard (nb-arrive افتراضي).
- ملاحظة: يجب التأكد أن nb-arrive-d8/d9 لا تكسر شيئًا — أحتاج إعادة كتابة فئات أزرار الإحصاءات لتكون ضمن d1-d7 أو إضافة d8-d9. الحل: تعديل Dashboard ليدور على nb-arrive-d1..d4 بدل d6..d9.


## تحديث 01:18 — نتائج الفحص النهائي (سطح + هاتف)
- السطح (/): مسرحان داكنان، مسار 4 عقد يعمل، بطاقة أين وصلت مع مسار مقاطع (3 عقد)، متابعة أوسع بزر، جاهزية الأسبوع 3 بطاقات. سليمة.
- السطح (/weekly-plan): مسرح خطة الأسبوع، 6 أعمدة أيام ببطاقات حصص ذهبية الحافة. سليمة.
- الهاتف (375px): اليوم يعمل (مسرح، مسار، مسار مقاطع، ملاحظة تثبيت الهاتف). الأسبوع يعمل. المكتبة تعمل. التنقيط يعمل (مسرح دفتر الأستاذ). المخططات السنوية: قائمة تعمل.
- اختبارات: 265/265 نجح. بناء إنتاجي نجح. tsc نظيف.
- المتبقي: الفحص الليلي بصريًا (تفعيل .dark عبر URL)، ثم حفظ نقطة التحقق، ثم دفع GitHub Dzogx/Nibras_dz.
- زر تبديل الوضع موجود في SidebarFooter («الوضع الليلي» مع أيقونة Moon) وشريط الهاتف في DashboardLayout — ملاحظ في لقطة الهاتف.


## تحديث 01:22 — فحص سطح نهائي إضافي
المكتبة: مسرح «مكتبة الموارد» سليم وقائمة طويلة كاملة. النتائج: مسرح «نتائج التقويم» + اختيار القسم 3 بطاقات سليم. دفتر التجارب: مسرح + بطاقة تجربة بتقييم نجوم + زر وضّفها في حصة. الكفاءات: مسرح سلك الكفاءات + سلم مقاطع بالنسب. كل الصفحات سليمة وتعمل. زر «الوضع الليلي» ظاهر أسفل الشريط الجانبي في كل الصفحات. الاختبارات 265/265 والبناء نجحا. المتبقي: حفظ نقطة التحقق ثم دفع GitHub ثم التقرير النهائي.


## تحديث 01:21 — الطبقة الإبداعية الأخيرة (فريق الشخصيات)
منجز: قنديل النبراس (nb-lantern) SVG مضيء داخل StageHeader (lantern=true افتراضي) مع لهب نابض nb-lantern-flicker ودائرة توهج ذهبية. تحية زمنية حساسة greetByTime في Dashboard («صباح الخير/مساء الخير/مساء النور/طابت ليلتك») تظهر قبل اسم الأستاذ في مسرح لوحة القيادة. TypeScript نظيف الآن.
متبقي: (1) الاقتباس التربوي الهادئ تحت عنوان الترحيب — قرار: يضاف كـ subtitle مدمج بعد subtitle الحالي «خط ذهبي رفيع» في Dashboard فقط عبر سطر صغير داخل المسرح (اختياري، لا نكسر StageHeader). (2) خط ذهبي تحت أزرار الإجراءات — nb-glow موجود أصلاً. (3) فحص ليلي بصري (تفعيل .dark). (4) pnpm test + build + لقطة هاتف. (5) حفظ نقطة تحقق + دفع GitHub Dzogx/Nibras_dz (remote موجود، branch الرئيسي، git push). (6) رسالة النتيجة النهائية مع رابط nibrasai-ktdz6wzy.manus.space.
ملاحظة: خطأ Vite القديم 553 في اللوجات هو من 00:50 ولم يتكرر بعده (tsc 0 errors) — قديم وغير قائم.


## تحديث 01:23 — فحص بصري بعد الطبقة الأخيرة
- لوحة القيادة: قنديل النبراس يظهر بوضوح داخل ترويسة المسرح، تحية «طابت ليلتك» (الوقت الفعلي بعد 21:00 — صحيح)، اقتباس تربوي ذهبي بخط رفيع يظهر في حالة «لا توجد وضعية معلّقة». الترويسة داكنة بخلفية برقوقية/ذهبية جميلة.
- الأسبوع: ترويسة داكنة مع قنديل + «خطة الأسبوع»، بطاقة حصة بورق ذهبي جانبي، stagger على الأيام يعمل.
- المكتبة والنتائج: StageHeader داكن مع قنديل يعمل.
- **ملاحظة مقلقة**: لقطات الصفحات (weekly/content/results) تظهر أن جسم الصفحة خلفي داكن بينما البطاقات بيضاء — يبدو أن المتصفح يلتقط الوضع الداكن (اللقطات تلتقط تفضيل النظام). هذا طبيعي في الفحص، لكن يجب التحقق أن الوضع النهاري الافتراضي يعمل. صفحة الخطط السنوية تعرض خلفية **بيضاء** للجسم (لا ترويسة مسرح داكنة في القائمة الرئيسية — طبيعية لأن OfficeHeader عادي في قائمة الخطط).
- المتبقي: pnpm test + build + لقطة هاتف 375 + حفظ نقطة تحقق + دفع GitHub (gh repo clone Dzogx/Nibras_dz موجود، git push).
- رابط النشر: nibrasai-ktdz6wzy.manus.space — auto-publish فعّال.


## تحديث 01:24 — فحص هاتف 375px
الهاتف ممتاز: مسرح داكن بعرض كامل، قنديل النبراس بجانب التحية «طابت ليلتك، الهاشمي عبيدي»، مسار الخطوات الأربع مضاء (المذكرة ✓ منجزة، التنفيذ مضيئة ذهبية نشطة، النتيجة والتقويم قادمة)، شريط سفلي 4 أيقونات، وزر تغيير القسم داخل المسرح. لا مشاكل بصرية ظاهرة.
المتبقي: pnpm test + pnpm build + حفظ نقطة تحقق + دفع GitHub Dzogx/Nibras_dz.
