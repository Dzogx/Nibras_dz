/**
 * MarkdownRenderer — مصيّر Markdown داخلي خفيف للنصوص التربوية المولدة.
 *
 * يعالج النصوص المولدة (مذكرات، تقويمات، موارد) التي تصل كـMarkdown خام
 * ويعرضها منسقةً: عناوين، قوائم، جداول، نص جريء/مائل، فقرات — مع دعم RTL كامل.
 *
 * لا يعتمد على مكتبات خارجية (لا ReactMarkdown) لضمان سرعة الحمل وسهولة
 * الطباعة A4 والتحكم الكامل في التنسيق العربي.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFormat(s: string): string {
  // Bold / Italic / `code`
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code dir='ltr'>$1</code>");
}

/**
 * تحويل Markdown إلى HTML (سطر واحد).
 */
function convertMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;

  const flushTable = (rows: string[]) => {
    if (rows.length < 2) {
      rows.forEach((r) => out.push(`<p>${inlineFormat(escapeHtml(r))}</p>`));
      return;
    }
    const parseRow = (r: string) =>
      r
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
    const header = parseRow(rows[0]);
    const isSep = (r: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(r);
    const body = rows.slice(1).filter((r) => !isSep(r));
    out.push("<table>");
    out.push("<thead><tr>");
    header.forEach((c) => out.push(`<th>${inlineFormat(escapeHtml(c))}</th>`));
    out.push("</tr></thead><tbody>");
    body.forEach((r) => {
      const cells = parseRow(r);
      out.push("<tr>");
      cells.forEach((c) => out.push(`<td>${inlineFormat(escapeHtml(c))}</td>`));
      out.push("</tr>");
    });
    out.push("</tbody></table>");
  };

  while (i < lines.length) {
    let line = lines[i];

    // Table block
    if (/^\|/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      flushTable(rows);
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      out.push(`<h${h[1].length}>${inlineFormat(escapeHtml(h[2].trim()))}</h${h[1].length}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      out.push("<ul>");
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        out.push(`<li>${inlineFormat(escapeHtml(lines[i].replace(/^\s*[-*]\s+/, "")))}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      out.push("<ol>");
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        out.push(`<li>${inlineFormat(escapeHtml(lines[i].replace(/^\s*\d+[.)]\s+/, "")))}</li>`);
        i++;
      }
      out.push("</ol>");
      continue;
    }

    // Paragraph (non-empty)
    if (line.trim() !== "") {
      out.push(`<p>${inlineFormat(escapeHtml(line.trim()))}</p>`);
    }
    i++;
  }

  return out.join("");
}

interface MarkdownRendererProps {
  /** نص Markdown الخام */
  source: string;
  className?: string;
  /** عند true تُخفى العناوين الكبيرة (تستخدم داخل أوراق الطباعة حيث العناوين جزء من الهيكل) */
  compact?: boolean;
}

/**
 * عارض Markdown منسق — الاستبدال المباشر عن عرض النص الخام.
 */
export function MarkdownRenderer({ source, className, compact }: MarkdownRendererProps) {
  const html = convertMarkdown(source ?? "");
  return (
    <div
      className={cn("md-render", compact ? "md-render--compact" : "", className)}
      dir="rtl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function cn(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}
