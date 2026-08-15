/**
 * سكربت توليد عينات وثائق معاينة — للاستخدام الداخلي فقط.
 * يجلب الموارد الموجودة في قاعدة البيانات ويولّد صفحات HTML بنفس تصميم A4Print
 * (ترويسة رسمية + تذييل + شعار + QR) ثم نحفظها كـ HTML ليحولها weasyprint إلى PDF.
 */
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.ts";
import { drizzle } from "drizzle-orm/mysql2";
import { writeFile } from "node:fs/promises";
import QRCode from "qrcode";
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn, { schema, mode: "planetscale" });

const assets = await db.select().from(schema.aiResources).orderBy(schema.aiResources.id).limit(20);
console.log("resources:", assets.map((a) => ({ id: a.id, type: a.resourceType, title: (a.title || "").slice(0, 40), serial: a.serialNumber, examEndsAt: a.examEndsAt })));

const LOGO = "/manus-storage/nibras-logo_59482451.svg";

// استخراج المحتوى الفعلي — من القائمة المحمّلة سابقاً
// المورد 1 = مذكرة درس، المورد 3 = تقويم تحصيلي
const targetLesson = assets.find((a) => a.id === 1);
const targetExam = assets.find((a) => a.id === 3);
const lessonContent = targetLesson?.content || "";
const examContent = targetExam?.content || "";
const lessonSerial = targetLesson?.serialNumber;
const examSerial = targetExam?.serialNumber;
const examEndsAt = targetExam?.examEndsAt;
console.log("lesson serial:", lessonSerial, "exam serial:", examSerial, "examEndsAt:", examEndsAt);

// توليد QR
const siteOrigin = "https://nibras-ez8g2hkh.manus.space";
const lessonQrVerify = await QRCode.toDataURL(`${siteOrigin}/verify?serial=${lessonSerial}`, { width: 120, margin: 1 });
const examQrVerify = await QRCode.toDataURL(`${siteOrigin}/verify?serial=${examSerial}`, { width: 120, margin: 1 });
let examQrAnswer = "";
if (examEndsAt) {
  examQrAnswer = await QRCode.toDataURL(`${siteOrigin}/verify/answer/${examSerial}`, { width: 120, margin: 1 });
}

function buildHtml({ title, meta, content, qrVerify, qrAnswer, skipHeaderLines = 0 }) {
  const lines = content.split("\n").slice(skipHeaderLines);
  // إصلاح bold عبر أسطر متعددة: دمج أزواج ** المفتوحة والمغلقة عبر الأسطر
  let merged = lines.join("\n");
  merged = merged.replace(/\*\*([\s\S]*?)\*\*/g, "**$1**");
  // معالجة bold اليدوي للعبارات الممتدة على أسطر متعددة
  let inBold = false;
  const boldLines = merged.split("\n").map((line) => {
    const open = (line.match(/\*\*/g) || []).length;
    if (open % 2 === 1) {
      line = line.replace(/\*\*/g, inBold ? "</b>" : "<b>");
      inBold = !inBold;
      return line;
    }
    return line.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  });
  // معالجة الجداول: تجميع الأسطر المتجاورة التي تبدأ بـ | في كتل جدول
  const blocks = [];
  let tableRows = [];
  for (const line of boldLines) {
    const t = line.trim();
    if (/^\|/.test(t)) {
      if (/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(t)) continue; // سطر الفاصل يُتجاهل
      tableRows.push(t);
    } else {
      if (tableRows.length) { blocks.push(makeTable(tableRows)); tableRows = []; }
      blocks.push(line);
    }
  }
  if (tableRows.length) blocks.push(makeTable(tableRows));
  function makeTable(rows) {
    const parseCells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const cells = parseCells(rows[0]);
    const heads = rows.length > 2 && /^-/.test(rows[1]) ? null : null;
    const bodyRows = rows.filter((r) => !/^\|\s*-/.test(r));
    const th = bodyRows.length > 1 ? parseCells(bodyRows.shift()) : null;
    return "<table class='doc-table'>" + (th ? "<tr>" + th.map((c) => `<th>${c.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</th>`).join("") + "</tr>" : "") +
      bodyRows.map((r) => "<tr>" + parseCells(r).map((c) => `<td>${c.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</td>`).join("") + "</tr>").join("") + "</table>";
  }
  const body = blocks
    .map((block) => {
      if (typeof block === "string" && block.startsWith("<table")) return block;
      const line = block;
      const t = line.trim();
      if (t === "---" || t === "") return `<p class="doc-empty">&nbsp;</p>`;
      const clean = t.replace(/^-\s+/, "");
      if (/^####\s+/.test(clean)) return `<h3 class="doc-h3">${clean.slice(4)}</h3>`;
      if (/^###\s+/.test(clean)) return `<h3 class="doc-h3">${clean.slice(3)}</h3>`;
      if (/^##\s+/.test(clean)) return `<h2 class="doc-h2">${clean.slice(2)}</h2>`;
      if (/^#\s+/.test(clean)) return `<h1 class="doc-h1">${clean.slice(1)}</h1>`;
      return `<p class="doc-p">${clean.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")}</p>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { font-family: 'Noto Naskh Arabic', 'Amiri', serif; margin: 0; }
.page { width: 210mm; min-height: 297mm; padding: 12mm 14mm 20mm; position: relative; page-break-after: always; }
.header-bar { height: 4mm; background: linear-gradient(to left, #15803d, #ea580c); border-radius: 0 0 3mm 3mm; }
.official-header { margin-top: 4mm; }
.header-row { display: flex; align-items: center; justify-content: space-between; padding: 2mm 0; }
.header-row + .header-row { border-top: 0.5mm solid #1e3a8a; }
.header-row .cell { font-size: 10.5pt; font-weight: 600; color: #111; }
.header-row .cell-left { text-align: left; }
.header-center { text-align: center; flex: 1; padding: 0 4mm; }
.header-center .logo { height: 14mm; }
.meta-table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 9pt; }
.meta-table td { border: 0.2mm solid #999; padding: 1.2mm 2mm; }
.meta-table td.key { background: #eef3fb; font-weight: bold; width: 22mm; color: #1e3a8a; }
.doc-h1 { font-size: 13pt; color: #1e3a8a; border-bottom: 0.3mm solid #15803d; padding-bottom: 1mm; }
.doc-h2 { font-size: 11pt; color: #15803d; margin-top: 4mm; }
.doc-h3 { font-size: 10pt; color: #374151; }
.doc-p { font-size: 10pt; line-height: 1.85; margin: 1mm 0; text-align: justify; }
.doc-table { border-collapse: collapse; width: 100%; margin: 3mm 0; font-size: 9.5pt; }
.doc-table th, .doc-table td { border: 0.3mm solid #000; padding: 1.5mm 2mm; text-align: right; vertical-align: top; }
.doc-table th { background: #f1f5f9; font-weight: 700; }
.doc-empty { height: 4mm; }
.footer { position: absolute; bottom: 8mm; right: 14mm; left: 14mm; border-top: 0.4mm solid #1e3a8a; padding-top: 2mm; font-size: 7.5pt; color: #555; display: flex; justify-content: space-between; align-items: center; }
.footer .issuance { display: flex; align-items: center; gap: 2mm; }
.footer .issuance img { height: 7mm; }
.footer .qr-row { display: flex; gap: 4mm; align-items: flex-end; }
.footer .qr-item { text-align: center; }
.footer .qr-item img { width: 14mm; height: 14mm; }
.footer .qr-item .lbl { font-size: 6pt; }
</style>
</head>
<body>
<div class="page">
  <div class="header-bar"></div>
  <div class="official-header">
    <div class="header-row">
      <div class="cell">مديرية التربية لولاية ${meta.wilaya || "..........................."}</div>
      <div class="header-center"><img class="logo" src="${LOGO}" alt="نبراس"/></div>
      <div class="cell cell-left">متوسطة: ${meta.institution} – المحادمة</div>
      <div class="cell cell-left">المستوى: ${meta.level}</div>
    </div>
    <div class="header-row">
      <div class="cell">${title} ${meta.subject ? "في مادة: " + meta.subject : ""}</div>
      <div class="cell cell-left">التاريخ: ${meta.date}</div>
      <div class="cell cell-left">المدة: ${meta.duration}</div>
    </div>
    <div class="header-row">
      <div class="cell" style="font-size: 9.5pt;">الأستاذ(ة): ${meta.teacher}</div>
      <div class="cell cell-left"></div>
      <div class="cell cell-left"></div>
    </div>
  </div>
  <div class="doc-body">${body}</div>
  <div class="footer">
    <div class="issuance">
      <img src="${LOGO}" alt="نبراس"/>
      <div>أصدرها منصة <b>نبراس</b> — مساعد التدريس الذكي لأستاذ الاجتماعيات<br/>الرقم التسلسلي: <b dir="ltr">${meta.serial}</b></div>
    </div>
    <div class="qr-row">
      <div class="qr-item"><img src="${qrVerify}"/><div class="lbl">تحقق من الوثيقة</div></div>
      ${qrAnswer ? `<div class="qr-item"><img src="${qrAnswer}"/><div class="lbl">أفحص الرمز للحصول على الإجابة النموذجية</div></div>` : ""}
    </div>
  </div>
</div>
</body>
</html>`;
}

const lessonHtml = buildHtml({
  title: "مذكرة درس",
  meta: { teacher: "الهاشمي عبيدلي", institution: "متوسطة التجارب", wilaya: "ورقلة", subject: "التاريخ والجغرافيا", level: "السنة الرابعة متوسط", duration: "ساعة ونصف", date: "2026/08/14", serial: lessonSerial },
  content: lessonContent,
  qrVerify: lessonQrVerify,
});

const examHtml = buildHtml({
  title: "اختبار الفصل الأول — تقويم تحصيلي",
  meta: { teacher: "الهاشمي عبيدلي", institution: "متوسطة التجارب", wilaya: "ورقلة", subject: "التاريخ والجغرافيا", level: "السنة الرابعة متوسط", duration: "ساعة ونصف", date: "2026/08/14", serial: examSerial },
  content: examContent,
  skipHeaderLines: 7,
  qrVerify: examQrVerify,
  qrAnswer: examQrAnswer,
});

await writeFile("/home/ubuntu/sample_docs/lesson_sample.html", lessonHtml, "utf8");
await writeFile("/home/ubuntu/sample_docs/exam_sample.html", examHtml, "utf8");
console.log("HTML written. lesson serial:", lessonSerial, "| exam serial:", examSerial);
await conn.end();
