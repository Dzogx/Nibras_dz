import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const draftPath = resolve(process.cwd(), 'annual_schedule_2026_2027_draft.md');

function occurrences(text: string, fragment: string) {
  return text.split(fragment).length - 1;
}

describe('مسودة التدرج السنوي 2026–2027', () => {
  const draft = readFileSync(draftPath, 'utf8');

  it('تغطي مواد الاجتماعيات الثلاث في المستويات الأربعة', () => {
    expect(occurrences(draft, '## السنة')).toBe(12);

    for (const grade of ['الأولى', 'الثانية', 'الثالثة', 'الرابعة']) {
      for (const subject of ['التاريخ', 'الجغرافيا', 'التربية المدنية']) {
        expect(draft).toContain(`## السنة ${grade} متوسط — ${subject}`);
      }
    }
  });

  it('يثبت بداية أكتوبر ويحافظ على خانات الرزنامة غير المعلنة', () => {
    expect(draft).toContain('الأسبوع التعليمي 1: 5–9 أكتوبر 2026.');
    expect(occurrences(draft, '| [رزنامة معلقة] |')).toBe(36);
  });

  it('يلتزم بأسماء المقاطع المرجعية ولا يخترع وضعيات لتاريخ الرابعة', () => {
    for (const section of [
      'الوثائق التاريخية',
      'التاريخ الوطني',
      'التاريخ العام',
      'المجال الجغرافي',
      'السكان والتنمية',
      'السكان والبيئة',
      'الحياة الجماعية',
      'الحياة المدنية',
      'الحياة الديمقراطية ومؤسسات الجمهورية',
    ]) {
      expect(draft).toContain(section);
    }

    expect(draft).toContain('ملف 2022 لا يسمي وضعيات تفصيلية؛ لا يضاف عنوان غير موثق');
  });
});
