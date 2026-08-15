# حالة مهمة: الهوية البصرية + QR (14 أغسطس مساءً)

## الهدف
هوية بصرية موحدة للوثائق + QR تحقق + QR نموذج إجابة التقويم يعمل بعد نهاية الاختبار فقط.

## ما أنجز
1. **schema**: أُضيفت لأعمدة `serialNumber VARCHAR(32)`, `answerRevealAt BIGINT`, `examEndsAt BIGINT` في جدول aiResources (drizzle/schema.ts) — طُبّقت يدوياً في DB عبر webdev_execute_sql. أزلت migration 0005 من journal (لأن الأعمدة طُبّقت يدوياً، لا نحتاج ملف migration).
2. **شعار نبراس**: أُنشئ SVG (شمس نبراس بتدرج أخضر/برتقالي) وأُرفع في /manus-storage/nibras-logo_59482451.svg — استخدمه في الترويسة.
3. **qrcode**: ثُبّت `pnpm add qrcode` + `@types/qrcode` في /home/ubuntu/nibras (dev server يعمل 200).

## البنية المعتمدة (خطة التنفيذ)
- **الرقم التسلسلي**: `NIBRAS-{YYYY}-{5 أرقام}` يولَّد في `createAIResource` (db.ts) إذا لم يُمرَّر serialNumber، باستخدام سنة الإنشاء + insertId.
- **createAIResource** في db.ts سطر 335 — يجب إضافة توليد تلقائي للرقم.
- **duplicateAIResource** db.ts سطر 354 — يولّد رقماً جديداً.
- **aiResources.create input** routers.ts سطر 371 — (اختياري serialNumber) يُمرَّر كما هو.
- **مواضع الحفظ**: routers.ts 822 (generateLesson) و1038 (generateAssessment) — تمرير examEndsAt في generateAssessment من input (يجب إضافة حقل examEndsAt لمدخل generateAssessment).
- **tRPC جديد**: `aiResources.getBySerial` (publicProcedure!) للتحقق — صفحة /verify العامة تصل إليه.
- **صفحة /verify**: عامة (public) — تعرض: صحيح/خاطئ، اسم الوثيقة، النوع، الأستاذ، التاريخ، حالة كشف الإجابات (للتقويم).
- **A4Print.tsx** (144 سطراً): أضف `serialNumber` و`examEndsAt` (timestampms) و`isExam` و`logo` إلى PrintMeta؛ QR verification يوضع أسفل يمين الترويسة؛ QR الإجابات يوضع في التقويم فقط.
- **QR verification URL**: `{origin}/verify?serial=NIBRAS-...` (رابط مباشر) — قبل الطباعة نستخدم window.location.origin أو نطبع رابط نصي تحت QR.
- **QR الإجابات المشفّر**: QR يوجه إلى `/verify/answer/{serial}` — الصفحة تقرأ answerRevealAt من DB؛ قبل الموعد تعرض رسالة «لم يحن وقت الكشف»، بعده تعرض محتوى محتوى resource content (مفتاح الإجابة). يجب procedure عام `aiResources.getAnswer` يعيد المحتوى فقط بعد الموعد (إلا إذا كان userId المالك).
  - أمان: الصفحة العامة تقرأ فقط content + serial + title + answerRevealAt عبر الإجراء العام.
- **الهوية البصرية**: شريط علوي ملون (أخضر→برتقالي) في .print-header-official + صورة الشعار في يمين الترويسة الرسمية (بجانب الجمهورية الجزائرية) + سطر «أصدرها نبراس | الرقم التسلسلي» في التذييل بجانب اسم نبراس.

## CSS موجود (index.css)
- .print-header-official (ترويسة رسمية)، .print-footer (تذييل: «نبراس — مساعد التدريس الذكي لأستاذ الاجتماعيات» + .print-page-num)
- print:hidden لعناصر الشاشة، print-only .print-hidden-screen
- إضافة: .print-header-bar (شريط ملون)، أبعاد شعار print-header-logo ~30mm

## باقي العمل
1. توليد رقم تسلسلي تلقائي في db.ts createAIResource/duplicateAIResource
2. إضافة examEndsAt + serialNumber لمدخلات aiResources.create/update وgenerateAssessment
3. إجراءات عامة: getBySerial، getAnswer (مشفرة بالوقت)
4. صفحة /verify و/verify/answer/:serial عامة + Route في App.tsx
5. تعديل A4PrintContent: شعار + رقم تسلسلي + QR تحقيق + QR إجابات (للـexams)
6. تمرير serial/QR لكل مواقع الطباعة: LessonDetail, Assessment, ResourceDetail, Inspector, PrintPreviewDialog
7. اختبارات: توليد الرقم، getBySerial، كشف الإجابات حسب الوقت
8. checkpoint + مزامنة GitHub

## روابط مهمة
- شعار: /manus-storage/nibras-logo_59482451.svg
- checkpoint الحالي: 22a45406 (قبل هذه المهمة)
- tests: 80/80 حتى الآن

## تحديث التقدم (20:55)
- db.ts: generateSerialNumber() + createAIResource يولّد serial تلقائياً (update بعد insert) + duplicateAIResource يولّد serial جديد. TypeScript نظيف.
- schema.ts: الأعمدة الثلاثة موجودة في mysqlTable (السطور 214-216). أعمدة DB مطابقة.
- routers.ts: generateAssessment يقبل examEndsAt ويحفظه بعد createAIResource (سطر 862 + 1050-1053). (أيضاً يجب توليد serial للموارد القديمة؟ لا حاجة — الجديدة فقط. لكن يمكن تحديث الموارد القديمة بـSQL لاحقاً إن رغب الأستاذ.)
- generateLesson (سطر ~825) يمرر عبر createAIResource المعدّل → serial يُولّد تلقائياً أيضاً.
- TODO التالي:
  1. إجراءان عامان جديدان في aiResources router: getBySerial وgetAnswer (مقارنة الآن بـanswerRevealAt/examEndsAt؛ يعيد المحتوى فقط بعد الموعد) — publicProcedure
  2. صفحة /verify (verify serial → title/type/teacher/createdAt + حالة كشف الإجابات)
  3. صفحة /verify/answer/:serial (تقرأ getAnswer — تعرض «لم يحن وقت الكشف» قبل الموعد)
  4. App.tsx: إضافة Route عامتين
  5. A4Print.tsx: شعار (URL /manus-storage/nibras-logo_59482451.svg) أعلى يمين الترويسة + QR تحقق أسفل يمين + QR إجابات (للـexam فقط مع examEndsAt) + سطر «الرقم التسلسلي» في التذييل. meta جديد: serialNumber, examEndsAt, logo (اختياري)
  6. تمرير serial/QR عبر كل الصفحات: LessonDetail/Assessment/ResourceDetail/Inspector (جلب serial من المورد عبر getById موجود) + PrintPreviewDialog (يشارك نفس A4PrintContent)
  7. ui.tsx التقويم: حقل «وقت نهاية الاختبار» (تاريخ+ساعة) عند توليد التقويم — تمرير examEndsAt (مطابق لوقت نهاية حصة الاختبار)
  8. اختبارات: generateSerialNumber، getBySerial، getAnswer قبل/بعد الموعد
  9. checkpoint + مزامنة GitHub (push github/main)
- tRPC client: trpc.aiResources.getBySerial.useQuery({serial})

## تحديث التقدم (20:56)
- routers.ts: أضفت getBySerial وgetAnswer (publicProcedure) داخل aiResources router بعد delete. استيراد getAIResourceBySerial أُضيف. TypeScript نظيف (0 أخطاء).
- Verify.tsx أُنشئ: /verify?serial=... (RTL، تحقق عام بحالة found/not-found، عرض نوع الوثيقة بالعربية، حالة كشف الإجابات locked/unlocked).
- TODO التالي:
  1. AnswerPage.tsx: /verify/answer/:serial → trpc.aiResources.getAnswer (locked → رسالة «لم يحن وقت الكشف» مع عداد؛ revealed → عرض content كـmarkdown)
  2. App.tsx: إضافة Route /verify (component=Verify) وRoute /verify/answer/:serial — ملاحظة: Verify خارج DashboardLayout (publicProcedure)؛ Route يجب أن تكون أعلى Route NotFound
  3. A4Print.tsx: شعار نبراس + QR تحقق (الزاوية) + serialNumber في التذييل + QR إجابات. الشعار رفعته: /manus-storage/nibras-logo_59482451.svg (تحقق من URL الصحيح في الويب). meta: {docTitle, institution?, teacher?, subject?, level?, duration?, date?, serialNumber?, examEndsAt?, answerQr?}
  4. مكتبة qrcode: تم تثبيتها (pnpm add qrcode) — استخدم qrcode.toDataURL
  5. الصفحات: LessonDetail/Assessment/ResourceDetail/Inspector تمرر serialNumber وexamEndsAt للـmeta — getById يرجع serialNumber لأن schema يحتوي العمود
  6. ui.tsx في assessment: حقل «وقت نهاية الاختبار» datetime-local يمرر examEndsAt (millis) لمولد generateAssessment
  7. اختبارات في routers.test.ts: generateSerialNumber، getBySerial، getAnswer locked/revealed
  8. checkpoint + مزامنة github/main

## تحديث التقدم (21:00)
- getBySerial + getAnswer (publicProcedure) في aiResources router يعملان.
- Verify.tsx (/verify?serial=) + AnswerPage.tsx (/verify/answer/:serial) + Routes في App.tsx قبل NotFound.
- A4Print.tsx: PrintMeta أضيف serialNumber + examEndsAt؛ الترويسة: شعار نبراس وسط أعلى (LOGO_URL = /manus-storage/nibras-logo_b2fa6fda.svg)؛ التذييل: شعار + QR تحقق + QR إجابات + serial.
- index.css: فئات print جديدة أضيفت داخل media print.
- usePrintQrCodes.ts hook (verification=/verify?serial=..., answer=/verify/answer/{serial} إن examEndsAt).
- LessonDetail: يجلب aiResources.list يطابق lessonId → serialNumber في printMeta.
- ResourceDetail: serialNumber + examEndsAt في resourcePrintMeta.
- Assessment.tsx: form.examEndsAt + currentResource (getById) + printMeta serial/examEndsAt. tsc: 0 أخطاء، 80/80 اختبار.

### المتبقي
1. Assessment.tsx: حقل UI «وقت نهاية الاختبار» (datetime-local) يمرر examEndsAt (millis) في payload.
2. فحص generateAssessment سطور ~1068-1090: التأكد أنه يمرر examEndsAt إلى createAIResource.
3. Inspector.tsx: serialNumber في inspectorPrintMeta.
4. اختبار generateSerialNumber في tests.
5. pnpm test + checkpoint + gh push إلى Dzogx/Nibras_dz main.

## الحالة النهائية (21:05 UTC 14 أغسطس)
- كل بنود QR مكتملة ومعلّمة [x] في todo.md
- checkpoint جديد: 92d4a36b (نظام الهوية البصرية ورموز QR)
- اختبارات 88/88 ناجحة، TypeScript نظيف
- /assessment يظهر حقل «وقت نهاية الاختبار (اختياري) — لرمز QR الإجابات»
- الموارد القديمة (ids 1-3) حصلت serialNumber عبر SQL: NIBRAS-2026-00001..00003
- /verify?serial=NIBRAS-2026-00003 يعرض «وثيقة صادرة عن منصة نبراس» (نوع: تقويم تحصيلي، لا ينطبق على نموذج الإجابات لأن examEndsAt=null)
- /verify/answer/NIBRAS-2026-00003 يعرض «نموذج الإجابات غير مفعّل» (لأن لا موعد نهاية)
- المسارات الصحيحة: /assessment، /content-library، /lessons، /verify
- المطلوب التالي من الأستاذ: إرسال عينات من الوثائق المطبوعة (سيتم إنتاج عينات PDF للمذكرة والتقويم والمكتبة والتفتيش)
- مزامنة GitHub مع Dzogx/Nibras_dz ما زالت معلقة بعد checkpoint 92d4a36b

---
## مهمة مطابقة نموذج الأستاذ (15 أغسطس)
نموذج الأستاذ محفوظ في /home/ubuntu/upload/IMG_20260815_010849.jpg وتحليله في /home/ubuntu/nibras/teacher_sample_analysis.md
التقدم الحالي:
1. [تم] A4Print.tsx: الترويسة أعيدت صياغتها بسطرين: سطر1 = (مديرية التربية لولاية X يمين / شعار نبراس وسط / متوسطة: X – المحادمة يسار / المستوى: أقصى يسار)، سطر2 = (اسم الوثيقة في مادة Y يمين / التاريخ يسار / المدة أقصى يسار)، صف الأستاذ(ة) يظهر فقط عند توفر teacherName. QR الإجابات نصه أصبح «أفحص الرمز للحصول على الإجابة النموذجية».
2. [تم] PrintPreviewDialog.tsx: طُبّقت الترويسة نفسها + تذييل مع serialNumber.
3. [تم] index.css: أضيف print-office-main (11.5pt/600) + print-header-far-left + فئات table في .print-body (حدود سوداء + رأس f1f5f9) + عناوين الأجزاء مخطوطة.
4. [تم] ResourceDetail.tsx: Streamdown مع controls={{ table: true }} لتفعيل جداول markdown (3 مواضع).
المتبقي:
- فحص كيف يُولّد محتوى التقويم (هل يحتوي جداول markdown أصلاً؟) — generate_sample_docs.mjs موجود في المشروع
- تحديث سكربت العينات generate_sample_docs.mjs للترويسة الجديدة وإعادة توليد عينات PDF
- تشغيل npx vitest run + npx tsc --noEmit
- حفظ checkpoint + مزامنة GitHub (remote github → Dzogx/Nibras_dz main، remote origin → artifacts)
- تسجيل أخطاء esbuild القديمة في devserver.log: schema.ts:193 (14 أغسطس 20:51) وrouters.ts:436 (14 أغسطس 20:54) — تبدو قديمة، يجب التأكد أنها غير حالية (tsc يقول 0 errors حالياً)
