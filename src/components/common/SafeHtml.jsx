// ✅ FILE: src/components/common/SafeHtml.jsx
// - ✅ Safe render for stored HTML from RichTextEditor

import React, { useMemo } from "react";
import DOMPurify from "dompurify";

export default function SafeHtml({ html, className = "" }) {
  const clean = useMemo(() => DOMPurify.sanitize(html || ""), [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
