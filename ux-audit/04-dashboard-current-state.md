# حالة Dashboard.tsx الحالية (1190 سطر) — مرجع التنفيذ

## ما تملكه الصفحة
- استعلامات: classes, profile, activeYears, aiResources, weeklyReadiness, annualPlans, weeklySchedule, situations.listPending, ai.getTeacherOSContext, compensatorySessions.
- منطق: academicYear/fallbackYear الحصانة، selectedClassId (usePreferredClass)، activeClassId = scheduledSlot || preferred || first.
- teacherOSContext: currentSection, nextSituation (dailySituation), completedSituations, currentSectionProgress.
- findReadyLessonPlan(resources, activeClassId, dailySituation.id) → مورد جاهز.
- جلسة ختامية: completeSessionMutation + reschedule (compensatorySessions) + strategyQuery (suggestStrategy) + strategyPrintHtml (PDF HTML كامل).

## البنية المرئية الحالية
1. Hero nibras-orientation-hero + nibras-card-hero (شعار + ترحيب + سنة + شريط مسار 4 مراحل).
2. بطاقة «مسار حصتك الآن» (خلفية داكنة gradient): اختيار القسم + عنوان الوضعية + شارة المقطع + زر رئيسي (افتح/حضّر المذكرة) + Dropdown «المزيد» (سجّل نتيجة، أنشئ نشاط/مورد، وضعية إدماجية، تقويم، سجل النتائج) + guidance box (قيد الاستكمال/مؤجلة/ملغاة).
3. فروع: needsScheduleSetup → زر إعداد الجدول، classesLoadedEmpty → تهيئة الموسم، fallback → رسالة انتظار.
4. بقية الصفحة: إحصاءات، قائمة المذكرات المعلقة، الأسبوع القادم، مكتبة الموارد.

## قرار إعادة التصميم
- الحفاظ الكامل على المنطق والاستعلامات؛ تغيير JSX/CSS فقط.
- تحويل «مسار حصتك الآن» إلى بطاقة ورقة دافئة (بدل داكن) مع رقم خطوة دائري كبير، زر ذهبي واحد رئيسي، والمزيد ثانوي.
- Hero أبسط: سطر ترحيب + Breadcrumb تربوي (قسم/مقطع/وضعية) + سؤال اليوم.
- خطوات مرقّمة صريحة: 1 المذكرة 2 الحزمة 3 التنفيذ 4 التقويم.

## أصول مشتركة متوفرة
- Breadcrumb shadcn موجود (components/ui/breadcrumb.tsx) غير مستخدم في الصفحات.
- PwaInstallPrompt يُعرض داخل main.
- النافذة: App.tsx يلفّ كل صفحة مصادق بها بـ DashboardLayout بشكل متكرر.
