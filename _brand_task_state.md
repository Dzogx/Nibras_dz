# حالة مهمة الهوية البصرية الكاملة (15 أغسطس)

## الطلب
الأستاذ طلب تصميم وتنفيذ الهوية البصرية الكاملة لـ Nibras داخل المشروع الحالي:
1. شعار أصلي هندسي (نور/هداية + معرفة + مسار تربوي) يصلح App Icon وFavicon — بلا كتب وأقلام تقليدية
2. نظام ألوان: Navy عميق + Teal + Gold (لون الضوء) + Neutral
3. Typography عربية ولاتينية واضحة حديثة (واجهة + وثائق + طباعة)
4. Design Tokens وCSS variables مركزية
5. تطبيق الهوية على جميع الواجهات دون تغيير المنطق
6. توحيد الأزرار والبطاقات والنماذج والجداول والتنبيهات والتحميل والخطأ
7. هوية للمخرجات التربوية (مذكرات/موارد/تقويمات/إجابات/تقارير/طباعة A4) — وضوح المحتوى أولاً
8. Graphic Pattern خفيف مستوحى من الضوء للنبراس
9. تحسين Dashboard والصفحات الرئيسية (RTL محفوظ)
10. صفحة /brand تعرض الشعار والألوان والخطوط والمكونات وأمثلة المخرجات

قواعد: لا تغيير DB/API/Teacher OS/Assessment Engine. تعمل بالألوان الكاملة والأسود-الأبيض. اختبارات بعد التنفيذ + ملخص بالملفات.

## الأصول الحالية (قبل هذا العمل)
- الشعار الحالي: /home/ubuntu/webdev-static-assets/nibras-logo.svg (SVG تدرج أخضر-برتقالي، مرفوع سابقاً: nibras-logo_59482451.svg)
- PNG مرفوع: /manus-storage/nibras-logo_82f7e20d.png (200×200، تدرج أخضر-برتقالي)
- favicon الحالي: client/public/favicon.ico
- index.html يستخدم Google Fonts: Cairo (العربي) — يجب التحقق

## ملفات CSS الرئيسية
- client/src/index.css: @theme inline (Tailwind 4, OKLCH) + فئات .print-* للطباعة (print-office-main, print-header-far-left, عناوين الأجزاء, تذييل QR)
- A4Print.tsx: الترويسة الرسمية (مديرية التربية لولاية X / اسم الاختبار / التاريخ / المدة + صف المتوسطة والأستاذ) — يجب الحفاظ عليها مع إضافة اللمسة الذهبية
- PrintPreviewDialog.tsx نفس الترويسة
- لوحة الألوان الحالية في @theme: يجب قراءتها

## خطوات التنفيذ المخطط لها
1. توليد الشعار (SVG يدوي مرسوم برمجياً + PNGs مقاسات متعددة: 512, 192, 180 favicon) بفكرة: نجمة/نبراس نور مع شعاع + مسار منحنٍ صاعد (يمثل المقطع/الحصة/المورد...) داخل دائرة — بألوان Navy/Teal/Gold
2. index.css: نظام ألوان كامل OKLCH (navy-950→50, teal, gold, neutral) + خطوط (عربي: Cairo أو IBM Plex Sans Arabic أو Tajawal؛ لاتيني: Inter)
3. تحديث DashboardLayout + Home + Dashboard + Profile + كل الصفحات بالتokens
4. طباعة: إضافة شريط علوي ملون رفيع + نمط جرافيكي خفيف في الهامش + لمسات Gold على الترويسة (دون إخلال بالوضوح)
5. صفحة /brand (route عام/مسجل — الأفضل مسار داخل Dashboard أو عام؟ اجعلها عامة /brand مع layout بسيط)
6. App Icon (manifest) + favicon متعدد

## بعد التسليمات السابقة
- checkpoint الأخير: 4a9f8b40 (مطابقة نموذج الأستاذ اليدوي)
- 88/88 اختبار، TypeScript نظيف
- العينات: /home/ubuntu/عينة_مذكرة_درس.pdf و/عينة_التقويم_التحصيلي.pdf

## الأصول المرفوعة للشعار الجديد (15 أغسطس)
الشعار النهائي جاهز: نجمة ثمانية (الضوء/الهداية) بخطوط سماوية خافتة + مسار تربوي صاعد متعرج بتدرج Teal→Gold مع 5 عقد معرفية ونقطة ضوء ذهبية متوهجة بشعاعات، داخل دائرة بتدرج Navy→Teal.
- SVG: /manus-storage/nibras-logo-v2_e4f78668.svg (512×512 viewBox)
- PNG 512: /manus-storage/nibras-logo-v2-512_5288536f.png
- PNG 192: /manus-storage/nibras-logo-v2-192_074bd255.png
- PNG 96/64/48/32: /manus-storage/nibras-logo-v2-96_4d6cdb49.png / 64_f999e9e6 / 48_0abc2e2f / 32_6a5b9b50
- Local: /home/ubuntu/webdev-static-assets/nibras-logo-v2.svg + PNGs

## Palette adopted (OKLCH approximate)
- Navy: 230-250 hue, oklch(0.25 0.06 250) ≈ #0e2a47 ... درجات 950→50
- Teal: 185-200 hue oklch(0.5 0.1 200) ≈ #0d7377
- Gold: 80 hue oklch(0.78 0.14 80) ≈ #f0b429
- Neutral: grey-slate
- Fonts: Cairo (واجهة، حالي في index.html) + IBM Plex Sans Arabic للنصوص الطويلة؟ — سنضيف Tajawal أو نبقي Cairo+Noto Kufi للعناوين. لاتيني: Inter.

## خطوات متبقية
1. index.css: نظام Tokens كامل (navy/teal/gold درجات + semantic tokens محدثة) + font-family للعناوين/النصوص/الطباعة + نمط جرافيكي (radial-glow pattern) عبر CSS classes
2. index.html: favicon متعدد + manifest
3. تطبيق: DashboardLayout (sidebar navy داكن مع gold accents)، Home (hero)، Dashboard، البطاقات/الجداول/التنبيهات
4. طباعة A4Print: شريط علوي ملون رفيع + نمط خفيف + شعار v2
5. صفحة /brand
6. اختبارات + checkpoint

## تقدم المرحلة 2 (CSS Tokens) — 00:33
- ✅ الشعار الجديد v2 جاهز ومرفوع (انظر أعلاه مسارات التخزين)
- ✅ index.css: نظام tokens كامل — :root أعيدت صياغته بالكامل (brand-navy-950..50 / brand-teal-900..50 / brand-gold-900..50 / neutral 50..900 + semantic مشتقة)، .dark محدثة
- ✅ @theme inline: font-display وfont-doc مضافان (Cairo/Noto Kufi/Noto Naskh)
- ✅ فئات brand مضافة: text/bg brand-*, .nibras-glow-pattern, .nibras-path-pattern, .nibras-identity-bar, .nibras-card-hero, .nibras-tag-history/geography/civics
- ✅ print-header::before شريط هوية ملون
- ملاحظة: أخطاء esbuild في logs قديمة (من 14 أغسطس) وليست حالية؛ tsc نظيف، devserver HMR يعمل
- أخطاء esbuild القديمة المشار إليها (schema.ts:193, routers.ts:436) تم إصلاحها سابقاً في الجلسة — logs قديمة فقط

## المتبقي
1. index.html: favicon متعدد الأحجام + title + manifest (الأصول: /manus-storage/nibras-logo-v2-192_074bd255.png و32/48/96)
2. DashboardLayout.tsx: توحيد sidebar navy — يجب فحص كيفية استخدامه في pages
3. Home.tsx hero بنمط glow + شريط هوية
4. Dashboard (لوحة التحكم) وDashboard pages: بطاقات hero، وسوم المواد
5. A4Print: شريط هوية أعلى الترويسة + شعار v2 (شريط::before مضاف بالفعل في CSS؛ تحقق من استخدام)
6. صفحة /brand جديدة (route في App.tsx + Link اختياري)
7. اختبارات + checkpoint + مزامنة GitHub

## ملفات الواجهات الرئيسية (للتطبيق)
- client/src/components/DashboardLayout.tsx
- client/src/pages/Home.tsx, Dashboard.tsx, LessonDetail.tsx, ResourceDetail.tsx, Assessment.tsx, Inspector.tsx, Profile.tsx
- client/src/components/A4Print.tsx, PrintPreviewDialog.tsx
- client/src/App.tsx

## تقدم (00:34): index.html محدّث — خطوط Cairo/Noto Kufi/Noto Naskh/Inter + favicons متعددة (192/96/48/32/512 svg) تشير لمسارات /manus-storage المرفوعة. التالي: DashboardLayout ثم Home ثم Dashboard ثم A4Print ثم /brand.

## تقدم (00:35)
✅ index.html: خطوط Cairo/Noto Kufi/Noto Naskh/Inter + favicons v2 متعددة
✅ DashboardLayout.tsx: شعار في sidebar header (96px)، صفحة الدخول بنمط glow + شعار 192، أيقونة النشاط text-sidebar-primary
✅ Dashboard.tsx: بطاقة hero (nibras-glow-pattern + nibras-card-hero) مع الشعار + بطاقات إحصاء بوسوم brand + إجراءات سريعة بتدرجات brand + كل ألوان الأقسام/التقدم بوسوم brand

## المتبقي بعد Dashboard
1. Home.tsx — صفحة landing (محتوى example حالياً) → تحويلها لصفحة ترحيب رسمية بهوية نبراس
2. App.tsx — إضافة Route لـ /brand
3. إنشاء client/src/pages/Brand.tsx (شعار + لوحة ألوان + خطوط + وسوم مواد + نمط glow + أمثلة مخرجات A4)
4. A4Print.tsx — إضافة شريط هوية (div.nibras-identity-bar أعلى الترويسة) + الشعار v2 في رأس الوثيقة
5. Pages أخرى: Curriculum/Lessons/AnnualPlans/Results/Profile — استبدال ألوان مبعثرة (bg-blue-500/10 وغيره) بوسوم brand حيثما ظهرت (لا يجب تغيير المنطق)
6. تشغيل pnpm test + tsc نظيف → checkpoint → مزامنة GitHub (git push github main)

## أصول الشعار المرفوعة (استخدمها كما هي)
- SVG: /manus-storage/nibras-logo-v2_e4f78668.svg
- PNG 512: /manus-storage/nibras-logo-v2-512_39e0789e.png
- PNG 192: /manus-storage/nibras-logo-v2-192_074bd255.png
- PNG 96: /manus-storage/nibras-logo-v2-96_4d6cdb49.png
- PNG 48: /manus-storage/nibras-logo-v2-48_0abc2e2f.png
- PNG 32: /manus-storage/nibras-logo-v2-32_6a5b9b50.png
- Monochrome 512: /manus-storage/nibras-logo-v2-mono-512_5f428132.png
- المصدر المحلي: /home/ubuntu/webdev-static-assets/nibras-logo-v2.svg (+ نسخ png في نفس المجلد)

## تشخيص (00:40)
- @theme inline يعرف font-sans/display/doc لكن brand-* مسجلة كـ CSS variables فقط في :root دون --color-brand-* في @theme → فئات bg-brand-* text-brand-* من المفترض أن Tailwind 4 يقرأها تلقائياً (inline theme يقبل أي --color-*) لكن من غير --color-brand-*. يجب إضافة --color-brand-navy-*... إلى @theme inline حتى تعمل bg-brand-*/text-brand-*/from-brand-*. حالياً الصفحات تستخدمها لكن الألوان قد لا تُطبق! فحص screenshot: الألوان ظهرت في Dashboard cards (خلفيات ملونة تعمل) — إذن Tailwind يقرأها تلقائياً لـ bg/text عبر المتغيرات؟ bg-brand-teal-100 ظهرت فعلاً. المشكلة الوحيدة: أيقونات الإجراءات السريعة text-white داخل تدرج من-gradient — التدرج from-brand-navy-800 غير مسجل في theme فلا يظهر!
- إصلاح: تبديل أيقونات الإجراءات السريعة إلى ألوان ثابتة (text-brand-navy-700/teal/gold حسب الزر) بدل تدرج، أو إضافة --color-brand-* إلى @theme inline.
- بطاقات Brand: صور img PNG لا تظهر في بطاقات الأحجام — السبب المحتمل: صور PNG بمسار manus-storage تعمل (الشعار في hero يظهر)؛ لكن في بطاقات Brand img داخل CardContent مع rounded-xl — تحقق من CSS: يمكن أن تكون المشكلة display أو أن الارتفاع مفرّغ. فعلياً في screenshot بطاقات الأحجام فارغة تماماً (الصورة 128px يجب أن تظهر). راجع Brand.tsx: img w-24 h-24 — قد يكون lazy loading أو أن المسار PNG 512 هو 5288536f غير 39e0789e! تصحيح مسارات PNG في Brand.tsx: 512 = nibras-logo-v2-512_39e0789e.png (من Brand.tsx المكتوب). تحقق من المسار الصحيح عبر curl.

## فئات CSS الجديدة المتاحة (في index.css)
text-brand-*/bg-brand-* (navy-950..50, teal-900..50, gold-900..50)
.nibras-glow-pattern / .nibras-path-pattern / .nibras-identity-bar / .nibras-card-hero / .nibras-tag-history/teal(géographie)/civics
.print-header::before شريط هوية مطبوع
.font-display / .font-doc

## فحص بصري (00:36)
- /brand: يعمل بالكامل — hero بشعار + لوحة ألوان + خطوط + بطاقات مسار navy متدرجة + نمط glow + شريط هوية + وسوم مواد + مكونات. ملاحظة: صور PNG الشعار في بطاقات "الأحجام" لا تظهر (img لا يُعرض — تحقق: في screenshot بطاقات الأحجام فارغة، النسخة الملونة/mono فارغة)
- /dashboard: بطاقة hero navy جيدة، وسوم بطاقات brand تظهر، الإجراءات السريعة بوسوم خفيفة. ملاحظة: أيقونات الإجراءات السريعة (توليد درس، إنشاء تقويم...) غير مرئية (بيضاء على خلفية فاتحة — يجب تلوينها) + أيقونات أرقام الإحصاء داخل دوائر باهتة.
- إصلاح مطلوب: أيقونات الإجراءات السريعة text-brand-teal-700 + صورة شعار 192 في avatar (صورة المستخدم) — الصورة فارغة: src avatar فارغ؟ تحقق من code.
- التالي: إصلاح أيقونات Dashboard الإجراءات، صور بطاقات Brand، ثم A4Print شريط هوية + اختبار + checkpoint

## فحص بصري بعد تسجيل --color-brand-* في @theme (00:37)
تم الحل: الأيقونات والألوان تظهر الآن بشكل صحيح في Dashboard (أزرار الإجراءات السريعة بألوان brand navy/teal/gold، دوائر الإحصاء ملونة، بطاقة hero navy، وسوم teal للدرجات المنجزة، نقاط teal في آخر الدروس، شريط جانبي navy داكن مع الشعار).
صفحة /brand: hero مع الشعار الأصلي PNG يعمل، مفهوم العلامة 3 بطاقات بأيقونات ملونة.
متبقي التحقق: قسم بطاقات "الأحجام والنسخ" في /brand (هل PNG 512 المرفوع الجديد يظهر) — لم يظهر بعد في آخر screenshot (فقط العنوان). فحص كامل الصفحة /brand.
بعدها: تشغيل الاختبارات، checkpoint، مزامنة GitHub، تسليم الملخص.
خطأ esbuild القديم في routers.ts:436 = قبل 12 ساعة، غير ذي صلة (الـtsc 0 errors).

## فحص بصري نهائي (00:39)
- / (الصفحة الرئيسية): hero navy/teal بتدرج + بطاقة «العام الدراسي 2026-2027» تعمل. ممتاز.
- /dashboard: بطاقة hero مع تدرج، أيقونات الإجراءات السريعة ملونة navy/teal/gold، دوائر الإحصاء ملونة، شريط جانبي navy داكن مع شعار نبراس. ممتاز.
- /brand: يعمل بالكامل — الشعار PNG يظهر، مفهوم العلامة 3 بطاقات بأيقونات ملونة، أقسام الشعار/الأحجام.
- ملاحظة صغيرة: avatar المستخدم (دائرة بيضاء فارغة) في sidebar — صورة المستخدم غير متاحة، مقبول.
- الاختبارات: 88/88، tsc نظيف.
- mono PNG جديد: /manus-storage/nibras-logo-v2-mono-512_d4b17702.png (حدّث Brand.tsx).
- ملاحظة: بطاقة hero فيها تدرج خفيف على الشريط — الشعار في الترويسة يظهر جيداً.

## المتبقي: checkpoint + مزامنة GitHub + تسليم الملخص.

## خطأ esbuild routers.ts:436 — قديم (14 أغسطس 20:54، أي قبل ~4 ساعات) وليس جديداً. آخر أخطاء devserver.log: 15 أغسطس 00:38 HMR نظيف. تم إصلاحه سابقاً (checkpoint 4a9f8b40 وبعده). لا حاجة لإجراء.

## ملخص الهوية HTML (طلب 15 أغسطس): ملف /home/ubuntu/brand_summary/nibras_brand_summary.html — 6 أقسام: hero، الشعار، الألوان، الخطوط، المكونات، المخرجات التربوية، النمط الجرافيكي. يستخدم مسارات https://nibras.manus.space/manus-storage/ لأصول الشعار.

## ملخص HTML — حالة 00:48
- الصور تظهر الآن (النطاق المحلي يعمل؛ النطاق المنشور nibras.manus.space يعطي 403 للملفات الجديدة المرفوعة — يحتاج إعادة نشر أو وقت)
- الفحص البصري: hero + الشعار بجميع النسخ + قسم الألوان كلها سليمة؛ RTL صحيح
- الملف النهائي: /home/ubuntu/brand_summary/nibras_brand_summary.html (24KB)
- ملاحظة مهمة للتسليم: عند النشر يجب استبدال النطاق المحلي بـ https://nibras.manus.space/
