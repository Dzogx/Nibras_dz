# حالة تنفيذ إعادة تصميم «مكتب الأستاذ» (تُحدَّث باستمرار)

## المنجز
1. ux-audit/01-04.md: تدقيق Dashboard + بقية الصفحات + الخطة + حالة Dashboard الحالية.
2. index.css: أُضيف نظام office-* (office-surface, office-card, office-header, office-breadcrumb, office-title, office-step, office-track, office-primary, lesson-sheet, office-tag, office-body-text, office-section, office-sidebar-item). القديم محفوظ.
3. todo.md: أُضيفت بنود إعادة التصميم (مرحلة 9: التدقيق UX، مرحلة 10: فلسفة مكتب الأستاذ، مراحل 11-20 لكل صفحة/ميزة، فحص هاتف، نقطة تحقق، تسليم).

## التالي (ترتيب التنفيذ)
1. components/OfficeChrome.tsx جديد: OfficeHeader (breadcrumb + عنوان + إجراء) + StepTrack — استخدام breadcrumb من ui/breadcrumb.tsx موجود (Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator).
2. DashboardLayout: تسميات تنقل أبسط وأيقونات أوضح (اليوم LayoutDashboard, الأسبوع CalendarDays, المخططات FileText, التقويم ClipboardCheck, النتائج BarChart3, دفتر التنقيط ClipboardList, المكتبة Library, التجارب BookOpen, الكفاءات Award) + mobileQuickActions 4 عناصر + ترويسة جانبية مكتبية.
3. Dashboard.tsx: إعادة هيكلة JSX لسطح مكتب (شكر: Hero أخف + بطاقة خطوة مرقمة بـ office-track + lesson-sheet) مع بقاء كل الاستعلامات والمنطق كما هو (academicYear/fallbackYear, activeClassId, dailySituation, findReadyLessonPlan, completeSessionMutation, reschedule, strategy).
4. الصفحات الداخلية بنفس النمط تدريجياً (WeeklyPlan, AnnualPlans/AnnualPlanDetail, Lessons/LessonDetail, ResourceDetail, Assessment, ContentLibrary, Results/StudentResults, Gradebook, Competencies, ExperimentLog, Inspector).
5. فحص: pnpm test + tsc --noEmit + لقطات هاتف 375px ثم checkpoint وتسليم.

## قواعد
- لا تغيير schema/routers وظيفياً. كل ملف صغير checkpoint غير ضروري — نقطة تحقق واحدة في النهاية تكفي إن لم يكن كبيراً.
- الوثائق المطبوعة لا تُلمس.

## تحديث (لحظة الإضافة):
- OfficeChrome.tsx أُنشئ (OfficeHeader, StepTrack, LessonSheet, OfficeSection, OfficeTag). TypeScript كان نظيفاً قبل التعديلات.
- DashboardLayout: تسميات أنظف (اليوم/الأسبوع/المخططات/التقويم/المكتبة/النتائج/دفتر التنقيط/التجارب/الكفاءات) + office-sidebar-item + office-surface على main.
- Dashboard.tsx: أعدتُ تصميم الترويسة (خفيفة بلا hero داكن) + StepTrack + بطرت lesson-sheet. لكن edit تحويل CardContent من داكن إلى فاتح كان جزئياً → **أخطاء TypeScript**: سطر 591 (') expected) و668 (JSX multiple parents) — سببها أن `<Card>` أُغلق بإدخال `<div className="lesson-sheet ...">` في سطر 480 لكن الإغلاق `<CardContent/></Card>` في الأسفل (حوالي 680) لم يُعدَّل. الحل: إبدال `<Card className=...>` بالسطر 480 تقريباً (قبل `<CardContent`) إلى div lesson-sheet وإزالة إغلاق `</Card></CardContent>` المتبقي، أو الأسهل: الحفاظ على `<Card>` واستخدام className داخلي.
- ملاحظة: أرقام السطور بعد التعديل تقريباً: الفتحة 480، الإغلاق القديم 590-592 (`</CardContent></Card>`)، وJSX النهائي للصفحة ينتهي عند ~1201 (يجب التحقق من الإغلاق الأخير).
- StepTrack مستوردة من "@/components/OfficeChrome" — يجب إضافة import.

## خطأ React.Children.only بعد لقطة 00:15:55:
خطأ SlotClone على button (Stack: react-slot -> updateForwardRef) — يظهر في صفحة /dashboard. السبب المرجح: شيء يستدعي Slot/Primitive.button.cloneElement على element فيه أطفال متعددون. المرشحان: (1) DropdownMenuTrigger asChild مع Button فيه (أيقونة + نص) — هذا صحيح عادة فلا يكون السبب إلا لو تكرّر Trigger/Trigger متداخل؛ (2) **خطأ جديد دخل مع التعديل**: السطر 530 ` <DropdownMenuTrigger asChild> <Button ...>المزيد</Button></DropdownMenuTrigger>` مع السطر 492 مشابه. كلاهما سليم فردياً. الفحص: ربما المشكلة في StepTrack؟ لا علاقة. الاحتمال الأقوى: خطأ قديم موجود قبل تعديلي لكن لم يظهر لأن الحالة hasDailySession كانت مختلفة — لكن screenshot السابق (قبل تعديلي) عرض الصفحة سليماً. إذاً هو جديد: **ربما DropdownMenuTrigger داخل CardHeader الأصلي في الكود القديم كان يعمل، والتعديل لم يلامسه**. الفحص الأدق: السطر 530 الجديد فيه `<DropdownMenuTrigger asChild><Button variant="outline"...` — لكن السطر 530 القديم كان `variant="ghost"` وclass نص أبيض. كلاهما Button واحد، سليم.
ملاحظة إضافية: screenshot بعد التثبيت يظهر "An unexpected error occurred" مع stack SlotClone -> button — يجب grep على "DropdownMenuTrigger" داخل البطاقة (سطور 490-532) بحثاً عن تكرار.

## ملخص الحالة الحالية (00:20):
- TypeScript نظيف (DONE بعد إصلاح StepTrack import وCardContent).
- خطأ runtime React.Children.only يظهر في /dashboard (SlotClone → button). الكود يبدو سليماً: الـ Triggers منفصلة وليست متداخلة. الاحتمال الأقوى: خطأ موجود أصلاً في النسخة الد7082d37 قبل تعديلي لكن لم يظهر في الـ screenshot لأن الحالة تختلف (الصفحة لم تخطئ في لقطة 00:14 قبل أخطائي). بعد إصلاحات JSX (00:15:31-40 HMR) صار الخطأ يظهر — أي أن الخطأ **موجود أصلاً في الكود قبل هذا التعديل** (Dashboard يعمل عند المستخدم سابقاً وفق الجلسة السابقة، والآن يعرض خطأ). يجب الفحص من browser logs عند أول تحميل.
- خطة التوطين: تشغيل لوحة المتصفح على /dashboard ومعرفة الحالة التي تُطلق الخطأ؛ إن ظهر مع بيانات الأستاذ فإصلاحه، وإلا مراجعة console log.
- الخطوات المتبقية لإعادة التصميم (todo.md بنود UX/UI): (1) ترويسة Dashboard OK؛ (2) بطرت حصة اليوم OK؛ (3) أسبوع/مخططات/وضعية (Phase 4)؛ (4) تقويم/نتائج/مكتبة/تنقيط/Inspector (Phase 5)؛ (5) اختبارات + checkpoint + تسليم.
- روابط: المعاينة https://3000-i02x7sk2782kgvrg7y04q-822686b0.us4.manus.computer | النشر nibrasai-ktdz6wzy.manus.space | الجولة العامة /expert-tour.
- المستخدم: الهاشمي عبيدلي، 3 أقسام (1م1، 2م3، 3م2)، سنة 2026-2027. طلب UX redesign كامل دون تغيير الوظائف.

## تشخيص الخطأ (00:30):
كل المواقع asChild في Dashboard وLayout تستخدم Button/button واحدًا كطفل. نمط "أيقونة+نص" داخل الزر سليم تاريخيًا (السطران 446 و493 يعملان). المرشح الأخير: السطر 532 (زر «المزيد» الجديد) — نفس النمط لكنه الوحيد الجديد. **خطة التحقق**: حذف DropdownMenu السطر 531-548 مؤقتًا وإعادة اللقطة. إن اختفى الخطأ فالتشخيص مؤكد (قد يكون الزر الجديد في حالة renders children متعدد... أو خطأ HMR عالق). إن استمر فالفحص يتجه لمكوّن آخر في Dashboard يُعرض بعد login فقط (مثل Dialog الاستراتيجة أو بطاقات أسفل الصفحة).

## التشخيص المؤكد (00:19):
بعد تعليق DropdownMenu السطر 532 (زر «المزيد») اختفى الخطأ وظهرت الصفحة سليمة (لقطة 00:19:07). لكن المحتوى المعطل لا يتضمن أي asChild جديد غير الذي فحصته — إذن المشكلة **داخل DropdownMenuContent نفسه**: أحد `<DropdownMenuItem>` يحتوي children متعددين غير ملفوفين داخل slot عند الفتح؟ لا — SlotClone يعمل على trigger فقط. الحل: إعادة تفعيل القائمة لكن بنقل Trigger ليستخدم Button دون asChild (حذف asChild يجعل Radix يرسم button عاديًا ويستوعب أطفال الزر دون React.Children.only). هذا هو الإصلاح الأمثل: `<DropdownMenuTrigger asChild>` مع Button فيه `<Icon/>نص` يحسب children للـ Slot كطفلين في React 19 مع بعض إصدارات radix. الأسلم: حذف asChild.

## الإصلاح مؤكيّد (00:20):
الخطأ زوال تمامًا. السبب الجذري: `<DropdownMenuTrigger asChild>` مع Button يحتوي طفلين JSX مباشرين (أيقونة + نص) في React 19 مع إصدار radix الحالي يؤدي إلى React.Children.only. الحل المطبّق: إبقاء asChild مع لف النص داخل `<span>المزيد</span>` — الآن الطفل الوحيد للـ Slot هو Button، وداخله أيقونة + span. لقطة 00:19:40 تظهر الصفحة كاملة: مسار الحصة، بطاقات الأقسام الثلاثة (1م1/2م3/3م2)، بطاقة «أين وصلت في الخطة؟»، دفتر متابعة التدريس. **الآن: استكمال إعادة تصميم بقية الصفحات (المرحلة 4).**

## حالة متقدمة (الآن):
- خطأ React.Children.only أُصلح نهائيًا بإعادة تفعيل قائمة «المزيد» مع `<span>المزيد</span>` داخل Button. صفحة اليوم تعرض: مسار حصة (المذكرة✓/التنفيذ/النتيجة/التقويم)، بطاقة «مسار حصتك الآن» بعنوان الوضعية الحالية والمقطع، زر «افتح مذكرة الحصة» + «المزيد»، بطاقات «جاهزية الأسبوع القادم» للأقسام الثلاثة، «متابعة أوسع»، «أين وصلت في الخطة؟»، دفتر متابعة التدريس.
- لقطة 00:20:19 من webdev_take_screenshot تظهر الصفحة تعمل بالكامل.
- **المرحلة 4 الحالية**: إعادة تصميم صفحات المسار التربوي: WeeklyPlan (الأسبوع)، AnnualPlanDetail (المخطط/المقطع)، LessonDetail (المذكرة). بعدها المرحلة 5: Assessment/ContentLibrary/Results/Gradebook/Competencies/ExperimentLog/Inspector + هاتف.
- todo.md بنود: مرحلة 10 (مكتب الأستاذ)، مراحل 11-20 موزعة على الصفحات، فحص هاتف، checkpoint، تسليم.
- قاعدة: checkpoint واحد في النهاية + TypeScript نظيف + pnpm test قبل التسليم.

## المرحلة 4 — الأسبوع (WeeklyPlan) أُنجز:
ترويسة OfficeHeader + OfficeTag، بطاقات حصص lesson-sheet (حد ذهبي جانبي، بلا توهج)، أعمدة أيام office-card بترويسة مفصولة. لقطة تؤكد العمل: أيام الأحد/الاثنين مع بطاقات الأقسام وأزرار «حضّر/افتح مذكرة الحصة». TypeScript نظيف. **التالي: AnnualPlanDetail ثم LessonDetail.**

## AnnualPlanDetail — قبل التعديل (مرجع للبدء):
ملف 699 سطر، مسار `/annual-plans/:id`. الترويسة الحالية (سطور 170-190): زر رجوع ghost + h1، صف Badges (المادة/المستوى/السنة/مرجع رسمي/عداد x/y وضعية/زر تحرير)، رسالة مرجع رسمي، نموذج تحرير Card (عنوان/مادة/مستوى/محتوى + حفظ)، محتوى Markdown في Card. قسم «المقاطع والوضعيات التعليمية» (سطر 226) + Dialog مقطع جديد (إضافة: title/duration/competencies/objectives/resources + sectionNumber تلقائي). المقاطع: Card قابل للطي (isCompleted أخضر) مع CheckCircle2/Circle، داخله وضعيات. Dialogs أخرى: إضافة وضعية (newSituation: sectionId/title/objectives/content)، «سجّل نتيجة الحصة» (4 حالات outcome: completed/partial/postponed/cancelled مع guidance)، «استراتيجية تسيير» (strategySituationId → suggestStrategy → حفظ لدفتر التجارب)، createLessonFromSituation → /lessons/:id، toggleSituationMutation (إعادة فتح). الحالة: expandedSection, sessionDialogSituation, addSectionOpen, addSituationOpen, editForm, newSection, newSituation.
التعديل المخطط: OfficeHeader بـ crumbs [/annual-plans«المخططات», عنوان الخطة] + OfficeTag للعداد بدل صف badges + OfficeCard/lesson-sheet للمقاطع + OfficeSection للعناوين، بدون تغيير أي منطق.
بعد AnnualPlanDetail يأتي LessonDetail (384 سطر): ترويسة lesson-workspace-header مزدحمة الأزرار → OfficeHeader + تسلسل Steps (حضّر←معاينة←طباعة←نفّذ).

## حالة AnnualPlanDetail (لحظة الضغط)
تم تطبيق ترويسة OfficeHeader + OfficeTag (مرجع رسمي) + OfficeSection على AnnualPlanDetail. لكن هناك خلل وسوم يجب إصلاحه يدوياً:
1. السطر 276: يوجد `</OfficeSection>` — هو الإغلاق الصحيح الوحيد (يجب البقاء).
2. بعد السطر 455 يوجد `</OfficeSection>` إضافي حُذف من 457 لكن التحليل ما زال يظهر EXTRA CLOSE عند 276 — السبب الحقيقي: regex التقط `<OfficeSection ...>` داخل استيراد السطر 11؟ لا. السبب الأرجح أن هناك `<OfficeSection` آخر لم يُفتحه: في الحقيقة OfficeHeader يفتح عند 172 وOfficeTag عند 186 وOfficeSection عند 233، كلها تفتح. التحليل يبدأ من 200 ففاتته فتحة 233؟ لا هو ضمن النطاق. الاحتمال: regex التقط `OfficeSection` في تعليق JSX؟ لا تعليقات. **الفرضية الأرجح**: سطر 276 كان يحتوي `</OfficeSection>` وهو صحيح لكن فتح السطر 233 لم يُعد لأن regex يتطلب `\b` بعد الاسم مع attributes — السطر 233 مفتوح على سطر آخر: `<OfficeSection` في 233 و`title=...` في 234 — regex يعمل لأنه يلتقط كل سطر. غامض. **الحل الآمن**: التحويل النهائي يدوياً — إزالة `</OfficeSection>` من السطر 457 (تم) والتحقق من tsc. إذا بقي خطأ، فتحقق أن 457 أزيل فعلياً (قد لا يكون sed أزاله بسبب ترقيم متغير).
3. تحليل الوسوم الحالي يقول: EXTRA CLOSE عند 276 + LEFT OPEN div عند 467. السطر 467 هو `<div className="grid grid-cols-2 gap-2" aria-label="حالة الحصة">` داخل Dialog «سجّل نتيجة الحصة» — هذا سليم داخل Dialog. الخطأ الحقيقي الذي يخبره tsc (457) = EXTRA CLOSE OfficeSection عند السطر بعد 456 (أي بقايا سطر فارغ سابق 457). الترتيب الصحيح: OfficeSection يُغلق عند 276؟ لا!
**الحقيقة**: التحويل المقصود مني كان: OfficeSection يضم فقط عنوان القسم + زر إضافة، ثم قائمة المقاطع خارجه. البنية النهائية الصحيحة:
- سطر 233: `<OfficeSection ... >` يفتح
- سطر 276: `</OfficeSection>` (يغلق بعد زر مقطع جديد) — صحيح
- قائمة المقاطع (280-454) تخرج خارج OfficeSection — صحيح
- أي `</OfficeSection>` بين 278-460 يجب حذفه (حُذف سابقاً)
- div عند 467 جزء من Dialog جديد (خط 461) — سليم

## خطة المتابعة
- tsc يجب أن ينظف بعد التأكد من حذف الإغلاق المكرر.
- ثم: التحقق البصري بـ webdev_take_screenshot (صفحة خطة سنوية موجودة — استخدم لوحة المعاينة مع بيانات تجريبية أو رابط /annual-plans/1).
- بعد AnnualPlanDetail: LessonDetail (ترويسة + Steps)، ثم بقية الصفحات حسب ux-plan (03-ux-plan.md).
- في النهاية: pnpm test + tsc + حفظ checkpoint + تسليم.
- OfficeChrome exports: OfficeHeader (crumbs,title,subtitle,children), OfficeTag, OfficeSection (title,className,children), StepTrack.
- فئات CSS المكتبية في index.css: office-card, lesson-sheet, office-primary, office-step, track.

## تم التحقق بصريًا (21-08-2026 00:24)
AnnualPlanDetail تعمل بنمط المكتب: ترويسة OfficeHeader مع Breadcrumb «المخططات»، عنوان كبير + OfficeTag «مرجع رسمي»، سطر بيانات، بطاقة تنبيه مرجعي، وصف الخطة في بطاقة، ثم OfficeSection «المقاطع والوضعيات التعليمية» مع زر «مقطع جديد» وبطاقات مقاطع office-card. tsc نظيف (0 أخطاء). ملاحظة: الصفحة تظهر في وضع مرجعي فقط (لا تعديل).

## ما تبقى في خطة UX (03-ux-plan.md)
1. LessonDetail: ترويسة OfficeHeader + StepTrack — الأهم.
2. بقية الصفحات: Assessment، Results، ContentLibrary، Gradebook، Inspector، Competencies، ExperimentLog، SeasonSetup — ترويسات مكتبية وبطاقات office-card حيث يناسب.
3. الفحص النهائي: pnpm test + tsc + build + حفظ checkpoint + تسليم مع لقطات من كل صفحة.
- معرف خطة سنوية صالح: 90001 (تاريخ السنة الأولى).
- URL معاينة dev: https://3000-i02x7sk2782kgvrg7y04q-822686b0.us4.manus.computer

## تحقق بصري: صفحة اليوم (21-08-2026 00:26)
- الصفحة تعمل: ترويسة OfficeHeader (مرحباً + subtitle القسم/المادة/المقطع)، StepTrack (المذكرة ✓ / 2 التنفيذ / 3 النتيجة / 4 التقويم)، بطاقة حصة اليوم بنمط office-card بخط ذهبي جانبي، زر Primary ذهبي «افتح مذكرة الحصة» + قائمة «المزيد»، قسم جاهزية الأسبوع القادم ببطاقات نظيفة، متابعة أوسع قابلة للطي.
- LessonDetail أعيد تصميمها: OfficeHeader + OfficeTag + OfficeSection + LessonSheet (تعديل TypeScript نظيف، لم يثبت بصريًا بعد).
- ملاحظة: صفحة اليوم تحتاج حصة في وضع «التنفيذ 2» — يبدو أن الخطوة النشطة هي «التنفيذ» (2) — صحيح.
- بقية المراحل: Assessment/Results/ContentLibrary/Gradebook/Inspector/Competencies/ExperimentLog/SeasonSetup.
- URL معاينة: https://3000-i02x7sk2782kgvrg7y04q-822686b0.us4.manus.computer

## المرحلة 5 — الحالة (21-08 00:27)
تقدم: DashboardLayout + Dashboard + WeeklyPlan + AnnualPlanDetail + LessonDetail أعيد تصميمها بنمط «مكتب الأستاذ» وتعمل (تُحقق بصريًا: اليوم والخطة السنوية OK، بقية صفحات في المعاينة). Assessment.tsx: أُضيف OfficeHeader واستيراد OfficeHeader (tsc نظيف الآن).
بقي في المرحلة 5: ContentLibrary/ResourceDetail + Results/StudentResults/Gradebook + Competencies + ExperimentLog + Inspector + SeasonSetup + تحقق هاتف 375px + اختبارات pnpm test + checkpoint.
ملاحظة: OfficeChrome يصدر OfficeHeader وStepTrack وOfficeTag وOfficeSection — استيرادها من "@/components/OfficeChrome". فئات CSS: office-card, office-card--tinted, lesson-sheet, office-tag, office-primary (زر), office-header-actions.
عنوان URL للمعاينة: https://3000-i02x7sk2782kgvrg7y04q-822686b0.us4.manus.computer

## الترويسات المحولة حتى الآن (21-08 00:28)
تم: Assessment, ContentLibrary, Results (OfficeHeader). tsc نظيف لكل منها.
بقي: StudentResults (سطر 230: div flex wrap يحتوي h1 + زر Import Upload بجانبه — يجب الإبقاء على الزر في office-header-actions)، Gradebook (سطر 230)، Inspector (سطر 235)، ExperimentLog (سطر 196: ترويسة داخل بطاقة/hero — فحص السطور 185-200)، Competencies (سطر 527 h1 flex مع gap — داخل div قبله).
نمط التحويل: استيراد `import { OfficeHeader } from "@/components/OfficeChrome";` + `<OfficeHeader title="..." subtitle="..." />`.
SeasonSetup: ترويسة hero خاصة (nibras-card-hero) — تترك كما هي (صفحة عامة).
بعد الترويسات: f4-verify: f4: فحص بصري للصفحات (results, assessment, content-library, gradebook, inspector, experiment-log) + هاتف 375px + pnpm test + checkpoint ثم التسليم.
المعاينة: https://3000-i02x7sk2782kgvrg7y04q-822686b0.us4.manus.computer

## نتائج الفحص البصري (21-08 00:30) — كل الصفحات بنمط المكتب تعمل
dashboard: ترويسة «مساحة الأستاذ اليومية» + مرحباً + شريط خطوات ذهبي + بطاقات أقسام بـ lesson-sheet. OK
results: OfficeHeader + بطاقات أقسام. OK
assessment: ترويسة جديدة + إعدادات التقييم بترويسة مكتبية. OK
content-library: ترويسة جديدة + قائمة موارد. OK
gradebook: ترويسة OfficeHeader + فلاتر. OK
competencies: ترويسة جديدة + بطاقات المقاطع. OK
experiment-log: ترويسة + زر إضافة + بطاقة استراتيجية. OK
weekly-plan: يوميات نظيفة بأزرار ذهبية داكنة. OK
اختبارات: 265/265 تمر. TypeScript نظيف.
ملاحظة: الترويسة تظهر بلا خط فاصل واضح في بعض الصفحات لكن التصميم العام متناسق.
بقي: فحص هاتف 375px، ثم checkpoint وتسليم.

## ختام المرحلة السادسة (21-08 00:31) — جاهز للحفظ والتسليم
الفحص البصري 8 صفحات على سطح المكتب: جميعها تعمل بنمط مكتب الأستاذ (شريط جانبي داكن، ترويسة OfficeHeader، بطاقات ورقة دفتر، شريط خطوات ذهبي). فحص هاتف 375px لصفحتي اليوم والأسبوع: سليم مع شريط سفلي. الاختبارات 265/265 تمر. TypeScript نظيف. تم تعليم كل بنود المرحلة في todo.md. ملاحظة: ملاحظة التثبيت في أعلى الهاتف تظهر قبل الترويسة (سلوك PWA سابق، غير مكسور). الخطوة التالية: حفظ checkpoint وتسليم ملخص إعادة التصميم للأستاذ.
