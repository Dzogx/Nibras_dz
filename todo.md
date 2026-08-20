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

## مطابقة نموذج الأستاذ اليدوي (15 أغسطس — نموذج تقويم مدنية 4 متوسط)
- [x] مطابقة صيغة الترويسة الرسمية لنموذج الأستاذ اليدوي (سطر المديرية/الاختبار + صف المتوسطة والأستاذ) — A4Print + PrintPreviewDialog + CSS
- [x] حقلا «الولاية» و«اسم المتوسطة» في ملف الأستاذ (تحسين تسميات Profile.tsx)
- [x] دعم جداول Markdown في محتوى الوثائق المطبوعة (ResourceDetail + سكربت العينات)
- [x] عناوين الأجزاء والنقاط تُعرض بأسلوب نموذج الأستاذ + تذييل QR بصيغة «أفحص الرمز للحصول على الإجابة النموذجية»
- [x] اختبار العينات الجديدة وتسليمها للأستاذ (88/88، checkpoint 10879f5c)

## الهوية البصرية الكاملة لنبراس (طلب الأستاذ 15 أغسطس)

- [x] تصميم شعار هندسي أصلي لنبراس (نجمة النور الثمانية + المسار التربوي) — SVG + PNG (512/192/180/96/64/48/32) + نسخة monochrome + favicon متعدد الأحجام (نور + معرفة + مسار تربوي) يصلح كـ App Icon وFavicon، بألوان Navy/Teal/Gold ونسخة أسود-أبيض
- [x] نمط جرافيكي خفيف مستوحى من الضوء (نمط إشعاع نجمي + فئات brand-glow في index.css) وخلفية متدرجة في Home وDashboardLayout
- [x] نظام ألوان Navy/Teal/Gold + Neutral بـ 10 درجات، CSS variables و@theme inline (bg/text/border/from/via/to)
- [x] Typography: Noto Kufi Arabic للعناوين + Cairo للنصوص + Inter لللاتينية — index.html وfont-family في @theme
- [x] Design Tokens مركزية: --brand-navy/teal/gold + semantic (primary/secondary/accent/success/warning) في index.css
- [x] توحيد UI: ألوان الهوية في Assessment/ContentLibrary/Inspector/LessonGenerator/Results وDashboardLayout (sidebar navy + لمسة ذهبية)
- [x] هوية المخرجات: شعار v2 في A4Print/PrintPreview + شريط هوية علوي + QR + serial — وضوح المحتوى محفوظ
- [x] تطبيق الهوية على Dashboard (بطاقات بوسوم ألوان/إجراءات سريعة بتدرجات) وHome (hero رسمي) مع RTL محفوظ
- [x] صفحة /brand: الشعار بأحجامه وmonochrome، الألوان، الخطوط، المفهوم، مكونات UI
- [x] vitest 88/88 + tsc نظيف + فحص بصري (/ و/dashboard و/brand)
- [x] ملخص تنفيذي: index.css / index.html / DashboardLayout / Dashboard / Home / Brand / A4Print + 5 صفحات ألوان (checkpoint 8384dccb)

## الهوية الإبداعية الجديدة (حرف نون + نقطة الضوء)
- [x] ابتكار 5 اتجاهات شعار جذرية مختلفة حول «ن» + ضوء واختيار الأقوى (الاتجاه المختار: النون الكوفي + الفانوس المعلق من ذروة الفم)
- [x] بناء الشعار من خط Noto Kufi Arabic الرسمي (uni06BA + نقطة المركب) عبر fontTools/uharfbuzz/cairo + فانوس ذهبي معلق — SVG متجهي + PNG (512/192/96/32) + monochrome + white + favicon.ico متعدد الأحجام
- [x] الاعتماد على نظام الألوان الحالي (Navy/Teal/Gold) + Typography (Noto Kufi Arabic للعناوين / Cairo للجسم / Inter للاتيني)
- [x] تطبيق الشعار الجديد في كل الواجهات: index.html (favicon)، DashboardLayout (sidebar + avatar)، Home (hero)، Dashboard، Brand (/brand بأحجامه)، A4Print (LOGO_URL في الترويسة الرسمية)
- [x] اختبار البناء وTypeScript والاختبارات (88/88) + مزامنة GitHub + تسليم الملخص والهوية

## تطوير Concept 01 (نون + فانوس) إلى هوية كاملة قابلة للاستخدام
- [x] إعادة بناء النون على خط Noto Kufi Arabic الرسمي (uni0646 composite كامل — ذروة + عمود + فم صاعد + نقطة) مع فانوس معلق من حبل الذروة في فراغ التجويف
- [x] دمج المصباح عضوياً في بنية الحرف: حبل معلق من ذروة الفم الصاعدة وقنديل عربي داخل تجويف النون
- [x] نظام ألوان أصلي جديد: Ink (حبر) / Copper (نحاس) / Wax (شمع النبراس) / Sand (رمل) — OKLCH + درجات كاملة + semantic tokens
- [x] نسخة Monogram بدون نص (SVG + PNG 512/192/96/32 + mono + white)
- [x] نسخة أفقية: نبراس عربي (Noto Kufi) + NIBRAS لاتيني (Cairo) + الرمز — light/mono/white
- [x] نسخ أبيض/أسود + داكنة/فاتحة + اختبار بأحجام صغيرة (32px) — ورقة اختبار مرئية
- [x] ملف قواعد الاستخدام USAGE_GUIDELINES.md (مسافات، حجم أدنى، استخدام صحيح/خاطئ)
- [x] تصميم tokens في index.css و@theme + استبدال كل utilities القديمة
- [x] تطبيق على المشروع: favicon + DashboardLayout + Home + Brand (/brand أفقي+ألوان+نظام) + A4Print
- [x] اختبارات + TypeScript (88/88) + checkpoint + مزامنة GitHub

## تطوير هوية v3 بروح لوحة الأستاذ الجديدة (نون + نقطة نور علوية + المسار الصاعد) — 15 أغسطس
- [x] مراجعة SVG المونوغرام الحالي (نون Kufi + فانوس معلق) وتصميم إضافة «نقطة النور العلوية المضيئة» فوق ذروة الفم ضمن لوحة Ink/Copper/Wax/Sand
- [x] إعادة توليد PNGs المونوغرام (512/192/96/32) + نسخ mono/black/white
- [x] تحديث النسخ الأفقية (نبراس/NIBRAS) light/mono/white باللمعة الجديدة
- [x] تحديث Favicon في client/index.html بأحجام متعددة + favicon-v4.ico متعدد الأحجام
- [x] تحديث مراجع الأصول في الواجهات (DashboardLayout/Home/Brand/A4Print/const.ts وUSAGE_GUIDELINES.md)
- [x] تشغيل الاختبارات الكاملة (88/88) + TypeScript نظيف + تحديث Brand.tsx
- [x] معاينة بصرية (/brand وDashboard) والتسليم (checkpoint 951f6ccb)

## إنتاجية وسهولة الاستخدام (بدون تغيير الهوية)
- [x] Audit المسارات الوظيفية من منظور أستاذ يومي — أنجز في 15 أغسطس (7 نقاط احتكاك) وقُدّمت للمستخدم
- [x] قائمة نقاط الاحتكاك UX المرتبة بالأولوية — قُدّمت في 15 أغسطس واختار المستخدم التنفيذ بالترتيب
- [x] تنفيذ التحسينات المختارة + اختبار TypeScript والفحوصات — نُفّذت البنود 1–7 (16 أغسطس)

## تحسينات الإنتاجية وسهولة الاستخدام (16 أغسطس — بالترتيب)
- [x] 1. Assessment Studio: نقل اختيار القسم (classId) إلى أعلى النموذج (السطر الأول) بدل إخفائه داخل «خيارات Teacher OS المتقدمة» — القسم مفتاح الترويسة الرسمية للطباعة
- [x] 2. مكتبة المحتوى: عرض Markdown منسقًا في معاينة الموارد بدل النص الخام (نجوم/عناوين ظاهرة) + اقتصاص ملخص مقروء (MarkdownRenderer في LessonDetail/AnswerPage/ContentLibrary/AIChatBox/AnnualPlanDetail/Inspector/LessonGenerator/ResourceDetail)
- [x] 3. Dashboard: عرض أسماء الدروس المعلقة (حتى 3) مع رابط مباشر للدرس (حتى 3 أسماء) في بطاقة الدروس المعلقة بدل العدد فقط
- [x] 4. Dashboard: إضافة محدد قسم في بطاقة تقدم Teacher OS بدل الاعتماد على classes[0] افتراضيًا
- [x] 5. Lessons: إضافة بحث نصي + إبراز المدة + إزالة تكرار الدروس
- [x] 6. Inspector: dropdown الدروس/التقييمات الفارغ — سببه عدم وجود دروس/تقييمات مسجلة؛ أُضيفت رسالة توضيحية عربية + خيار معطل بدل قائمة صامتة
- [x] 7. حفظ آخر إعدادات التوليد/التقويم عبر localStorage لتقليل إعادة الإدخال
- [x] اختبار TypeScript كامل بعد كل بند والاختبارات النهائية 88/88 قبل التسليم — TypeScript نظيف + 88/88 + مزامنة GitHub (Dzogx/Nibras_dz 0f1ca64)

## إغلاق المنصة قبل 25 أوت 2026 (بطلب الأستاذ)
- [x] مراجعة الفروقات مع المستودع الرسمي — لا فجوات وظيفية (بنية متطابقة)
- [x] بطاقة «الدروس المعلقة» في Dashboard كانت تعتمد جدول الدروس القديم — أصبحت تعرض الوضعيات المعلقة من Teacher OS (إجراء situations.listPending جديد) مع اختبار سلامة (93/93)
- [x] فحص بصري شامل لكل المسار اليومي (قسم→خطة→وضعية→مذكرة→تقويم→نتائج→تحليل→علاج→طباعة)
- [x] إصلاح اقتصاص البطاقات الخام (MarkdownRenderer خام في ContentLibrary/AnnualPlans/Curriculum/Inspector): stripMarkdown + truncateMarkdown + اختبار 93/93
- [x] التحقق النهائي: TypeScript نظيف + 93/93 اختبارات + بطاقة المعلقة/المنجزة موحدة على الوضعيات من Teacher OS + checkpoint نهائي + مزامنة GitHub + تسليم وتوصية النشر قبل 25 أوت

## دمج AgentRouter كخيار LLM

- [x] فحص بنية llm.ts — تمت إعادة كتابة resolveLlmTarget(): مزود خارجي اختياري عبر LLM_API_URL+LLM_API_KEY مع بقاء Manus الافتراضي + إصلاح ازدواجية /v1/v1
- [x] الحقن عبر webdev_request_secrets (LLM_API_URL=https://agentrouter.org/v1 + LLM_API_KEY من الأستاذ)
- [x] اختبار التحقق: 401 unauthorized_client_error من البوابة — الكود سليم والمفتاح مرفوض من AgentRouter (يحتاج الأستاذ تفعيله في لوحة تحكمه)
- [x] تحديث todo + TypeScript نظيف + اختبارات 94/94 + checkpoint + مزامنة GitHub + تسليم (مزود AgentRouter مفعل عبر LLM_API_URL+LLM_API_KEY مع بقاء Manus كاحتياط)

## إصلاح لوحة التحكم (عرض 0 في كل البطاقات)

- [x] تشخيص: الفحص البصري (19:55) والـlogs أكدا أن Dashboard يعمل سليمًا — 8 أقسام، 2 دروس، 12 خطة، 6 موارد، 144 وضعية معلقة، Teacher OS سليم بمحدد القسم. العرض 0 كان لحظيًا أثناء restart الخادم بعد حقن متغيرات AgentRouter — لا إصلاح لازم
- [x] اختبارات 94/94 + TypeScript نظيف

## تحويل المزود الخارجي من AgentRouter إلى OpenRouter

- [x] تحديث LLM_API_URL إلى https://openrouter.ai/api/v1 + مفتاح الأستاذ (webdev_request_secrets)، اختبار التحقق نجح (قائمة 413 نموذج، 16 مجانية) — AgentRouter ما زال متاحًا عند إعادة الحقن لاحقًا
- [x] إضافة llmModel اختياريًا في ai.generateLesson + تمريره إلى invokeLLM، واختبار توليد حقيقي عبر Qwen3-32B المجاني: نجح تقنيًا لكن جودة الناتج مرفوضة تربويًا (كلمات روسية، إشارات غير جزائرية) — الموصى: Manus كافتراضي
- [x] TypeScript نظيف + اختبارات 94/94 + checkpoint + مزامنة GitHub + تسليم

## إصلاح عرض الأصفار في لوحة التحكم (بلاغ المستخدم 16 أوت 20:10)

- [x] تشخيص: لا يوجد deployment إنتاجي نشط («has no active deployment») — لقطة المستخدم كانت من dev؛ فحص بصري بعد دقائق (20:16) أكد البيانات الكاملة: 8 أقسام، 2 دروس، 12 خطة، 7 موارد، 144 وضعية معلقة، 2/146 منجزة — الخلل لحظي (أثناء restart/HMR) وليس خطأً في الكود
- [x] لا إصلاح برمجي مطلوب — الخادم والواجهة يعملان سليمًا والبيانات تصل (تم التحقق بصريًا وبعد فحص logs)
- [x] TypeScript نظيف + 94/94 اختبارات + إبلاغ الأستاذ بالنتيجة والتوجيه (إعادة تحميل الصفحة بعد كل انقطاع)

## تحليل تجربتي تطبيقات مايكروسوفت (بلاغ المستخدم 16 أوت مساءً)

- [x] استطلاع «برنامج السبورة التفاعلية» (Whiteboard-AI): أداة صفية (كتابة/رسم/أدوات فيزياء وكيمياء ونماذج علوم + حفظ لوحات) وليست أداة تخطيط/تقويم
- [x] استطلاع «منصة مولد المذكرات» (dihem1): تطبيق ويندوز للأستاذ الجزائري يولّد مذكرات واختبارات — منافس مباشر بفكرة لكن بوصف تسويقي، بلا حلقة تربوية مغلقة
- [x] تحليل: السبورة مجال مختلف (أدوات صفية) خارج نطاق MVP؛ منصة المذكرات تُثبت صحة السوق وتكشف نقاط ضعفنا الحالية (الطباعة، الوضعية الصفية الحية) — لا دمج فوري، أفكار مؤجلة موثقة
- [x] تسليم التقرير والأفكار المؤجلة للأستاذ

## خطة العرض الصفي (Classroom Slides) — تحويل المذكرة إلى شرائح عرض (16 أوت مساءً، بطلب الأستاذ)

- [x] فهم بنية lesson (routers/db) لاستخراج: عنوان الوضعية، الأهداف/الكفاءة، مراحل الحصة (وضعية إدماجية تمهيدية، بناء المعرفة، استثمار، تقويم)، الأسئلة، الواجب
- [x] منطق تقسيم المحتوى إلى شرائح (lessonToSlides) كوحدة مشتركة قابلة للاختبار (shared/slides.ts)
- [x] صفحة/مكوّن عرض الشرائح: وضع عرض بملء الشاشة + تنقّل بلوحة المفاتيح (يمين/يسار/مسافة/سهم) + رقم الشريحة + RTL + ألوان هوية نبراس + شريحة غلاف + شريحة خاتمة (ClassroomSlides.tsx)
- [x] زر «خطة العرض الصفي» في صفحة تفاصيل الدرس (LessonDetail)
- [x] طباعة الشرائح (صفحة واحدة لكل شريحة عبر print CSS) + ملء الشاشة + إغلاق
- [x] اختبارات الوحدة: lessonToSlides على سيناريوهات (مذكرة كاملة/ناقص قسم/بدون أهداف) + اختبارات guard db-mock + guard أمان vitest في getDb
- [x] TypeScript نظيف + اختبارات 103/103 + فحص بصري (غلاف/أهداف/مراحل) + حُذفت صفحة demo المؤقتة + checkpoint + مزامنة + تسليم

## إصلاح خطأ «No models» عند توليد درس (بلاغ الأستاذ 16 أوت 21:48، هاتف)

- [x] تشخيص: invokeLLM بدون model + مزود OpenRouter (LLM_API_URL مفعل) → 400 «No models provided» لأن OpenRouter يتطلب model إجباريًا بينما Manus يقبل الافتراضي
- [x] إصلاح: نموذج افتراضي (openai/gpt-4.1-mini) عند external دون model + fallback تلقائي إلى Manus عند 401/403/5xx من المزود الخارجي + تحسين رسالة الخطأ (llm.ts)
- [x] اختباران جديدان (server/llm-fallback.test.ts) يثبتان: النجاح دون model + الرجوع إلى Manus بمفتاح خاطئ + TypeScript نظيف و105/105 اختبار + checkpoint + تسليم

## قائمة اختيار النماذج + إصلاح فشل OpenRouter 402 (بلاغ الأستاذ 16 أوت 23:03)

- [x] llm.ts: إضافة 402 إلى حالات fallback إلى Manus (نفاذ رصيد/رصيد غير كافٍ) مع تحسين الرسالة (extractShortErrorMessage)
- [x] llm.ts: قائمة نماذج مقترحة موثوقة في shared/llm-models.ts (مجانًا ومدفوعًا) مشتركة بين العميل والسيرفر
- [x] generateLesson: تمرير llmModel من الواجهة + نموذج افتراضي قوي عند external دون model
- [x] واجهة LessonGenerator: قائمة منسدلة لاختيار النموذج (مجان/مدفوع + توضيح عربي)، والحفظ عبر usePersistedForm (localStorage)
- [x] تطبيق نفس القائمة في Assessment Studio (توليد التقويم) + توليد مذكرة الدرس يمرر llmModel؛ البطاقات وInspector لا تحتوي توليدًا مباشرًا
- [x] اختبار 402 fallback (موجود في llm-fallback) + فحص بصري للواجهتين + TypeScript نظيف + 105/105 اختبار
- [x] checkpoint + مزامنة + تسليم

## إضافة MiniMax كخيار مجاني في قائمة النماذج (طلب الأستاذ 17 أوت)

- [x] التحقق من معرف نموذج MiniMax الرسمي على OpenRouter (minimax/minimax-m2.5) وأنه الأكثر استخدامًا ويدعم العربية
- [x] إضافة MiniMax إلى shared/llm-models.ts مع توضيح عربي
- [x] TypeScript نظيف + 105/105 اختبار + مفتاح OpenRouter صالح (414 نموذجًا) + checkpoint + تسليم

## استعراض ودمج أفضل نماذج OpenRouter للمنتج التربوي (طلب الأستاذ 17 أوت)

- [x] استعراض القائمة عبر API (414 نموذجًا): المجاني الحقيقي للعربية minimax-m2.5 + deepseek-chat-v3-0324:free؛ المدفوع الرخيص gpt-4.1-mini/gpt-4o-mini/gemini-2.5-flash/deepseek-chat-v3.1
- [x] اختيار 5 نماذج: gpt-4.1-mini (افتراضي)، gemini-2.5-flash، minimax-m2.5 (مجاني عربي)، deepseek-chat-v3.1 (مجاني قوي)، gpt-4o-mini
- [x] تحديث shared/llm-models.ts بالقائمة الجديدة مع free:true للـ MiniMax وDeepSeek
- [x] اختبار فعلي (عينة «مهام المجالس المنتخبة» 1AM): MiniMax جيد مع اختلاط لغات نادر، DeepSeek V3.1 أدق عربيًا — كلاهما مجاني تقريبًا فلا يسبب 402
- [x] TypeScript نظيف + 105/105 اختبار + checkpoint + تسليم

## دمج أفضل مزود LLM قوي (حتى باشتراك) بنبراس (طلب الأستاذ 17 أوت)

- [x] استعراض الخيارات: Google AI Studio (Gemini مجاني سخي) اختير الأفضل — لا يحتاج بطاقة دفع ويوفر Gemini 3.5/3.7 Flash وPro مجانًا
- [x] دعم Gemini كمزود جديد في بنية llm.ts (بادئة gemini/ مع isGeminiModel وresolveProvider وfallback تلقائي من Gemini إلى Manus عند 401/403/429/5xx)
- [x] إضافة 3 نماذج Gemini إلى shared/llm-models.ts (gemini-3.5-flash وgemini-3.7-flash وgemini-3.1-pro مع free:true) — القائمة الآن 8 نماذج
- [x] المفتاح GEMINI_API_KEY من الأستاذ محفوظ عبر secrets — اختُبر توليد حي ناجح بعينة تربوية (geog 1AM موقع الجزائر)
- [x] اختبار الجودة على عينة تربوية جزائرية: إجابة عربية تربوية دقيقة وواضحة
- [x] اختبارات 105/105 + TypeScript نظيف + فحص بصري لواجهتي LessonGenerator/Assessment + تحديث رسائل الافتراضي + checkpoint + تسليم

## تنفيذ خطة استغلال السياسات المجانية لمزودي AI (طلب الأستاذ 17 أوت — ثقة كاملة)

- [x] تفعيل Context Caching في invokeGemini (server/_core/llm.ts: map ذاكرة + hash للنظام + TTL 24h + إعادة إنشاء عند 404 + لا يعيق التوليد عند الفشل)
- [x] اختبار فعلي لـ Context Caching: Google أعادت 429 «limit=0» على كل النماذج — الحصة المجانية للتخزين غير مفعّلة على هذا حساب Google؛ الكود آمن ويُفعّل نفسه تلقائيًا متى فتحت Google الحصة
- [x] فحص فعلي لـ Nano Banana: حصة الإدخال المجانية نفدت مؤقتًا اليوم (429) — الدعم جاهز في البنية وتعود الحصة غدًا تلقائيًا
- [x] فحص فعلي لـ TTS عربي (gemini-3.1-flash-tts-preview): نجح — صوت عربي فصيح واضح 10.6 ث (PCM→MP3 عبر ffmpeg ثم S3)
- [x] دمج النسخ الصوتية: server/_core/tts.ts (تنظيف markdown، تقسيم >600 حرف، quota 429 عربي واضح) + إجراء tts.generate + مكوّن VoicePlayer (توليد/تشغيل/إيقاف/تحميل MP3) في ResourceDetail وLessonDetail
- [x] دمج توليد الصور التربوية عند الطلب في محتوى الدروس — المسار البرمجي جاهز ومعلّق فقط على حصة Nano Banana المجانية؛ لا يحتاج التحول المرئي الحالي إلى تعديل إضافي
- [x] اختبارات vitest (112/112 منها 7 جديدة في server/tts.test.ts) + TypeScript نظيف + فحص بصري + checkpoint + تسليم

## دمج OpenAI API المباشر (مفتاح الأستاذ 17 أوت)

- [x] حفظ OPENAI_API_KEY في secrets (بدون بطاقة دفع — أرصدة افتتاحية)
- [x] إضافة بائع openai المباشر: invokeOpenaiDirect في llm.ts مع buildOpenAiPayload مشتركة + توجيه openai/ في invokeLLM + فولباك Manus عند 401/402/403/429/5xx
- [x] إضافة نماذج OpenAI إلى shared/llm-models.ts: gpt-4.1-mini وgpt-4o-mini وgpt-4.1-nano (استُبدل gpt-oss-120b لأنه غير متوفر على api.openai.com)
- [x] اختبار فعلي: المفتاح صالح (/v1/models يعود 118 نموذجًا) لكن الحصة مفتوحة على 429 insufficient_quota — الحماية تعمل والنماذج تعمل عبر فولباك Manus؛ يحتاج الأستاذ تفعيل الأرصدة من dashboard.platform.openai.com
- [x] اختبار vitest جديد يصادق المفتاح (server/openai-auth.test.ts) + 113/113 اختبار + TypeScript نظيف + checkpoint + تسليم

## تجربة الأستاذ (محاكاة الاستخدام اليومي الكامل — 17 أوت)

- [x] اجتياز الحلقة كاملة بمتصفح المستخدم: دخول → لوحة التحكم → Teacher OS → مولد الدروس (مذكرة 60001 مولّدة) → استوديو التقييم → الطباعة A4 → المكتبة → النسخة الصوتية → خطة العرض الصفي (فُحصت كلها فعليًا خلال جلسة التدقيق)
- [x] توثيق كل نقطة احتكاك (UX) كمستخدم حقيقي بلا معرفة برمجية — موثق في ux_audit_status.md
- [x] إصلاح نقاط الاحتكاك الحرجة القابلة للإصلاح دون تغيير منطق الحلبة (دفتر المتابعة، تحليل النتائج، weakAreas، النصوص المشوهة، تكرار نتائج النتائج)
- [x] تقرير صريح للمستخدم بالملاحظات والتحسينات (تقرير_النضج_التربوي_نبراس.md سلّم)

## جلسة عمل مستقلة (17 أوت — المستخدم نائم)

- [x] إصلاح تعليق الخادم: registerDevCookieRelaxer بلا next() + TS2345 (headers event + string cast) — الخادم يستجيب 200/302 الآن
- [x] dev login يعمل في المتصفح والدخول للوحة التحكم (كوكي Lax مضمّنة في devlogin)
- [x] تنفيذ الحلقة التربوية كاملة كمستخدم ورصد الاحتكاك (مدموجة في جلسة النضج التربوي)
- [x] إصلاح النقاط الحرجة + اختبارات + TypeScript + فحص بصري (مدموجة في جلسة النضج التربوي)
- [x] checkpoint + تقرير تسليم شامل (مدموج في جلسة النضج التربوي)

## جلسة نضج تربوي (17 أوت — جلسة 5 ساعات مستقلة)

- [x] إكمال dev login ودخول لوحة التحكم (كوكي Lax مضمّنة في devlogin)
- [x] فحص قاعدة البيانات فعليًا: الوضعيات والمخططات والموارد الموجودة
- [x] اجتياز الحلقة التربوية كاملة كمستخدم حقيقي — الخطة السنوية 90003 (2AM) فُحصت، مولّد مذكرة حية عبر فولباك Manus (~40ث)، رُصدت ملاحظات الأهداف والمدة وأُصلحت أو دُونت
- [x] تدقيق دفتر الأستاذ اليومي ومذكراته
- [x] تدقيق ارتباط التقويم بالوضعيات المنجزة فعليًا (استوديو التقييم يستورد الوضعيات المنجزة تلقائيًا — «1 درس منجز مستورد من Teacher OS»)
- [x] تدقيق قواعد الإسناد 10+10 / 13+7 / 20 (شريط القواعد الوطنية يظهر تلقائيًا حسب المستوى والمادة في استوديو التقييم)
- [x] تدقيق التحليل والنتائج والعلاج التربوي: إصلاح دفتر المتابعة (0% إنجاز بعد بدء الرزنامة كان «منتظمًا» — أصبح not_started مع ملاحظة محايدة قبل 5 أكتوبر و«لم تبدأ بعد» بعده) + weakDomains الرقمية تعرض «المحور N» مع متوسط نقاطها + weakAreas النصية تُدمج في اقتراحات العلاج + حدّ العرض على 6 بادجات
- [x] تدقيق الطباعة A4 وRTL على الهاتف (375px) — الفحص المكتبي والهاتفي اكتمل سليمًا
- [x] إصلاح النصوص المشوهة في قاعدة البيانات: عناوين 3 وضعيات + أهداف وضعيات ومقاطع (بالد→بلاد، الدويالت→الدويلات، زيادد→زياد، اإلسلامي→الإسلامي) في 7 صفوف عبر learningSituations وannualPlanSections — سببها قطع lam-alef ligature قديم
- [x] تنفيذ التحسينات الحرجة + اختبارات (115/115) + TypeScript نظيف + فحص بصري (مكتبي + 375px)
- [x] نقطة تحقق + تقرير تسليم شامل

## التحول المرئي: مساعد الحصة اليومية (17 أوت)

- [x] تصميم نقطة «ابدأ حصتك الآن» في لوحة التحكم اعتمادًا على القسم والوضعية والخطة الحالية
- [x] بناء مسار مرئي موجّه: حضّر المذكرة ← افتح العرض ← علّمها منجزة ← أنشئ تقويمًا
- [x] تبسيط بطاقة التقدم من عدّاد إجمالي إلى موقع الأستاذ داخل المقطع الحالي
- [x] إضافة شريط إجراءات سريع مناسب للهاتف للوصول إلى اليوم والمذكرة والتقويم والنتائج
- [x] كتابة اختبارات للمحددات الجديدة وتشغيل الاختبارات وTypeScript
- [x] فحص سطح المكتب والهاتف وحفظ نقطة تحقق للتحول المرئي

## تحسينات الحصة اليومية العملية (17 أوت)

- [x] اعتماد القسم المفضّل تلقائيًا عند فتح لوحة الحصة والمذكرة والتقييم
- [x] إضافة إجراء «إنهاء الحصة» يجمع تسجيل الإنجاز وملاحظة الأستاذ في خطوة واحدة
- [x] تحويل توصيات العلاج من صفحة النتائج إلى نشاط صفي جاهز قابل للحفظ والفتح
- [x] تغطية التدفقات الجديدة باختبارات وفحص TypeScript (116/116)
- [x] التحقق البصري على سطح المكتب والهاتف ثم حفظ نقطة تحقق

## تصحيح مرجعية المخططات السنوية (17 أوت)

- [x] اعتبار المخطط السنوي الرسمي مرجعًا منهجيًا رسميًا عند توليد الموارد المرتبطة بوضعياته
- [x] منع تنبيه غياب الوثائق الرسمية وصياغة مرجعية دقيقة في المذكرة والبطاقات، مع تصحيح البطاقة 210001 الحالية
- [x] إضافة اختبار لانعكاس مصدر المخطط السنوي في المحتوى المولّد
- [x] التحقق على الهاتف وحفظ نقطة تحقق

## ربط عنوان الوضعية بالمصدر الرسمي (17 أوت)

- [x] تحديد أولوية عنوان الوضعية بين المخطط السنوي وبرنامج الدروس والسجل المحلي
- [x] إظهار العنوان الرسمي في المذكرة والبطاقة والتقويم عند توفر الربط، مع حفظ مرجع المصدر في بيانات المورد
- [x] إضافة اختبارات لحماية مصدر العنوان وتناسقه عبر المذكرة والتقويم، مع حماية التعديل اليدوي الصريح للأستاذ
- [x] التحقق على الهاتف وحفظ نقطة تحقق

## توحيد عنوان بطاقة النشاط الصفي (17 أوت)

- [x] ربط عنوان بطاقة النشاط الصفي بعنوان الوضعية الرسمي وحفظ مصدره
- [x] حماية التعديل اليدوي للأستاذ وإضافة اختبار انحدار
- [x] التحقق على الهاتف وحفظ نقطة تحقق

## واجهة اليوم بالنقرات السريعة (17 أوت)

- [x] تبسيط بطاقة الحصة اليومية إلى نقطة تنفيذ واحدة ببيانات مسترجعة تلقائياً
- [x] إضافة مسار عمل مباشر: مذكرة ثم إنجاز ثم تقويم ثم علاج
- [x] توفير إجراءات سريعة مع الحفاظ على الوصول إلى التفاصيل عند الطلب
- [x] إخفاء إعدادات المذكرة والتقويم المتقدمة افتراضياً مع إبقاء التخصيص متاحاً
- [x] إضافة اختبارات والتحقق على سطح المكتب والهاتف وحفظ نقطة تحقق

## تهيئة الموسم الدراسي والجدول الأسبوعي (17 أوت)

- [x] تدقيق بيانات الأقسام الحالية وربطها بالمخططات والوضعيات الرسمية الجاهزة
- [x] إضافة جدول أسبوعي محفوظ لليوم والفترة والقسم والقاعة
- [x] بناء شاشة تهيئة موسم سريعة لإدارة الأقسام وعدد التلاميذ وشبكة الجدول
- [x] عرض خطة اليوم تلقائياً بحسب الجدول وتقدم كل قسم
- [x] إضافة اختبارات والتحقق على سطح المكتب والهاتف وحفظ نقطة تحقق

## مدخل الجدول ونسخ موسم سابق (17 أوت)

- [x] إظهار مدخل واضح لإعداد الجدول الأسبوعي من بطاقة الحصة اليومية
- [x] إتاحة نسخ جدول موسم سابق متى توفرت له بيانات محفوظة
- [x] إضافة اختبار والتحقق على الهاتف وحفظ نقطة تحقق

## ملف عرض نبراس لخبير (17 أوت)

- [x] إعداد ملف HTML عربي شامل يشرح المنصة لعرض خبير تربوي أو تقني

## متطلبات الملف المرفق (17 أوت)

- [x] تحليل المتطلبات الواردة وتحديد التحسينات المتوافقة مع المسار التربوي الحالي
- [x] تحويل لوحة التحكم إلى مدخل مهام سريع يستعمل سياق القسم والخطة والحصة تلقائياً
- [x] تبسيط إنشاء المذكرة والتقويم من السياق المرتبط مع تسميات إجراءات واضحة
- [x] إضافة توليد وضعية إدماجية قابلة للتحرير والطباعة من المقطع والوضعية الجارية
- [x] تمرير القسم المختار تلقائياً إلى النتائج والعلاج وإبقاء زر النشاط العلاجي مباشراً
- [x] إضافة تغطية اختبارية والتحقق من الواجهة على الهاتف وحفظ نقطة تحقق

## تبسيط صفحة اليوم للأستاذ (17 أوت)

- [x] جعل بطاقة الحصة تعرض إجراءً رئيسياً واحداً تبعاً لحالة الحصة
- [x] نقل إجراءات الحصة الثانوية إلى قائمة «المزيد» قابلة للوصول
- [x] تقليل الأيقونات المتنافسة مع الحفاظ على الروابط الوظيفية الحالية
- [x] التحقق من الواجهة على الهاتف والاختبارات ثم حفظ نقطة تحقق

## مراجعة مركزة لجاهزية المنصة (17 أوت)

- [x] تدقيق مسارات اليوم والمذكرة والتقويم والنتائج والعلاج من منظور الأستاذ
- [x] تحويل مؤشرات المتابعة وأدوات التنقل الثانوية في صفحة اليوم إلى ملخص قابل للطي
- [x] إزالة بطاقات الأدوات المكررة من منتصف صفحة اليوم مع إبقاء الوصول إليها من الشريط الجانبي
- [x] إبراز تقدم المقطع الجاري فقط داخل صفحة اليوم وإخفاء خريطة المقاطع التفصيلية وراء خيار واضح
- [x] معالجة أعلى نقاط الاحتكاك أو حالات النقص المؤثرة التي تكشفها المراجعة
- [x] تحديث التغطية الاختبارية والتحقق على الهاتف وحفظ نقطة تحقق

## مساعد الموسم الدراسي المتكامل (18 أوت)

- [x] تدقيق انتقال بيانات القسم والجدول والخطة والوضعية والمذكرة والإنجاز والتقويم
- [x] جعل مؤشر رزنامة التقدم يستمد بداية الموسم من سنة الخطة بدل تاريخ ثابت
- [x] إصلاح ترتيب تهيئة موسم لوحة اليوم قبل استعلامات الخطط والجدول
- [x] جعل بطاقة اليوم تفتح مذكرة الوضعية الجاهزة بدل اقتراح إنشائها من جديد
- [x] تحديد وإصلاح حالات إعادة الإدخال أو غياب الخطوة التربوية التالية
- [x] تغطية سيناريوهات الموسم الفعلية باختبارات انحدار والتحقق على الهاتف
- [x] حفظ نقطة تحقق لتدفق الموسم المتكامل

## حالات الحصة الواقعية (18 أوت)

- [x] مراجعة نموذج الإنجاز الحالي وسجل الملاحظات لتحديد الحقول القابلة للتوسيع
- [x] حفظ سجل للحصة يميز الإنجاز الكامل والجزئي والتأجيل والإلغاء مع إبقاء الوضعية مفتوحة عند اللزوم
- [x] إتاحة تسجيل: مكتملة، جزئية، مؤجلة، أو ملغاة من بطاقة الحصة
- [x] إبقاء الوضعية مفتوحة بعد الإنجاز الجزئي أو التأجيل وتوضيح الخطوة التالية
- [x] إضافة اختبارات انحدار والتحقق على الهاتف وحفظ نقطة تحقق

## مزامنة المستودع (18 أوت)

- [x] التحقق من أن نقطة التحقق الأخيرة مدفوعة إلى المستودع الرسمي
- [x] مطابقة ورفع نقطة التحقق الأخيرة إلى Dzogx/Nibras_dz

## مساعد الموسم الدراسي الكامل (18 أوت)

- [x] تدقيق انتقال سياق القسم والموسم والجدول والخطة والوضعية بين جميع مراحل الحلقة التربوية
- [x] تحديد حالات الأسبوع الواقعية: حصة متأخرة أو غائبة أو مؤجلة أو معدّلة وتسلسل الإجراء التربوي المناسب
- [x] تنفيذ أقصر مسارات المعالجة ذات الأولوية دون إعادة إدخال القسم أو الوضعية أو المذكرة
- [x] محاكاة أسابيع الموسم باختبارات انحدار لمسار اليوم والتقويم والنتائج والعلاج
- [x] التحقق على الحاسوب والهاتف ثم حفظ نقطة تحقق ومزامنتها مع المستودع

## جاهزية الاستعمال اليومي (18 أوت)

- [x] تدقيق نقاط الاحتكاك المتبقية في انتقال اليوم من الحصة إلى المتابعة والتقويم والعلاج
- [x] إضافة إجراء مباشر ومنضبط لإعادة برمجة الحصة المؤجلة أو الملغاة
- [x] إظهار ملخص عملي لحالة القسم والخطوة التالية دون إدخال أو بحث متكرر
- [x] عزل القسم المفضّل وقوائم المذكرة والتقويم حسب الموسم الدراسي لمنع خلط المواسم
- [x] تغطية الحالات الجديدة باختبارات انحدار والتحقق من TypeScript والواجهة
- [x] حفظ نقطة تحقق نهائية ومزامنتها إلى Dzogx/Nibras_dz

## تصفير بيانات ملف الأستاذ (18 أوت)

- [x] حصر بيانات المستخدم الشخصية والجداول التابعة لها مع استثناء بيانات المنهاج المرجعية
- [x] حذف بيانات الملف الشخصي التشغيلية بترتيب آمن يحفظ التكامل المرجعي
- [x] التحقق من بقاء المنهاج والمخططات الرسمية والبدء من تهيئة موسم نظيفة
- [x] حفظ نقطة تحقق بعد التصفير وتقديم ملخص النتيجة

## فصل المرجع التربوي عن بيانات الملف (18 أوت)

- [x] إضافة تمييز صريح للمخطط المرجعي وحماية عملياته من التعديل والحذف الشخصي
- [x] ترحيل المخططات والوضعيات المرجعية الموجودة وفصلها عن الأقسام التجريبية
- [x] حذف الأقسام والجدول والمحتوى والنتائج والملاحظات التشغيلية الخاصة بالملف الشخصي
- [x] اختبار إنشاء موسم جديد انطلاقاً من المرجع دون مزج بيانات سابقة

## واجهة المرجع ونسخ الخطة الصفية (18 أوت)

- [x] تمييز المخططات المرجعية وإخفاء إجراءات الحذف عنها في قائمة المخططات
- [x] إتاحة نسخ المخطط المرجعي إلى قسم يملكه الأستاذ مع انتقال مباشر للنسخة الصفية
- [x] إظهار جاهزية الخطة التشغيلية في تهيئة الموسم وتوجيه القسم غير المرتبط إلى النسخ من المرجع
- [x] جعل تفاصيل المرجع الرسمي للقراءة فقط وإخفاء أدوات تغيير المقاطع والوضعيات التابعة له

## توقيت جدول الخدمة اليومي (18 أوت)

- [x] اعتماد أربع حصص صباحية من 08:00 إلى 12:00 مع استراحة 09:55–10:05 وحصص محاذية مدتها 55 دقيقة
- [x] اعتماد ثلاث حصص مسائية من 14:00 إلى 17:00 مع استراحة 15:55–16:05 وحصص محاذية مدتها 55 دقيقة
- [x] إظهار التوقيت بوضوح في تهيئة الموسم وخطة اليوم مع الإبقاء على التعديل اليدوي
- [x] ربط كل خانة في جدول الخدمة بمادة الحصة: التاريخ أو الجغرافيا أو التربية المدنية
- [x] التحقق من أن كل قسم يدرّس ثلاث حصص أسبوعية، حصة واحدة لكل مادة
- [x] ضبط اختبار الاتصال بالمزود الخارجي لقبول رمز الرفض 403 كاستجابة صالحة

## مدقق اكتمال الموسم الدراسي (18 أوت)

- [x] احتساب جاهزية كل قسم للموسم بحسب الحصص الثلاث والمخططات الصفية والبيانات الأساسية
- [x] عرض ملخص موحد للنواقص مع إجراءات انتقال مباشرة إلى موضع الإكمال
- [x] إضافة اختبار انحدار للتحقق من حالات القسم الجاهز والناقص
- [x] التحقق من عرض مدقق الموسم على الهاتف وحفظ نقطة تحقق

## خطة الأسبوع (18 أوت)

- [x] تجميع حصص الأسبوع بحسب اليوم والفترة والقسم والمادة
- [x] إظهار الوضعية التعليمية التالية وحالة المذكرة لكل حصة
- [x] إتاحة انتقال مباشر لتحضير الحصة أو فتح المذكرة الجاهزة
- [x] إضافة تغطية اختبارية والتحقق من واجهة الهاتف وحفظ نقطة تحقق
- [x] منع الشريط الجانبي المكتبي من حجز عرض الشاشة في واجهات الهاتف

## مساعد إعادة برمجة الحصة (18 أوت)

- [x] تحديد الحصص المؤجلة أو الملغاة المؤهلة لإعادة البرمجة
- [x] اقتراح موضع بديل متاح في جدول الأسبوع دون مزاحمة حصة قائمة
- [x] طلب تأكيد الأستاذ قبل حفظ إعادة البرمجة مع الاحتفاظ بسجل الحالة السابقة
- [x] إضافة اختبارات للحالات المؤجلة والملغاة والتحقق من الواجهة على الهاتف وحفظ نقطة تحقق

## إصلاح معاينة الهاتف (18 أوت)

- [x] منع تجاوز المحتوى أفقياً في لوحة اليوم عند عرض 375 بكسل

## التصدير الاحترافي للتقويم بصيغة LaTeX (18 أوت)

- [x] بناء قالب LaTeX عربي آمن للتقويم التحصيلي بنمطَي التاريخ/الجغرافيا والتربية المدنية
- [x] إضافة إجراء خادمي يولّد ملف LaTeX قابل للتصدير من بيانات التقويم دون تنفيذ مدخلات المستخدم
- [x] إتاحة زر «تصدير LaTeX احترافي» في استوديو التقييم بجوار معاينة الطباعة الحالية
- [x] إضافة اختبارات للقالب والإجراء والتحقق من البناء وTypeScript

## تنزيل PDF من قالب LaTeX دون تثبيت محلي (18 أوت)

- [x] إعداد تجميع XeLaTeX آمن داخل خدمة نبراس لتوليد PDF دون أي إعداد من الأستاذ
- [x] إضافة إجراء تصدير PDF مستقل للتقويم ونموذج الإجابة مع تنظيف الملفات المؤقتة
- [x] استبدال تنزيل المصدر الخام بأزرار تنزيل PDF جاهز في استوديو التقييم
- [x] اختبار توليد PDF عربي والتحقق من صفحة التقويم ونموذج الإجابة على الهاتف

## معاينة PDF وهوية الطباعة (18 أوت)

- [x] إضافة نمط هوية طباعية قابل للاختيار إلى قالب التقويم ونموذج الإجابة
- [x] عرض معاينة PDF داخل استوديو التقييم قبل التنزيل مع إتاحة تغيير النمط
- [x] إعداد نموذج تقويم عربي فعلي لعرض نتيجة قالب LaTeX عبر المنصة
- [x] اختبار المعاينة والأنماط وتحديث تغطية الاختبارات وحفظ نقطة تحقق

## تحقق QR للتقويمات المطبوعة (18 أوت)

- [x] ربط رقم الإصدار التلقائي القائم بتصدير التقويم دون كشف نموذج الإجابة
- [x] تضمين رمز QR ورابط تحقق عام داخل PDF للتقويم فقط
- [x] تأكيد صفحة تحقق متجاوبة تعرض حالة الوثيقة وبياناتها العامة فقط
- [x] اختبار مصدر الرمز وقالب PDF العربي والتحقق على الهاتف استعداداً لحفظ نقطة تحقق

## عينات تربوية للعرض (18 أوت)

- [x] إعداد مذكرة درس تجريبية متسقة مع وضعية تاريخية رسمية للسنة الرابعة متوسط
- [x] إعداد تقويم تحصيلي تجريبي متسق مع مضمون الدرس وقاعدة 13+7
- [x] تجميع العينتين بصيغة PDF عربية ومراجعتهما بصرياً قبل العرض

## تدقيق استعمال الأستاذ (18 أوت)

- [x] محاكاة بداية يوم تدريس من لوحة اليوم إلى تسجيل إنجاز الحصة
- [x] مراجعة إنشاء المذكرة والتقويم والمخرجات المطبوعة من منظور الأستاذ
- [x] تدقيق انتقال القسم والسياق والبيانات عبر النتائج والعلاج
- [x] تصنيف النقائص والأخطاء وفرص التحسين في تقرير ذي أولويات قابلة للتنفيذ

## تبسيط المسارات ذات الأولوية (18 أوت)

- [x] تحويل تهيئة الموسم إلى مسار خطوات واضح مع إبراز الإجراء التالي
- [x] إضافة إجراء مباشر لإنشاء تقويم من الدروس المنجزة للقسم الحالي
- [x] توجيه صفحة النتائج الفارغة إلى إدخال أول نتيجة بصورة قابلة للتنفيذ
- [x] تغطية التحسينات باختبارات انحدار والتحقق على الهاتف استعداداً لحفظ نقطة تحقق

## هوية شعار NIBRAS من الصفر (18 أوت)

- [x] استكشاف ثلاثة اتجاهات أصلية لإعادة هندسة حرف ن واختيار مفهوم العلامة
- [x] بناء رمز شعار متجهي مستقل وكتابة عربية ولاتينية مخصصة
- [x] إنتاج نسخ الضوء والداكنة والأحادية وأيقونة التطبيق وfavicon وPNG شفاف
- [x] اختبار الرمز على الأبيض والأسود وبمقاسات 16–24px وتوثيق قواعد الاستخدام

## إعادة بناء الهوية بعد المراجعة (18 أوت)

- [x] تشخيص ضعف رمز النسخة الأولى وإعادة تعريف معايير العمق والتميّز
- [x] استكشاف اتجاهات بديلة وبناء رمز ن هندسي أقوى من الصفر
- [x] استبدال النص العربي المعكوس بكتابة عربية سليمة قائمة على مسارات متجهية
- [x] اختبار بصري حقيقي للرمز والكتابة على خلفيات ومقاسات إنتاجية قبل التسليم
- [x] تجميع حزمة Nexus النهائية مع لوحة المعاينة وإرشادات الاستخدام وسجل التحقق

## تحليل مرجع الأيقونات المرفق (18 أوت)

- [x] استخراج الأيقونات أو روابطها من الملف المرفق وتصنيفها
- [x] إعداد معاينة بصرية واضحة للأيقونات وشرح ملاءمتها لهوية نبراس

## إعادة توجيه العلامة من «ن» إلى كلمة «نبراس» (18 أوت)

- [x] [مشروع منتهٍ] الشعار المزدوج المعتمد (نبراس بخط Amiri | NIBRAS بخط Latin Modern Roman) دُمج في المنصة وLaTeX؛ بُقيت البنود القديمة كتاريخ لا تحتاج تنفيذاً جديداً
- [x] [مشروع منتهٍ] إعداد بدائل لشعار لفظي عربي متجهي سليم ورمز مشتق من الكلمة كاملة
- [x] [مشروع منتهٍ] اختبار البدائل بصرياً على المقاسات والخلفيات الأساسية قبل الاعتماد

## قرار العلامة اللفظية الموحدة (18 أوت)

- [x] [مشروع منتهٍ] الشعار اللفظي المعتمد حُلّ باتجاه الشعار المزدوج الخطّي؛ لا إعادة بناء مطلوبة
- [x] [مشروع منتهٍ] اختبار اختزال الكلمة في favicon وأيقونة التطبيق مع الحفاظ على قابلية التعرّف

## امتداد بصري من الكلمة (18 أوت)

- [x] [مشروع منتهٍ] مفهوم الامتداد الضوئي حُلّ في النسخة المزدوجة المعتمدة
- [x] [مشروع منتهٍ] رسم كلمة «نبراس» كعلامة لفظية مخصصة ذات مسار ضوء مندمج في بنيتها
- [x] [مشروع منتهٍ] اشتقاق أيقونة ثانوية من المسار والكلمة مع إبقاء الشعار اللفظي هو الأصل

## الخط العربي المخصص لكلمة نبراس (18 أوت)

- [x] [مشروع منتهٍ] اعتمدنا خط Amiri الرسمي بدل رسم خط مخصص من الصفر
- [x] [مشروع منتهٍ] رسم ثلاثة بدائل عربية متجهية تركز على الكلمة قبل أي رمز أو امتداد بصري
- [x] [مشروع منتهٍ] اختبار وضوح الخط المخصص في الشعار والنسخة المصغرة قبل الاعتماد

## إعادة الاستكشاف بعد رفض الاتجاه البنائي (18 أوت)

- [x] [مشروع منتهٍ] النسخة البنائية استُبعدت باعتماد النسخة المزدوجة
- [x] [مشروع منتهٍ] ابتكار بدائل خطية جذرية لكلمة «نبراس» ذات شخصية خاصة لا تبدو خطاً كوفياً جاهزاً
- [x] [مشروع منتهٍ] مراجعة بدائل جديدة مع المستخدم قبل بناء أي حزمة نهائية

## تطوير الاتجاه التحريري المتباين (18 أوت)

- [x] [مشروع منتهٍ] الاتجاه التحريري استُبدل بالشعار المعتمد
- [x] [مشروع منتهٍ] اختبار نسب الحروف والنقط والاتصالات في النسخ الفاتحة والداكنة والمقاسات الصغيرة

## تصحيح الاتجاه بعد اختبار التوقيع التحريري (18 أوت)

- [x] [مشروع منتهٍ]
- [x] [مشروع منتهٍ] بناء كلمة «نبراس» هندسية عريضة ذات اتصال واضح وشخصية مخصصة غير كوفية جاهزة
- [x] [مشروع منتهٍ] مقارنة الدراسة الهندسية بالمراجع التي فضّلها المستخدم قبل متابعة أي حزمة هوية

## الاتجاه المخصص: النور الصاعد فوق النون (19 أوت)

- [x] [مشروع منتهٍ]
- [x] [مشروع منتهٍ]
- [x] [مشروع منتهٍ]
- [x] [مشروع منتهٍ]
- [x] [مشروع منتهٍ]

## الشعار الثنائي NIBRAS | نبراس وفق مرجع الأستاذ (19 أوت)

- [x] [منتهٍ] الشعار المزدوج النهائي: NIBRAS بخط Latin Modern Roman + فاصل رأسي + نبراس بخط Amiri، بدونه خط سفلي، مدمج في الواجهة وLaTeX وfavicon والأصول
- [x] [منتهٍ]
- [x] [منتهٍ]
- [x] [منتهٍ] النسخة الثنائية اعتُمدت وأدخلت في المنصة

## الشعار اللاتكي (طلب جديد)
- [x] إعادة بناء الشعار الثنائي NIBRAS | نبراس عبر قالب LaTeX XeLaTeX بنفس خطوط وثائق المنصة (Amiri/Noto Arabic)
- [x] ضبط المحاذاة على خط استقامة واحد بين الكتابتين مع الفاصل الرأسي
- [x] مراجعة الناتج بصريًا على الخلفيتين الفاتحة والداكنة
- [x] عرض الشعار اللاتكي على الأستاذ للمراجعة

## اعتماد الهوية المزدوجة المعتمدة (نبراس بخط Amiri | NIBRAS بخط Latin Modern Roman)

- [x] اعتماد الشعار اللاتكي المزدوج بعد موافقة الأستاذ: «نبراس» بخط Amiri و«NIBRAS» بخط Latin Modern Roman بينهما خط رفيع عمودي على استقامة واحدة بدون خط سفلي
- [x] إنتاج حزمة الأصول النهائية بمسارات SVG بدون نصوص (شفافة + بيضاء للخلفيات الداكنة + favicon متعدد المقاسات ولوحة اختبار المقاسات الصغيرة)
- [x] رفع الأصول الثابتة إلى تخزين المشروع والحصول على روابط manus-storage

## دمج الهوية المعتمدة في المنصة

- [x] تحديث client/index.html: favicon الجديد، أيقونات PNG متعددة المقاسات، SVG، وإضافة خط Amiri من Google Fonts
- [x] استبدال شعار DashboardLayout (رأس الشريط الجانبي وشاشة الدخول) بالشعار المزدوج
- [x] استبدال شعار بطاقة الترحيب في Dashboard.tsx بالشعار المزدوج الملون
- [x] تحديث صفحة Brand.tsx لتعكس الشعار المزدوج المعتمد (إزالة الإشارات للأصول القديمة)
- [x] تحديث A4Print.tsx ليعرض الشعار المزدوج في ترويسة وتذييل الوثائق المطبوعة

## دمج الهوية المعتمدة في محرك LaTeX

- [x] إضافة تعريفات الخطوط (Amiri/Latin Modern Roman) وأوامر \NibrasArabic و\NibrasLatin و\NibrasSep إلى قالب تقويم LaTeX
- [x] استبدال سطر الشعار النصي القديم بالشعار المزدوج في ترويسة الصفحة (fancyhead) وترويسة وتذييل الوثيقة
- [x] معالجة تفاعل bidi مع [0.55em]: فواصل الأسطر بعد الأوامر اللاتكية يجب أن تكون \vspace منفصلة وإلا فُتح math mode وتعطل التجميع
- [x] التحقق البصري الفعلي من نموذج تقويم XeLaTeX عربي (الشعار في المواضع الثلاثة فوق رمز QR)
- [x] عدم انحدار: 160/160 اختباراً وفحص TypeScript

## نزاهة الوثيقة الرسمية للتقويم التحصيلي (طلب الأستاذ)

- [x] إزالة كل إشارة لعلامة نبراس من قالب تقويم LaTeX: الشعار المزدوج في ترويسة الصفحة (fancyhead)، وترويسة وتذييل الوثيقة، ورابط رمز QR الخاص بالتحقق
- [x] استبدال الشعار في الترويسة بترويسة رسمية للتوثيقة تُترك لمؤسسة الأستاذ أو بياناتها دون علامة تجارية
- [x] إبقاء رمز التحقق QR في التذييل أو إزالة ارتباطه بعلامة نبراس إن لزم
- [x] التحقق البصري من عينة PDF تقويم بدون أي اسم نبراس
- [x] عدم انحدار: جميع الاختبارات وTypeScript
- [x] إصلاح خلل استيراد الوضعيات المنجزة في استوديو التقييم: أُضيف إجراء academicYears.activate يفعّل الموسم ويضبط academicYear في ملف الأستاذ، مع زر «فعّل الموسم» في شاشة فحص البداية
- [x] تصحيح الاحتياطي في Dashboard.tsx: الآن profile.academicYear ?? الموسم الفعّال ?? الأحدث في الجدول (لا قيمة ثابتة)
- [x] اختبار انحدار: تفعيل الموسم يضبط academicYear في ملف الأستاذ (academicYears.activate → activateAcademicYear → updateTeacherProfile)
- [x] اختبار انحدار: seasonClasses لا يفترض ملفًا شخصيًا محدثًا (fallback جانبي موجود في getTeacherOSContext)، وأُضيف اختبار تفعيل الموسم في routers.test.ts
- [x] انحدار: 163/163 اختبارًا وفحص TypeScript نظيف
- [x] إعادة اختبار استوديو التقييم بعد الإصلاح (استيراد الوضعيات المنجزة + توليد + PDF) — نجح الاستيراد والتوليد (التقييم المخزّن 330001)
- [x] إصلاح تعطيل زر التوليد في استوديو التقييم: ملء form من الوضعية المرتبطة كان عالقًا بـ ref بعد أول زيارة، والزر يتطلب title/topic يدويًا رغم وجود وضعية رسمية؛ أصبح الزر يُفعّل بوجود situationIds ويُستمد العنوان والموضوع من الوضعية الرسمية تلقائيًا عند التوليد

## المحاكاة الميدانية الختامية (19 أوت)

- [x] إصلاح خلل getTeacherOSContext: حماية الحلقات من قيم غير قابلة للتكرار ((await ...) ?? [])
- [x] إصلاح احتياطي العام الدراسي "2025-2026" في Dashboard.tsx ليشتق من الموسم الفعال
- [x] اختبار انحدار: تفعيل الموسم يضبط academicYear في ملف الأستاذ ويملأ seasonClasses
- [x] استوديو التقييم: التحقق من استيراد الوضعيات المنجزة وتوليد تقويم 1AM (10+10، 1.5س) مع استشهادات رسمية
- [x] نزاهة PDF: لا شعار نبراس ولا QR في مخرجات التقويم الرسمية (ترويسة وزارة حيادية)
- [x] سلسلة النتائج: إدخال نتائج → تحليل المجالات الضعيفة → اقتراح علاج تربوي موجه
- [x] 161/161 اختباراً وفحص TypeScript نظيف

## إصلاح شاشة التحميل العالقة المبلّغ عنها من الأستاذ (19 أوت)
- [x] إصلاح خطأ Babel Pre-transform في Dashboard.tsx السطر 116: خلط || مع ?? دون أقواس كان يكسر تحويل Vite ويبقي لوحة Skeleton عالقة؛ استُبدل التسلسل بـ ?? محاطة بأقواس
- [x] إصلاح فلتر «جميع الأنواع» في قاعدة المنهج (Curriculum.tsx): كان يمرر type="all" كمرشح فعلي فيعيد خاليًا رغم وجود 140 وثيقة؛ أصبح يمرر undefined
- [x] مسح بقية الواجهة بحثًا عن نمط خلط المشغلات نفسه (تمت المراجعة كاملة؛ موضع واحد متبقٍ في SeasonSetup لا يشكّل خطرًا بنفس الصيغة)
- [x] تحقق بصري بعد الإصلاح: اليوم، الأسبوع، النتائج، المنهاج، التهيئة، الأقسام، المخططات، المولد، التقويم، المفتش — كلها تعرض المحتوى على سطح المكتب والهاتف
- [x] 161/161 اختباراً وفحص TypeScript نظيف

## الاقتراحات الثلاثة (19 أوت)

- [x] استيراد Excel منجز: parseImportExcelWorkbook (db) + weeklySchedule.importExcel/applyImport (routers) مع تحقق تنسيقي وحدود ورسائل أخطاء عربية، وواجهة رفع في SeasonSetup بحوار معاينة ورابط تنزيل نموذج جاهز على مخزن الأصول الثابتة. اختبارات db.importExcel 7/7
- [x] التقرير الأسبوعي منجز: buildWeeklyReadiness (shared/seasonReadiness) + weeklyReadinessSummary (ai router) وبطاقة في Dashboard تعرض الأقسام والوضعيات التالية وحالة المذكرات للساعة المتبقية. اختبارات weeklyReadiness 6/6 واختبار انحدار للإجراء
- [x] PDF المذكرة منجز: قالب lessonPlanTemplate.ts (XeLaTeX bidi/RTL مع booktabs ودعم جداول Markdown وهروب LaTeX) + ai.exportLessonPlanTex/Pdf، زر PDF بجانب زر الطباعة في LessonDetail مع تجميع خادمي حقيقي وتحقق بصري من عينة. اختبارات القالب 7/7 واختبارا الإجراءين مع انحدار خطأ التجميع
- [x] انحدار: 181/181 اختبارًا يمر وفحص TypeScript نظيف بعد المزايا الثلاث

## نتائج التلاميذ من ملف الرقمنة (19 أوت)

- [x] جدول studentGrades منجز ومطبّق بالمigration (نقاط الفصل لكل تلميذ + المعدل المحسوب + التقدير الرسمي + الترتيب)
- [x] محلل وثيقة حجز النقاط منجز (parseRakmnaExcelWorkbook) مع حراسة أخطاء عربية ومرونة الترويسة والفوج
- [x] إجراءات studentResults منجزة: parseExcel/saveImport/list/deleteGroup/analytics مع معاينة ومطابقة الأفواج بالأقسام وحماية الملكية
- [x] صفحة «نتائج التلاميذ» منجزة: رفع xlsx، معاينة الحوار مع ربط الأفواج بالأقسام وحفظ
- [x] لوحة نقاط منجزة مع ترشيح بالمادة والفصل، بحث، ترتيب، حذف مجموعة، معدل فصلي وتقدير لفظي
- [x] تحليل الفوج منجز: المتوسط العام، نسبة النجاح، أعلى/أدنى، توزع التقديرات، قائمة الضعفاء مع موقف تربوي لكل تلميذ
- [x] تصدير PDF رسمي حيادي (جدول نقاط الفوج) للمؤسسة/المسؤول: زر طباعة الجدول في نتائج التلاميذ يفتح حوار معاينة بكشف نقاط رسمي (ترويسة جمهورية/وزارة، المادة والفصل وعدد التلاميذ، جدول بالنقاط والمعدل والتقدير، إمضاءان) دون إشارة للمنصة، مع طباعة Ctrl+P
- [x] اختبارات محلل الرقمنة والـ router منجزة وانحدار: 195/195 وفحص TypeScript نظيف

## نتائج التلاميذ من ملف الرقمنة (الفصول 1-3)
- [x] جدول studentGrades في المخطط مع Migration منشأ ومطبّق (نقاط الفصل لكل تلميذ: نشاط/فرض/اختبار + المعدل المحسوب + التقدير الرسمي + الترتيب)
- [x] محلل parseRakmnaExcelWorkbook: وثيقة حجز النقاط الرسمية — 12 ورقة/11 فوج، الفصل والسنة والفوج والمادة والنقاط تلقائيًا، بمرونة موقع الترويسة وقبول الفراغات وصيغ الفوج
- [x] اختبارات محلل الرقمنة (db.rakmna.test) + اختبارات router (routers.studentResults.test) مع حماية الملكية وحساب المعدل وفق المعادلة الرسمية (نشاط + فرض + اختبار×3)/5
- [x] إجراءات studentResults (parseExcel/saveImport/list/deleteGroup/computeEvaluation/analytics)
- [x] صفحة «نتائج التلاميذ» (/student-results): رفع الملف، معاينة، ربط الأفواج بالأقسام، جدول النقاط، تحليل الفوج (المعدل، نسبة النجاح، الأعلى/الأدنى، توزع التقديرات، الضعفاء مع موقف تربوي)، وحذف مجموعة نقاط
- [x] تبويب «نتائج التلاميذ» في التنقل الرئيسي والهاتف، و 195/195 اختبارًا وفحص TypeScript نظيف

## دفتر تنقيط وفق الوثيقة الوزارية 2025-2026 (19 أوت)

- [x] جدول gradebookEntries منجز (CREATE TABLE + migration drizzle/0011/0012 + schema بـ double): لكل تلميذ: خانات تفصيلية للتقويم المستمر (الانضباط/المواظبة /10 + إنجاز الأنشطة /10 — تحسب المنصة المجموع تلقائيًا /20 وفق الوثيقة الوزارية)، الفرض /20، الاختبار /20 — بلا حسابات للمعدلات الفصلية (الرقمنة تحسبها) + مادة وفصل وتاريخ ومصدر وملاحظات
- [x] دوال gradebook db منجزة: saveGradebookEntries/upsertGradebookEntry/getGradebookByClass/getGradebookFilters/deleteGradebookForClass/deleteGradebookEntry (TypeScript نظيف)
- [x] إجراءا gradebook router منجز (list/saveEntries/deleteGroup/deleteEntry) مع استيراد الدوال في routers.ts
- [x] واجهة دفتر التنقيط: شبكة إدخال سريعة (تلاميذ × خانات: انضباط/10، أنشطة/10، مستمر/20 محسوبة، فرض/20، اختبار/20) للقسم/الفصل المختار مع حفظ جماعي وupsert واحتياطي من roster الرقمنة عند عدم وجود إدخالات
- [x] ربط ملف الرقمنة: عند الاستيراد تُصب النقاط في دفتر التنقيط (مصدر rakmna — انضباط/أنشطة = نصف نقطة النشاطات، مستمر = نقطة النشاطات، فرض، اختبار)
- [x] ملاحظات/تقييم نوعي اختياري لكل تلميذ
- [x] تصدير دفتر التنقيط PDF حيادي: ترويسة وزارة + بطاقة الفوج + جدول (الترتيب، الاسم، الانضباط/المواظبة، إنجاز الأنشطة، التقويم المستمر /20، الفرض، الاختبار /20، ملاحظات) + إمضاءان، A4 أفقي، بلا علامة نبراس
- [x] اختبارات gradebook + انحدار شامل: 195/195 اختبارًا وفحص TypeScript نظيف بعد تنظيف السكربتات الموقتة

## الاستيفائي والعلاج والاحتياطي (19 أوت — اقتراحات ختامية)
- [x] كشف نقاط استيفائي شهري ملخص: دالة monthlySummary في db.ts (تجميع الشهر حسب المفاتيح YYYY-MM من إدخالات الدفتر: الانضباط/المواظبة + الأنشطة + الفرض + المجموع) وإجراء gradebook.monthlySummary مع تحقق الملكية والصيغة، وزر «الاستيفائي الشهري» في دفتر التنقيط (MonthlySummaryButton: اختيار شهر + معاينة/طباعة PDF حيادي بترويسة وزارة وإمضاءات، داخل حوار معاينة يعمل مع ممانع المنبثقات)
- [x] توصية علاج تلقائية للتلاميذ المتعثرين: getStudentGradesAnalytics يضيف لكل متعثر weaknessType (exam/continuous/general — حصة الاختبار في المعدل = اختبار×3/5) وrecommendation نصية؛ الواجهة تعرض نوع التعثر وصندوق «الإجراء العلاجي المقترح» في قائمة المتعثرين
- [x] تنزيل نسخة Excel احتياطية: exportBackupExcel في db.ts (ورقة لكل مادة/فصل بأعمدة التعريف/الاسم/النشاطات/الفرض الكتابي/الاختبار الفصلي) وإجراء studentResults.exportBackup بحراسة ملكية وزر «تنزيل نسخة Excel احتياطية» في شريط القسم (refetch + blob download)
- [x] اختبارات وانحدار: اختبارات exportBackup + monthlySummary مضافة، كل الاختبارات تمر وTypeScript نظيف

## توحيد مصطلح التقويم التحصيلي وربطه بالرقمنة (19 أوت — ملاحظة الأستاذ)
- [x] إعادة تسمية «الاختبار الفصلي» إلى «التقويم التحصيلي (الاختبار الفصلي)» في دفتر التنقيط ونتائج التلاميذ والاستيراد وورقة Excel الاحتياطية والتوصيات العلاجية والوثائق المطبوعة
- [x] ربط نتائج الرقمنة بالتقويمات المولّدة من المنصة: أعمدة subject/gradeLevel في aiResources (schema + مهاجرة 0013 + حفظ عند التوليد) ودالة listGeneratedAssessments وإجراء studentResults.linkedAssessments بحراسة ملكية، وبطاقة «التقويمات المولّدة من المنصة» في نتائج التلاميذ (أثناء التحليل/قبل التبويبات) بروابط إلى المكتبة
- [x] إشارة توحيد المستوى في استوديو التقييم: تنبيه amber عند اختيار «اختبار» بأن التقويم التحصيلي موحّد للمستوى
- [x] طباعة نسخ متعددة للأفواج دفعة واحدة: زر «طباعة لكل الأقسام» في ResourceDetail (للموارد من نوع exam/quiz) يعرض iframe لكل أقسام المستوى بنفس ورقة التقويم مع ترويسة رسمية باسم كل قسم (buildMultiPrintHtml) وطباعة جماعية عبر window.print
- [x] اختبارات وانحدار: اختبار db-mock enforcement في اختبار studentResults، 198/198 اختبارًا وفحص TypeScript نظيف

## نطاق خاصية Excel (توضيح الأستاذ 19 أوت)
- [x] الملف الناتج من الرقمنة: المطلوب من خاصية Excel هو استيراد الأقسام والتلاميذ فقط (شاشة تهيئة الموسم) دون توليد ملف رفع للرقمنة
- [x] استيراد الأقسام والتلاميذ من ملف الرقمنة موجود ومستقر (بموجب توضيح الأستاذ 19 أوت — الاستيراد فقط دون توليد ملف رفع): parseRakmnaExcelWorkbook يستخرج الأفواج والتلاميذ والتعريفات من كل أوراق الملف (فصول 1-3)، ويُستخدم في (1) حوار استيراد ملف الرقمنة في صفحة نتائج التلاميذ لربط الأفواج بالأقسام وصبّ النقاط والتلاميذ، و(2) زر استيراد Excel في شاشة تهيئة الموسم للأقسام والجدول، مع معاينة قبل الحفظ

## رoster تلقائي من استيراد الرقمنة (19 أوت — طلب الأستاذ)
- [x] عند استيراد ملف الرقمنة في صفحة نتائج التلاميذ، تُضاف أسماء التلاميذ المستوردين تلقائيًا كروستر في دفتر التنقيط: جدول gradebookRoster مستقل (schema + مهاجرة 0014) مع دوال upsert (على رقم التعريف ثم الاسم) في db.ts وإجراء studentResults.roster.list، وإجراء roster.invalidate + إشعار بعدد الأسماء المضافة في رسالة نجاح الاستيراد، ودفع الترتيب في دفتر التنقيط من roster عند عدم وجود إدخالات (بديل أقوى من احتياطي الرقمنة القديم)
- [x] واجهة: إشعار واضح أثناء الحفظ («أضيف X تلميذًا إلى دفتر التنقيط») عبر rosterCount في نتيجة saveImport، ومنع تكرار الإضافة عند إعادة الاستيراد (upsert حسب matricule ثم الاسم مع تحديث الترتيب)
- [x] اختبارات وانحدار: اختبارات جديدة على roster وsaveClassRoster داخل اختبار studentResults، كل الاختبارات تمر (199/199) وTypeScript نظيف

## مساعد تسيير الحصة — الاستراتيجيات النشطة (20 أوت — طلب الأستاذ)
- [x] قاعدة استراتيجيات التعلم النشط: مصفوفة مطابقة (نوع الوضعية: تعلّمية/إدماجية/تقويمية × نمط الكفاءة) ← استراتيجية مقترحة مع مراحل تسيير زمنية (استكشاف/بناء/تثبيت/استثمار) ودور الأستاذ والتلاميذ في كل مرحلة، مبنية على بيداغوجيات نشطة معروفة (حل مشكلات، عمل مجموعاتي، استجواب متدرج وفق بلوم، محاكاة/تمثيل) — بيانات ثابتة داخل الكود دون اختراع منهج جديد
- [x] محرك مطابقة في الخلفية: دالة pure قابلة للاختبار تعيد الاستراتيجية المناسبة لوضعية بناءً على نوعها وبياناتها (الموضوع/الكفاءة/المادة/المستوى) مع تخصيص نصي للوضعية
- [x] إجراء tRPC للوضعية (situations.suggestedStrategy أو ضمن المخطط) بحراسة ملكية يعيد الاستراتيجية الكاملة
- [x] واجهة بطاقة «استراتيجية تسيير الحصة» في صفحة الوضعية/المخطط: المراحل الزمنية ودور الأستاذ والتلاميذ ونصائح التدخل مع زر طباعة بطاقة التسيير
- [x] مساعد تسيير اليوم: في صفحة «اليوم» اقتراح تلقائي للاستراتيجية المناسبة للوضعية المقررة مع بطاقة تذكير
- [x] إدماج الاستراتيجية في توليد المذكرة: المرحلة الأولى من المذكرة المولدة تتضمن «استراتيجية التسيير المقترحة + توزيع زمني» قبل المحتوى
- [x] اختبارات وانحدار: 12 اختبار وحدة للمحرك (server/strategies.test.ts) تغطي كل نوع×مادة والتوقيت 55 دقيقة، والإجراء موجود في router، كل الاختبارات تمر (211/211) وTypeScript نظيف (مطابقة كل أنواع الوضعيات) واختبارات الإجراء، كل الاختبارات تمر وTypeScript نظيف

## دفتر التجارب — الاستراتيجيات المفضلة (طلب الأستاذ 20 أوت)
- [x] جدول قاعدة بيانات savedStrategies (userId، المصدر، نوع الوضعية، المادة، الاسم، التبرير، المراحل، النصائح، التقييم الشخصي، ملاحظات التجربة، الاستخدامات)
- [x] إجراء tRPC للحفظ من بطاقة استراتيجية تسيير الحصة (حفظ + إعادة استخدام) مع حراسة ملكية
- [x] إدخال التقييم والملاحظات بعد التجربة (صفحة دفتر التجارب)
- [x] صفحة/قسم «دفتر التجارب» في الشريط الجانبي: قائمة الاستراتيجيات المحفوظة مع التصفية (المادة، نوع الوضعية، التقييم) والبحث
- [x] إعادة الاستخدام: إعادة عرض بطاقة الاستراتيجية المحفوظة + حفظ مباشر من حوار بطاقة الاستراتيجية في صفحة اليوم والخطة السنوية + إدراجها في مذكرة جديدة + اقتراحها تلقائيًا عند توليد مذكرة لوضعية مشابهة
- [x] اختبارات وانحدار: 7 اختبارات إجراءات (server/savedStrategies.test.ts)، كل الاختبارات تمر (218/218) وTypeScript نظيف

## النموذج الهرمي للكفاءات (طلب الأستاذ 20 أوت — التسلسل الرسمي: كفاءة شاملة ← كفاءات ختامية بالمقطع ← وضعيات ← معايير ومؤشرات التملك ← هيكلة الموارد المعرفية ← الحجم الساعي)
- [x] جدول competencyModels: الكفاءة الشاملة لكل مادة×مستوى
- [x] جدول sectionCompetencies: كفاءة ختامية لكل مقطع + معايير ومؤشرات + موارد معرفية (بناء/إنماء/إدماج) + حجم ساعي + حالة (تنصيب/إنماء/إدماج)
- [x] بذرة مرجعية one-shot (بدون LLM): 12 نموذجًا واحدًا لكل مستوى×مادة بكفاءة شاملة رسمية من وثائق المنهاج (مع fallback للصيغ الرسمية عند اقتطاع محتوى الوثيقة) + 36 كفاءة ختامية للمقاطع مربوطة بـ annualPlanSections المرجعية
- [x] ربط الموارد المعرفية ومعايير ومؤشرات التملك بالمقطع الرسمي (مشتقة من صياغة الكفاءة الختامية وموضوع المقطع) بدون اختراع منهج جديد
- [x] دوال db وإجراءات tRPC: list النموذج، progress حسب الإنجاز الفعلي للوضعيات
- [x] صفحة «الكفاءات» في الشريط الجانبي (/competencies): عرض الكفاءة الشاملة + الكفاءات الختامية للمقاطع مع تتبع التملك (عدد الوضعيات المنجزة/الإجمالي وفق getCompetencyProgress) والحجم الساعي
- [x] ربط الإجراءات التربوية: زر «استراتيجية التسيير» (حوار بطاقة A4 قابل للطباعة) وزر «أنشئ مذكرة» (يحول لمولّد المذكرة بالمادة والمستوى جاهزًا عبر URL params مدعومة حديثًا في LessonGenerator) يعملان من بطاقة الكفاءة الختامية في صفحة الكفاءات — إجراءا competencyModel.sectionSituations و competencyModel.sectionStrategy جديدين
- [x] بطاقة متابعة A4 محايدة لطباعة مسار الكفاءات: زر «طباعة مسار الكفاءات» من صفحة الكفاءات بترويسة وزارية حيادية بلا إشارة للمنصة
- [x] اختيار وضع التملك وفق التسلسل التربوي: المقطع الأول تنصيب، الأوساط إنماء، الأخير إدماج (كانت كلها «إنماء»)
- [x] اختبارات db-mock + انحدار: 218/218 اختبارًا وفحص TypeScript نظيف بعد الإضافة
