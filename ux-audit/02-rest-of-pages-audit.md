# تدقيق UX — بقية الصفحات

## LessonDetail (/lessons/:id) — مذكرة الحصة (384 سطر)
- ترويسة (lesson-workspace-header): زر رجوع «كل المذكرات»، شارة «مذكرة الحصة»، عنوان، صف meta، شريط إجراءات مزدحم: تم الإنجاز/في انتظار التنفيذ، العرض الصفي، معاينة الورقة، A4PrintButton، تنزيل PDF، نسخ صوتية.
- A4PrintContent + PrintPreviewDialog (محتوى مكرر مرتين).
- Card «إطار بناء المذكرة»: اختيار قالب تدريس (TEACHING_TEMPLATES) + زر توليد.
- بقية الملف: حقول تعديل (title/subject/gradeLevel/unit/content/plan/objectives/duration/notes) + ملاحظات تربوية + بطاقات جاهزية.
- الاحتكاك: لا يوجد تسلسل: «توليد ← تعديل ← معاينة ← طباعة ← تنفيذ». الأزرار متساوية بلا هرمية. «تم الإنجاز» في الأعلى بينما المنطق الصحيح «بعد التنفيذ».

## AnnualPlanDetail (/annual-plans/:id) — الخطة (698 سطر)
- مقاطع قابلة للطي، وضعيات داخلها، Dialogs: إضافة قسم، إضافة وضعية، «سجّل نتيجة الحصة» (4 حالات مثل Dashboard)، «استراتيجية تسيير» (strategySituationId منفصل) + حفظها لدفتر التجارب.
- createLessonFromSituation → ينتقل لـ /lessons/:id.
- الاحتكاك: لا يظهر «حزمة الحصة» من الوضعية مباشرة (مذكرة+بطاقة+ورقة عمل+تقويم معاً). الاستراتيجية Dialog ثانوية.

## ContentLibrary (/content-library) (425 سطر)
- بحث + فلتر نوع + قائمة بطاقات موارد مع tags، أزرار نسخ/حذف في «المزيد».
- الاحتكاك: عرض «أرشيف» جاف بلا سياق درس/قسم؛ لا ربط للمورد بوضعيته بصرياً في القائمة.

## الصفحات الأخرى (حجم)
- Results 495، Gradebook 705، StudentResults 754، Inspector 362، Competencies 851، ExperimentLog 628، Assessment 948، LessonGenerator 563، SeasonSetup 569، WeeklyPlan 196، AnnualPlans 215، Classes 205، Curriculum 223، Lessons 218.

## ملاحظات نظامية
- فئات nibras-* موجودة في index.css (بطاقات/ترويسات/مسارات) + ألوان brand-ink/wax/copper في tokens.
- shared/quick-click.ts: buildQuickLessonPath, buildQuickAssessmentPath, buildQuickIntegrativeSituationPath, findReadyLessonPlan, getScheduledSlotForNow.
- shared/teachingTemplates.ts: TEACHING_TEMPLATES (قوالب التدريس).
- A4Print.tsx، PrintPreviewDialog.tsx، MarkdownRenderer.tsx: مكونات وثائق مشتركة.

## قرار التصميم العام
- فلسفة «مكتب الأستاذ»: الصفحة الرئيسية = جواب فوري + مسار خطوة بخطوة للحصة (حضّر → حزمة → نفذ → قوّم → حلّل).
- نظام تصميم: طباعة قوية + فراغ + تسلسل رأسي واحد، بلا بطاقات SaaS متكدسة؛ استخدام خط عربي كبير وواضح، ألوان هادئة (ink/wax/ورق فاتح)، مسافات سخية.
- التنقل الجديد: اليوم، الأسبوع، المخططات، التقويم، النتائج، المكتبة، دفتر التجارب (توحيد من صفحة DashboardLayout).

## خلاصة index.css (773 سطر)

النظام الحالي يعتمد: ثلاث عائلات ألوان brand-ink (بنفسجي داكن، primary) وbrand-copper (نحاسي/برتقالي) وbrand-wax (ذهبي) وbrand-sand (خلفية رملية فاتحة). الخلفية `--brand-sand-100` والأمامي `--brand-ink-900`. الفونتا: Cairo للنص وNoto Naskh Arabic للوثائق. توجد فئات nibras- كثيرة (ترويسات، بطاقات، مسارات حصص، شريط هوية، وسوم مواد، مكتبة، هاتف mobile-nav).

## قرار إعادة التصميم (مبدأ «مكتب الأستاذ»)

بدل إعادة كتابة كل شيء، سأبقي tokens والألوان لكن أعيد الهيكلة:
1. index.css: إضافة نظام طباعة جديد «nibras-office» (مسافات سخية، حدود رفيعة، أرقام خطوات دائرية، بطاقات بلا ظلال متكدسة، خط أكبر 15-16px للنصوص الرئيسية) + تقليل كثافة الـ nibras-glow والتوهج.
2. توحيد ترويسات الصفحات بمكوّن OfficeHeader (breadcrumb من مستوى→قسم→مقطع + عنوان كبير + إجراء رئيسي واحد).
3. Dashboard: جواب فوري + مسار خطوات مرقّم (حضّر → حزمة → نفّذ → قوّم) بدل 3 بطاقات متكدسة.
4. صفحات داخلية: OfficeCard بحدود رفيعة 1px وبلا ظلال، مسافات 24-32px.
