# -*- coding: utf-8 -*-
"""إزالة حقول الوحدة (unitTitle/unitNumber) من واجهات المولّد وقوائم الدروس.
تُستبدل ببنية المخطط الرسمية: المقطع + الوضعية + الكفاءة."""
import re


def replace_file(path, old, new, required=True):
    content = open(path).read()
    if old not in content:
        print(f"SKIP (not found): {old[:60]} in {path}")
        return
    content = content.replace(old, new)
    open(path, "w").write(content)
    print(f"OK: {path} <- {old[:50]}")


LG = "client/src/pages/LessonGenerator.tsx"
LS = "client/src/pages/Lessons.tsx"
LD = "client/src/pages/LessonDetail.tsx"
AS = "client/src/pages/Assessment.tsx"

# --- LessonGenerator: إزالة "عنوان الوحدة" وحقل "رقم الوحدة" ---
# استبدال حقل عنوان الوحدة بـ"عنوان الوضعية التعليمية"
replace_file(
    LG,
    '<div><Label>عنوان الوحدة</Label>\n              <Input value={form.unitTitle} onChange={e => setForm({ ...form, unitTitle: e.target.value })} />',
    '<div><Label>عنوان الوضعية التعليمية</Label>\n              <Input value={form.unitTitle} onChange={e => setForm({ ...form, unitTitle: e.target.value })} placeholder="مثال: وثائق الفترة الاستعمارية (نشاط الوثائق)" />',
)
replace_file(
    LG,
    '<div><Label>رقم الوحدة</Label>\n                <Input type="number" value={form.unitNumber || ""} onChange={e => setForm({ ...form, unitNumber: e.target.value ? parseInt(e.target.value) : undefined })} />',
    '<div><Label>رقم الوضعية</Label>\n                <Input type="number" value={form.unitNumber || ""} onChange={e => setForm({ ...form, unitNumber: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="1" />',
)

# --- Lessons: إزالة "عنوان الوحدة" في نموذج الإضافة ---
replace_file(
    LS,
    '<div><Label>عنوان الوحدة</Label>\n                  <Input value={newLesson.unitTitle} onChange={e => setNewLesson({ ...newLesson, unitTitle: e.target.value })} />',
    '<div><Label>عنوان الوضعية التعليمية</Label>\n                  <Input value={newLesson.unitTitle} onChange={e => setNewLesson({ ...newLesson, unitTitle: e.target.value })} placeholder="مثال: نظام المطر الموسمي" />',
)

# --- LessonDetail: إزالة "عنوان الوحدة" في نموذج التعديل ---
replace_file(
    LD,
    '<div><Label>عنوان الوحدة</Label>\n            <Input value={editForm.unitTitle} onChange={e => setEditForm({ ...editForm, unitTitle: e.target.value })} />',
    '<div><Label>عنوان الوضعية التعليمية</Label>\n            <Input value={editForm.unitTitle} onChange={e => setEditForm({ ...editForm, unitTitle: e.target.value })} placeholder="مثال: الحياة الجماعية" />',
)

# --- Assessment: إزالة "(الوحدة N)" من الاستشهادات (الطباعة + الواجهة) ---
replace_file(
    AS,
    "${c.unitNumber ? ` (الوحدة ${c.unitNumber})` : ''}",
    "",
)
replace_file(
    AS,
    '{c.unitNumber ? ` (الوحدة ${c.unitNumber})` : ""}',
    "",
)

print("done")
