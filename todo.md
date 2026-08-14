# Nibras MVP - TODO

## Core Infrastructure
- [x] Design and create database schema with all tables
- [x] Generate migrations and apply to database
- [x] Build backend API routes for all features
- [x] Configure RTL Arabic-first styling with Cairo font
- [x] Build DashboardLayout adapted for RTL with Arabic navigation

## Teacher Profile & Workspace
- [x] Teacher profile with name, subject, and academic year
- [x] Academic year selection (العام الدراسي)
- [x] Subject configuration (الدراسات الاجتماعية)

## Curriculum Knowledge Base
- [x] Database tables for curriculum documents
- [x] API routes for CRUD on curriculum documents
- [x] Curriculum document list and search with citations
- [x] Fast keyword search across documents

## Teacher OS
- [x] Classes management (create, edit, list classes)
- [x] Annual plans builder
- [x] Lessons management (create, edit, track completion)
- [x] Teaching notes recording
- [x] Lesson completion tracking

## Lesson Generator (AI)
- [x] AI-powered lesson plan generation
- [x] Active learning activities generation
- [x] Homework generation
- [x] Classroom questions generation
- [x] Differentiation strategies generation
- [x] Enhanced differentiation options in Lesson Generator (student-level controls)
- [x] RAG-based curriculum alignment for all generations

## Assessment Studio
- [x] Quiz generation
- [x] Exam generation
- [x] Rubric generation
- [x] Answer key generation
- [x] A4 printable document export

## Content Library
- [x] Store all generated resources
- [x] Edit existing resources
- [x] Duplicate resources
- [x] Reuse resources across lessons

## Inspector Mode
- [x] Lesson review with AI evaluation
- [x] Curriculum alignment check
- [x] Learning objectives evaluation
- [x] Assessment quality review
- [x] Bloom's taxonomy assessment
- [x] Active learning integration evaluation

## UI Polish
- [x] Responsive design for mobile and desktop
- [x] Arabic typography with Noto Naskh Arabic
- [x] Modern clean design with proper RTL support
- [x] Loading states and error handling
- [x] Empty states for all pages

## National Assessment Rules Engine
- [x] Design and create National Rules Engine module (server/rules/nationalRules.ts)
- [x] Store official assessment rules in centralized engine (point distribution, duration, structure)
- [x] Year 1: History 10pts + Geography 10pts
- [x] Year 2: History 10pts + Geography 10pts
- [x] Year 3: History 10pts + Geography 10pts
- [x] Year 4: History 13pts + Geography 7pts
- [x] Civic Education: independent exam, 20pts, 1 hour
- [x] History & Geography: combined exam, 1.5 hours
- [x] Rules updateable from single location without code changes
- [x] Integrate Teacher OS data flow: annual plan → sections → completed lessons → competencies → assessment
- [x] Auto-import completed lessons/competencies when creating assessment
- [x] Auto-determine covered competencies from completed lessons
- [x] Auto-apply point distribution based on national rules
- [x] Auto-suggest exam structure based on level and subject
- [x] Link each question to its competency being assessed
- [x] Updated Assessment Studio UI with Teacher OS integration
- [x] Assessment creation flow: choose level → select completed sections → auto-generate
- [x] Update vitest tests for new assessment engine

## Curriculum Knowledge Base in Assessment (RAG)
- [x] Enable curriculum search in generateAssessment (retrieve relevant docs by topic/grade/subject)
- [x] Inject curriculum document excerpts into assessment generation prompt
- [x] Require AI to cite document source for each question (doc title, unit, section)
- [x] Return citations in API response alongside generated content
- [x] Display curriculum citations per question in Assessment UI
- [x] Show citation badges/links in printable A4 output
- [x] Add tests for curriculum retrieval in assessment generation

## Testing & Quality
- [x] Vitest tests for backend procedures
- [x] End-to-end verification of all features
- [x] Enhanced Lesson Generator differentiation UI with ability levels

## Pedagogical Loop Closure (Pilot)
- [x] New table: annualPlanSections (structured: section number, title, competencies, resources)
- [x] New table: learningSituations (linked to sections: title, objectives, resources)
- [x] New table: assessmentResults (aggregate per-class: total students, passed, averages by domain)
- [x] Migrate and apply schema
- [x] Backend: CRUD for sections and situations
- [x] Backend: Teacher OS context returns current section + next situation
- [x] Backend: aggregate results analysis (mastery rates, weak domains)
- [x] Backend: remediation/suggestions based on weak domains
- [x] Backend: fix Lesson Generator to actually use curriculum RAG (call getCurriculumForTopic)
- [x] Backend: Inspector detects real pedagogical errors (missing objectives, wrong Bloom, missing assessment)
- [x] Seed real Algerian curriculum corpus (4 levels, 2 subjects) with metadata
- [x] Frontend: structured annual plan builder (sections + situations)
- [x] Frontend: Teacher OS progress view (current section, next situation, done/not done)
- [x] Frontend: results entry form (aggregate per-class)
- [x] Frontend: analysis view (mastery rates, weak domains, remediation suggestions)
- [x] Frontend: A4 print for any resource/memo
- [x] Tests for full scenario
- [x] Backend: link assessment generation to completed situations from Teacher OS
- [x] Backend: respect social studies rules (10+10 / 13+7 / 20 civic)
- [x] Frontend: Assessment auto-imports completed situations + covered competencies
- [x] Backend: create lesson from situation button (link to section, situation, competencies)
- [x] Frontend: "أنشئ مذكرة" button inside each situation in AnnualPlanDetail
- [x] Tests: add tests for new assessment-situation link and lesson-from-situation
- [x] Full scenario E2E test: class → plan → section → situation → lesson → assessment → results → analysis

## 2022 Official Curriculum Data Integration
- [x] Extract text from all 12 official 2022 annual plan PDFs (4 levels x 3 subjects)
- [x] Parse structured data: sections, situations, competencies, objectives
- [x] Seed curriculumDocuments with official 2022 annual plans (annualPlan type)
- [x] Create official annual plans in annualPlans table for each level/subject combination (12 plans)
- [x] Create annualPlanSections with official competencies and objectives
- [x] Create learningSituations with official learning situations from the plans
- [x] Add competency tracking to learningSituations — competencies stored on annualPlanSections (28/36 sections) with objectives (28/36); situations carry objectives (88/89). No dedicated field needed; UI already renders competencies per section.
- [x] Curriculum page Select crash fix (version 830faeed)
- [x] Verify data appears correctly in Teacher OS (verified via DB joins: 12 plans, 36 sections, 89 situations across all level/subject combos)
- [x] Verify data appears correctly in Assessment Studio (verified via DB; UI verified in preview screenshot showing all plans)
- [x] Run all tests after seeding

## Curriculum Parser Quality Improvements (backlog — deliberately deferred per validation-only directive; 8/8 items in PDFs fully covered would require re-scanning missing chapter pages in source PDFs)
- [x] Clean up section titles (done: lam-lam bug + truncated أن + ligature artifacts all repaired, checkpoint 44dfb82f)
- [x] Extract and seed official section objectives into annualPlanSections — 28/36 sections have official objectives extracted from PDFs
- [x] Improve situation title extraction quality — all 89 situation titles cleaned; 88/89 carry official objectives
- [x] Verify data appears correctly in Teacher OS UI and Assessment Studio UI — verified via DB joins and preview screenshots
- [x] Fix parser extraction gaps: Geo 2AM Ch3 (+2 situations), Geo 4AM Ch3 (+3 situations) backfilled from re-extracted PDF text (94 situations total); History 4AM Ch2/Ch3 and Geo 1AM Ch1 are genuinely not detailed in their source PDFs (chapter-level tables only, no situation rows) — no invented data
- [x] Re-seed learningSituations after parser fixes — backfilled 5 missing situations and verified; geography plans corrected to subject 'الجغرافيا' with official titles and objectives; national rules engine extended with 4 geo rules (10/10/10/7); curriculumDocuments kept under the official combined school subject 'التاريخ والجغرافيا'

## Final Data Integrity Fix (session: plan/subject reconciliation)
- [x] Audit all 12 plans' sections and situation counts; map the جغرافيا 3AM section/situation misplacement
- [x] Move إفريقيا sits (90069-90071) to 'السكان والتنمية' and أوروبا sits (90072-90074) to 'السكان والبيئة' in جغرافيا 3AM plan; retitled section to official 'المجال الجغرافي'
- [x] Corrected مخطط 90002 subject to 'التاريخ' (it holds official تاريخ 3AM content) — 1AM/2AM/4AM plans keep official 'التاريخ والجغرافيا' subject
- [x] Regenerated structured.json from the live DB (12 plans, 36 sections, 91 situations, 114 documents) for full reproducibility
- [x] Updated curriculum-seed tests for the subject split and 91-situation count; 48/48 tests passing
- [x] Removed one-time fix scripts; kept seed_curriculum + dump_structured as the canonical reproducible pipeline

## مراجعة التدرجات السنوية للتاريخ والجغرافيا
- [x] حصر ملفات التدرجات السنوية المرفوعة وتحديد المستويات والسنوات التي تغطيها
- [x] استخراج عناوين الوضعيات التعليمية-التعلمية والمقاطع ومدد الحصص من المصادر المرفوعة
- [x] مطابقة التدرجات مع بيانات المنهاج الحالية وتوثيق الفروقات دون إدماجها قبل الاعتماد

## توحيد أسماء المقاطع المرجعية
- [x] اعتماد تسميات المقاطع الموحدة التي قدّمها الأستاذ للتاريخ والجغرافيا والتربية المدنية
- [x] إعادة تدقيق أسماء المقاطع الحالية مقابل المرجع الموحد وتحديث تقرير الفروقات

## تصحيح إسناد وضعيات الرابعة متوسط
- [x] تدقيق خريطة وضعيات التاريخ والجغرافيا الحالية مقابل التدرجات السنوية المعتمدة
- [x] إعادة إسناد وضعيات الجغرافيا إلى المجال الجغرافي والسكان والتنمية والسكان والبيئة
- [x] توحيد أسماء مقاطع التاريخ وتأكيد أن مصدر 2022 الحالي لا يحتوي وضعيات تاريخ للرابعة متوسط
- [x] مزامنة مصدر التهيئة وتشغيل اختبارات سلامة البيانات بعد التصحيح

## مراجعة نموذج المذكرات
- [x] فحص نطاق نموذج المذكرات المرفوع وبنيته ومقروئية محتواه
- [x] استخراج عناوين الوضعيات وبنية المذكرة بوصفها بيانات تحقق مساندة
- [x] مطابقة العناوين مع المخططات السنوية الرسمية دون إدماج أي تغيير

## مراجعة ملفات المقاطع التعليمية
- [x] فحص ملفات المقاطع الأول والثاني والثالث للمستويات الأربعة
- [x] استخراج عناوين الوضعيات والمركبات مع إسنادها إلى المستوى والمادة
- [x] مطابقة الاستخراج مع المخططات السنوية والتدرجات الرسمية وتوثيق الفروقات دون دمج

## جدول توزيع حصص تاريخ الرابعة متوسط
- [x] تحديد أسطر وصفحات التاريخ للسنة الرابعة متوسط في التدرج السنوي الرسمي
- [x] استخراج الوضعيات وتسلسل الحصص والمدد الزمنية في جدول قابل للمراجعة
- [x] مراجعة الجدول وإبراز أي مدة أو عنوان غير مقروء قبل تسليمه

## تدرج سنوي مقترح 2026–2027
- [x] تحديد المواد والمستويات المراد جدولتها وحصر ساعات المقاطع الرسمية المتاحة
- [x] حساب أسابيع التدريس من بداية أكتوبر وتوزيع حصص المقاطع دون افتراض عطل غير منشورة
- [x] إعداد تدرج سنوي أولي يبيّن الفترات التي تتطلب رزنامة مدرسية رسمية

## نطاق المسودة المعتمدة
- [x] إعداد مسودة تشغيلية لجميع مواد الاجتماعيات والمستويات الأربعة تبدأ في أكتوبر 2026
- [x] ترك أسابيع العطل والاختبارات خانات معلّقة قابلة للتعبئة من الرزنامة الرسمية لاحقاً
- [x] تصحيح أسماء المقاطع الخمسة المتبقية في قاعدة المنهاج ومصدر التهيئة وفق المرجع الموحد
- [x] التحقق المصدرّي من مدد المقاطع الرسمية قبل اعتمادها في مسودة 2026–2027

## مراجعة المستودع الرسمي
- [x] فحص المستودع الرسمي Dzogx/Nibras_dz ومقارنته بالنسخة الحالية دون دمج أو تعديل
- [x] فحص المستودع الخاص Dzogx/Nibras ومقارنته بالنسخة الحالية دون دمج أو تعديل

## المستوى أ: سد الوضعيات الناقصة من البرنامج السنوي الرسمي (بموافقة الأستاذ)
- [x] سد وضعيات مدنية 1AM الناقصة (الحياة الجماعية: التنوع الثقافي)
- [x] سد وضعيات تاريخ 2AM الناقصة (التاريخ الوطني: انعكاسات تراجع السيادة الإسلامية على الأندلس)
- [x] سد وضعيات جغرافيا 2AM الناقصة (المجال الجغرافي: نظام المطر في آسيا الموسمية)
- [x] إعادة إسناد مدنية 2AM: نقل وسائل الإعلام وشبكات التواصل إلى الحياة المدنية، وإسناد المجالس المنتخبة والانتخابات ومهامها إلى الحياة الديمقراطية
- [x] إعادة تنظيم تاريخ 3AM: التاريخ الوطني 6 مختلطة + التاريخ العام فارغ → توزيع 3/3 وفق البرنامج
- [x] سد وضعيات مدنية 3AM الناقصة (المدنية: المساهمة في بناء حياة المجتمع؛ الديمقراطية: دور ومهام اليونسيف واليونسكو، الجزائر واليونسيف واليونسكو)
- [x] إدراج وضعيات تاريخ 4AM التسع من البرنامج السنوي (3 مقاطع × 3)
- [x] حفظ وضعيات الإدماج الكلية (36 وضعية) في مقاطعها الصحيحة عبر الخطط الاثنتي عشرة
- [x] تحديث structured.json واختبارات سلامة المنهاج بعد الإدراج (147 وضعية)
- [x] تشغيل كامل الاختبارات بدون فشلات قبل التسليم
- [x] استكمال وضعيات مدنية 2AM: إدراج الانتخابات ومهام المجالس المنتخبة في الحياة الديمقراطية، والتحقق النهائي من التوزيع في المقاطع الثلاثة

## إصلاحات تشخيص 12 أغسطس (ما تبين ناقصاً/مشوهاً بعد مطابقة شاملة)
- [x] حذف الوضعيات المنحلة: الانتخابات ومهام المجالس (منحلة في جغرافيا 2AM مقطع 1)، خصائص السكان والتنمية في أوروبا (منحلة في جغرافيا 2AM مقطع 1)، الوضعيات العثمانية الثلاث (منحلة في تاريخ 2AM مقطع 2)، حقوق المواطن/الانتخاب/مؤسسات الجمهورية (منحلة في مدنية 3AM)، الوضعيات المعاصرة الثلاث (منحلة في تاريخ 3AM مقطع 3)
- [x] إدراج الوضعيات الرسمية الناقصة: انعكاسات الأندلس (تاريخ 2AM مقطع 2)، نظام المطر الموسمي (جغرافيا 2AM مقطع 1)، حرية التعبير واحترام الحياة الخاصة (مدنية 2AM مقطع 2)، المساهمة في بناء حياة المجتمع (مدنية 3AM مقطع 2)، دور ومهام اليونسيف واليونسكو + الجزائر معهما (مدنية 3AM مقطع 3)
- [x] إعادة ترقيم الوضعيات في كل المقاطع: العادية 1/2/3 والإدماج الكلي 4 (تاريخ 1AM، مدنية 1AM/2AM/3AM/4AM، تاريخ 4AM، تاريخ وجغرافيا 2AM/3AM مقاطعها المتأثرة)
- [x] مزامنة structured.json وتحديث اختبارات السلامة وتشغيل كل الاختبارات وفحص TypeScript

## إصلاح بلاغ «Teacher OS لا يعمل» (12 أغسطس)
- [x] تشخيص سبب currentSection=null: ربط classId في 12 خطة سنوية (SQL) في getTeacherOSContext رغم وجود خطط وأقسام
- [x] خطأ Select.Item فارغة لا يؤثر على التشغيل الفعلي (الفلترة تعتمد على classId)
- [x] إضافة اختبار «maps an annual plan to the class via classId» (57/57 ناجح) وفحص الأقسام
- [x] التحقق البصري: لوحة التحكم تعرض الآن المقطع الحالي والوضعية التالية

## مزامنة GitHub مع المستودع الرسمي Dzogx/Nibras_dz (12 أغسطس)
- [x] فحص حالة المستودع الرسمي وفرعه الرئيسي
- [x] تصدير كود المشروع ودفعه إلى المستودع الرسمي (12 commit، 7dc96ea9→27cb30f)
- [x] التحقق من نجاح المزامنة وإبلاغ الأستاذ

## محاكاة مسار الدرس المعلق (12 أغسطس)
- [x] فحص الدرس المعلق وبياناته في قاعدة البيانات
- [x] محاكاة فتح المذكرة وتعديلها في قسم المنجزات
- [x] محاكاة تأكيد تنفيذ الوضعية في Teacher OS
- [x] محاكاة إنشاء التقويم من الوضعيات المنجزة في Assessment Studio
- [x] محاكاة إدخال النتائج المجمعة والتحليل والعلاج والإثراء
- [x] إصلاح العناوين المقطوعة الـ12 في الوضعيات (أعدت بناءها بصيغها الرسمية من PDF مخططات 2022) وتنظيف ligature في الأهداف (نحو 110 وضعية) وإصلاح العناوين المشوهة
- [x] حفظ نقطة تفتيش وتسليم تقرير المحاكاة

## مكتبة قوالب التدريس للمذكرات
- [x] تحديد قوالب تدريس تربوية ثابتة ومتوافقة مع توليد المذكرات
- [x] عرض القوالب في واجهة إنشاء المذكرة من الوضعية التعليمية
- [x] تمرير القالب المختار إلى مولد المذكرة مع الحفاظ على الوضعية والكفاءة الرسمية
- [x] حفظ اسم القالب في بيانات المذكرة لإعادة الاستخدام والتتبع
- [x] إضافة اختبارات لقالب المذكرة والتحقق البصري لمسار الاختيار

## إصلاح خطأ توليد المذكرة: Cannot read properties of undefined (reading '0')
- [x] تشخيص الاستجابة أو المسار الذي يحاول قراءة عنصر غير موجود
- [x] معالجة الاستجابة غير المكتملة برسالة عربية مفهومة دون انهيار الواجهة
- [x] إضافة اختبار انحدار وتشغيل التحقق الكامل قبل الحفظ

## تعميم التحقق الآمن على مولّدات البطاقات والتقويمات (12 أغسطس)
- [x] حصر كل قراءات choices غير المحمية في إجراءات الذكاء الاصطناعي (بطاقات/تقويم/تقارير)
- [x] حماية مولّد البطاقات من الاستجابة الناقصة مع رسالة عربية واضحة
- [x] حماية مولّد التقويم والتقارير من الاستجابة الناقصة مع رسالة عربية واضحة
- [x] إضافة اختبارات انحدار لمسار البطاقات والمسار الآخر على الأقل
- [x] تشغيل كامل الاختبارات وفحص TypeScript وحفظ نقطة تفتيش

## قواعد دليل بناء الاختبارات 2018 (مرحلة ما بعد RC)
- [x] إضافة مواصفات بنية الأسئلة الرسمية (QuestionBlueprint): 3-4 وضعيات للتاريخ (9+4) و2-3 للجغرافيا (4+3) في 4AM
- [x] تضمين معايير شبكة التقويم الرسمية (الإتقان/التمايز/تنظيم الورقة/اللغة/الخط/الفصل/علامات الوقف) في سياق التوليد
- [x] إلزام تدرج Bloom في تعليمات التوليد كشرط صريح
- [x] إضافة شروط صياغة الأسئلة من الدليل (6 شروط) في سياق التوليد
- [x] اختبار سلامة يتحقق من بنية الأسئلة لجميع المستويات (10+10، 13+7، 20) — 66/66 اختبار
- [x] تشغيل جميع الاختبارات الحالية والتأكد من نجاحها (66/66)
- [x] مزامنة GitHub مع المستودع الرسمي Dzogx/Nibras_dz (27cb30f..8696b86)

## دمج دليل بناء اختبارات التربية المدنية 2018
- [x] استخراج قواعد دليل التربية المدنية الرسمي (جزءان: 12 نقطة + 8 نقاط، ساعة واحدة، المعامل 1)
- [x] تحديث قاعدة التربية المدنية في محرك القواعد الوطني وفق البنية الرسمية
- [x] تمرير شروط الدليل الخاصة في سياق التوليد (بنية الأسئلة الرسمية تشمل 12+8 والتعليمة والسندات وشبكة التقويم، والمعايير الرسمية مضمّنة)
- [x] إضافة اختبارات سلامة للقاعدة المحدثة (67/67 اختبار)
- [x] تشغيل الاختبارات ومزامنة GitHub (8696b86..7f7f411)

## جدول تصنيف أفعال بلوم لمادة الاجتماعيات (بلزقوق)
- [x] استخراج الأفعال الستة من صورة الجدول (المعرفة/الفهم/التطبيق/التحليل/التركيب/التقييم)
- [x] إضافة BLOOM_ARABIC_VERBS إلى محرك القواعد الوطني مع وصف سلوك كل مستوى
- [x] تحديث تسميات BLOOM_LEVELS للتسميات الرسمية وتحقن الأفعال في تعليمات توليد التقويم
- [x] اختبارات سلامة جديدة ومزامنة GitHub (69/69 اختبار، 7f7f411..4ad9fb6)

## نموذج اختبار تجريبي للتربية المدنية 4AM (دمج بلوم + دليل 2018)
- [x] توليد اختبار تجريبي عبر مسار التوليد الفعلي (v4 تم تسليمها للأستاذ) (الذكاء الاصطناعي) مع بنية 12+8 وأفعال بلوم
- [x] التحقق من مطابقة الناتج للقواعد
- [x] تسليم الوثيقة النهائية بصيغة عربية RTL (Markdown + PDF)

## تصحيح بنية نموذج الاختبار التجريبي (ملاحظة الأستاذ)

- [x] تعديل تعليمات التوليد: الجزء الأول 3 وضعيات بسيطة منفصلة (4 نقاط لكل وضعية) بدل 6 أسئلة قصيرة
- [x] توليد نسخة مصححة والتحقق من مطابقة الدليل (3 وضعيات + إدماجية واحدة)
- [x] تسليم النسختين Markdown وPDF

## تصحيح النسخة v2 (ملاحظة الأستاذ الثانية: بلا سياق + تدرج + نسبة 60/40)

- [x] تحديث تعليمات التوليد: الوضعيات البسيطة بدون سياق، تدرج سهل-صعب، نسبة 60% دنيا / 40% عليا من بلوم
- [x] إعادة توليد النموذج والتحقق من الضوابط الثلاثة (v3)
- [x] تسليم Markdown وPDF محدثين (v3)

## ملاحظة الأستاذ: عدم كتابة الكفاءة المستهدفة في ورقة الاختبار

- [x] تحديث تعليمات التوليد: الكفاءة المستهدفة في مفتاح التصحيح فقط
- [x] إعادة توليد v4 والتحقق من غياب «الكفاءة المستهدفة» من ورقة الاختبار
- [x] تسليم Markdown وPDF (v4)

## تحليل مكتبة تقويمات DzExams (مصدر دراسة أنماط فقط — لا نسخ محتوى)

- [x] استكشاف صفحات DzExams وتوثيق بنية المكتبة (library_structure.md) (تاريخ/جغرافيا وتربية مدنية) وتوثيق بنية المكتبة
- [x] تحليل عينات التقويمات (pattern_findings.md: BEM 2023-2025 HG+مدنية)
- [x] التقرير التحليلي (analysis_report.md)
- [x] تحسين Assessment Studio (أنماط الوضعيات البسيطة والسندات والشبكة الرباعية في nationalRules) (إثراء سياق التوليد وأنماط الأسئلة)
- [x] تحسين Inspector (قواعد الأنماط الرسمية في reviewAssessment)
- [x] اختبارات 76/76 + مزامنة GitHub (113f87fd)


## إصلاح ظهور الأصفار في لوحة التحكم (حساب kamikazk7@gmail.com)
- [x] تشخيص: الحساب سليم (userId=1) والبيانات سليمة — السبب غياب صف profile
- [x] تشخيص: الأقسام والخطط سليمة ومرتبطة بـ userId=1
- [x] تشخيص: getTeacherOSContext كان يسقط بسبب غياب profile
- [x] إصلاح: profile.get ينشئ الملف الشخصي تلقائياً عند أول دخول
- [x] اختبار الإصلاح وتشغيل جميع الاختبارات (76/76)
- [x] تعليم todo والمزامنة مع GitHub (4ad9fb6→113f87f)

## ملاحظة الأستاذ: تسمية "الفصول" و"الوحدات"
- [x] تغيير تسمية "الفصول" إلى "الأقسام" في لوحة التحكم وكامل الواجهة (Classes = أقسام دراسية)
- [x] إزالة "الوحدات" من إدراج إنجاز الوضعية إن كانت تظهر في واجهة الإنجاز

## ملاحظة الأستاذ: إزالة مفهوم "الوحدة" نهائياً
- [x] إزالة حقول الوحدة (عنوان الوحدة/رقم الوحدة) من مولّد الدروس
- [x] إزالة عرض الوحدة من الاستشهادات بالمراجع في التقويمات والمكتبة
- [x] تحديث الواجهة لقالب التكوين: مقاطع → كفاءات وموارد ووضعيات تعليمية/إدماجية (لا وحدات)
- [x] فحص استخدامات unitNumber في الخلفية وضبطها لتبقى متوافقة

## إصلاح النصوص العربية المشوهة في صفحة الخطة السنوية (13 أغسطس — بلاغ الأستاذ)
- [x] تشخيص: حقل «المحتوى» لخطة جغرافيا 4AM يظهر مبتوراً (يبدأ بـ«يف هناية...») ومشبهاً («امتولس» بدل «المتعلم»)
- [x] تشخيص: عنوان الخطة مقطوع «المخطط السنوي 2022/2023 - الجغرافيا - ا» — تبيّن أنه من ligature في نص المحتوى نفسه وليس قصّ واجهة؛ العنوان الصحيح موجود
- [x] فحص شامل لكل النصوص الافتتاحية في structured.json وقاعدة البيانات (الخطط الـ12 والمقاطع الـ36 والوضعيات)
- [x] إصلاح النصوص المتأثرة من المصدر الرسمي PDF للمخططات 2022: الكفاءات الشاملة للخطط الـ12، الكفاءات الختامية للمقاطع الـ36، ligature في أهداف الوضعيات (نحو 15 وضعية)، وإعادة بناء 90056 و90079 بنصوص نظيفة
- [x] فحص الواجهة: عرض المحتوى سليم (Streamdown بلا قص)؛ عدّاد «0/4 وضعية» طبيعي (منجزة/إجمالي) — لا خلل
- [x] اختبارات 76/76 وTypeScript نظيف ومزامنة GitHub

## تلقين الأستاذ التربوي (13 أغسطس — المبدأ الأعلى وهيكل الحصة)
- [x] إضافة سلسلة البناء التربوي الملزمة وعناصر الحصة الـ15 (LESSON_SESSION_ELEMENTS) وبند النشاط النشط التسعة (ACTIVE_ACTIVITY_SPEC) وقيود الواقع الصفي (CLASSROOM_CONSTRAINTS) وقاعدة دور AI (AI_ROLE_PRINCIPLE) إلى محرك القواعد الوطني — كلها تُحقن عبر getLessonSessionContext
- [x] إضافة قائمة استراتيجيات التعلم النشط الـ12 المعتمدة (ACTIVE_LEARNING_STRATEGIES) إلى المحرك
- [x] تحديث prompt مولد المذكرة lessonPlan ليلزم عناصر الحصة الـ15 صراحة
- [x] تحديث prompt activity ليلزم بنية النشاط النشط التسعة والقائمة الـ12
- [x] تعزيز Inspector: معيار اكتمال العناصر الـ15 في reviewLesson
- [x] إضافة زر «حضّر الحصة» في لوحة Teacher OS يقترح الوضعية التالية ويفتح مولد المذكرات بها (situationId في URL + تعبئة تلقائية + شريط سياق)
- [x] التحقق من عدم ظهور مصطلحات تقنية في الواجهة (لا شيء في pages)
- [x] تشغيل جميع الاختبارات وحفظ نقطة تفتيش ومزامنة GitHub

## الدفعة الثالثة: إنتاجية (14 أغسطس — اختار الأستاذ: سندات + دفتر متابعة + طباعة احترافية)
- [x] إضافة مواصفات السندات المولّدة إلى محرك القواعد الوطني (DOCUMENT_GENERATION_SPEC: جداول إحصائية ببيانات صحيحة، نصوص دستورية/قانونية رسمية، أوصاف خرائط معطيات جغرافية) لكل مادة مع قواعد العدد (2–3 لـ4AM/BEM، سند واحد لـ1–3AM والتربية المدنية) — مدمجة داخل مخططات الأسئلة لكل مادة فرعية
- [x] تعليمات التوليد تُلزم السندات الوظيفية المرتبطة بالتعليمة في الوضعيات الإدماجية (يُحقن عبر buildAssessmentContext: ترقيم وعنوان موحدين وتعليمة قراءة وحظر السندات الزائدة) + اختبارا سلامة جديدان (80/80)
- [x] دفتر متابعة: تقدم كل مقطع (منجز/إجمالي + نسبة) + تاريخ آخر إنجاز لكل مقطع (completedDate من سجل تنفيذ الوضعيات) + نسبة إنجاز المخطط السنوي + مؤشّر متقدم/منتظم/متأخر مقارنة بالرزنامة التقديرية (schedulePace في getTeacherOSContext)
- [x] عرض دفتر المتابعة في Dashboard: نسبة الإنجاز + مؤشر الرزنامة + بطاقات تقدم المقاطع مع آخر إنجاز
- [x] طباعة احترافية A4: رأس رسمي جزائري (وزارة/متوسطة/أستاذ/مادة/مستوى/مدة/تاريخ) + تذييل، عبر مركز الطباعة المشترك A4Print (يعمل في المذكرة والتقويم وورقة التقويم بالمكتبة وتقرير التفتيش)
- [x] أزرار «طباعة» واضحة في عرض المذكرة والتقويم (A4PrintButton في LessonDetail وAssessment وResourceDetail وInspector)
- [x] اختبارات سلامة + تشغيل كامل (80/80) + checkpoint b7e99eac + مزامنة GitHub إلى Dzogx/Nibras_dz (2145d54..b7e99ea)
- [x] تحسين بطاقات الإحصاء في لوحة التحكم: عرض حالة تحميل أثناء جلب البيانات بدل صفر لحظي (الأصفار في لقطة الأستاذ كانت حالة تحميل لحظية — البيانات سليمة: 8 أقسام، 12 خطة، 2 درس منجز) + تصحيح classId الخاطئ للدرس 60005→1
- [x] مزامنة نقطة التفتيش النهائية مع المستودع الرسمي Dzogx/Nibras_dz (دُفعت b7e99ea إلى github/main)
- [x] نافذة معاينة قبل الطباعة (Print Preview Dialog): صفحة A4 محاكاة (210×297mm بمقياس 68%) بالترويسة الرسمية والتذييل داخل حوار Dialog مع زر «طباعة الآن» + «إغلاق»؛ أُضيفت في المذكرة (LessonDetail) والتقويم (Assessment) ومورد المكتبة (ResourceDetail) وتقرير المفتش (Inspector)

## الهوية البصرية ورموز QR (طلب الأستاذ 14 أغسطس)
- [x] رقم تسلسلي فريد لكل وثيقة (NIBRAS-YYYY-XXXXX) يُولّد عند التوليد ويُحفظ مع المورد، مع صفحة تحقق عامة (/verify) تستقبل الرقم وتؤكد الصادر والمصدر والتاريخ
- [x] QR تحقق من صحة الوثيقة: رمز QR في زاوية الترويسة الرسمية يطبع على كل الوثائق، يقود لصفحة /verify مع الرقم التسلسلي
- [x] QR نموذج الإجابة في ورقة التقويم: رمز QR مشفّر بوقت نهاية الاختبار — قبل الموعد يعرض صفحة «لم يحن وقت الكشف عن الإجابات»، بعده يفتح مفتاح الإجابة
- [x] هوية بصرية موحدة: شعار نبراس في ترويسة كل وثيقة + شريط لوني رسمي + ترويسة «أصدرها نبراس» مع الرقم التسلسلي
- [x] اختبارات سلامة للرقم التسلسلي والتحقق ونظام QR (88/88) + اختبار حالة locked بلا موعد + حقل UI «وقت نهاية الاختبار» في Assessment + تعبئة الموارد القديمة بـ SQL + checkpoint + مزامنة GitHub
