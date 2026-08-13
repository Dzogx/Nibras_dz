# -*- coding: utf-8 -*-
"""إزالة إشارات «الوحدة» من تعليمات توليد المذكرات والتقويمات في الخلفية.
يُستبدل مفهوم الوحدة بمفهوم المقطع/الوضعية التعليمية (المخطط السنوي الرسمي)."""

R = "server/routers.ts"
content = open(R).read()

# 1. تعليمات توليد المذكرة: "- الوحدة: X" و"- رقم الوحدة: N" → الوضعية/المقطع
content = content.replace(
    '${input.unitTitle ? `- الوحدة: ${input.unitTitle}` : ""}\n',
    '${input.unitTitle ? `- الوضعية التعليمية: ${input.unitTitle}` : ""}\n',
)
content = content.replace(
    '${input.unitNumber ? `- رقم الوحدة: ${input.unitNumber}` : ""}\n',
    '${input.unitNumber ? `- رقم الوضعية في المقطع: ${input.unitNumber}` : ""}\n',
)

# 2. سياق الاستشهاد بالتقويم: "(الوحدة N)" → "(المقطع/الوضعية)" — نكتفي بعنوان الوثيقة
content = content.replace(
    "${doc.unitNumber ? ` (الوحدة ${doc.unitNumber})` : ''}",
    "",
)
content = content.replace(
    '[مرجع: رقم الوثيقة — عنوان الوثيقة — الوحدة/القسم]',
    '[مرجع: رقم الوثيقة — عنوان الوثيقة — المقطع]',
)
content = content.replace(
    'مثال: [مرجع: 1 — وثيقة المنهاج السنة الرابعة — الوحدة 3 — درس الثورة الجزائرية]',
    'مثال: [مرجع: 1 — وثيقة المنهاج السنة الرابعة — المقطع الثاني: التاريخ الوطني — درس الثورة الجزائرية]',
)

open(R, "w").write(content)
print("OK: routers.ts updated")
