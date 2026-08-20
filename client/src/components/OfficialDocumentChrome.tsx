import type { ReactNode } from "react";
import type { PrintMeta } from "@/components/A4Print";

type DocumentMeta = Omit<PrintMeta, "children">;

/**
 * الترويسة والتذييل المحايدان للوثائق الرسمية.
 * يستعملان في الطباعة ومعاينة A4 كي لا تنحرف المعاينة عن النسخة المطبوعة.
 */
export function OfficialDocumentHeader({ meta }: { meta: DocumentMeta }) {
  return (
    <header className="print-header-official" dir="rtl">
      <div className="print-masthead-grid">
        <div className="print-masthead-cell print-masthead-right">
          <span className="print-masthead-label">مديرية التربية</span>
          <strong>ولاية {meta.province || "..........................."}</strong>
        </div>
        <div className="print-state-emblem">
          <strong>الجمهورية الجزائرية الديمقراطية الشعبية</strong>
          <span>وزارة التربية الوطنية</span>
        </div>
        <div className="print-masthead-cell print-masthead-left">
          <span className="print-masthead-label">المؤسسة التعليمية</span>
          <strong>{meta.school || "......................................."}</strong>
          <small>{meta.levelSection ? `المستوى والقسم: ${meta.levelSection}` : "المستوى والقسم: ...................."}</small>
        </div>
      </div>

      <div className="print-document-band">
        <div className="print-document-kind">
          <span className="print-document-label">وثيقة بيداغوجية</span>
          <strong>
            {meta.title}
            {meta.subject ? <> في مادة {meta.subject}</> : null}
          </strong>
          {meta.extra ? <small>{meta.extra}</small> : null}
        </div>
        <dl className="print-document-facts">
          <div>
            <dt>التاريخ</dt>
            <dd>{meta.date || "........ / ........ / ........"}</dd>
          </div>
          <div>
            <dt>المدة</dt>
            <dd>{meta.duration || "......................."}</dd>
          </div>
        </dl>
      </div>

      {meta.teacherName ? (
        <div className="print-teacher-line">
          <span>الأستاذ(ة)</span>
          <strong>{meta.teacherName}</strong>
        </div>
      ) : null}

      {meta.subtitle ? (
        <div className="print-doc-title">
          <span>موضوع الوثيقة</span>
          <strong>{meta.subtitle}</strong>
        </div>
      ) : null}
    </header>
  );
}

export function OfficialDocumentFooter({
  title,
  subject,
  pageLabel,
  children,
}: {
  title: string;
  subject?: string;
  pageLabel?: string;
  children?: ReactNode;
}) {
  return (
    <footer className="print-footer print-footer-neutral" dir="rtl">
      <span className="print-footer-doc-type">
        {title}{subject ? <> — {subject}</> : null}
      </span>
      {children}
      {pageLabel ? <span className="print-page-label">{pageLabel}</span> : <span className="print-page-num" />}
    </footer>
  );
}
