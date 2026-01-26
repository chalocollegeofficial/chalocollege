// ✅ FILE: src/components/common/RichTextEditor.jsx
// - </> (code-block) removed
// - ✅ Font dropdown added
// - ✅ Text Size dropdown added
// - ✅ Fonts + Sizes registered (Quill whitelist)
// - ✅ Tailwind-ish wrapper styling

import React, { useEffect, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function RichTextEditor({ value, onChange, placeholder }) {
  // ✅ Register fonts + sizes (whitelist) once
  useEffect(() => {
    const Quill = ReactQuill.Quill;

    // ✅ Fonts
    const Font = Quill.import("formats/font");
    Font.whitelist = [
      "arial",
      "times-new-roman",
      "georgia",
      "poppins",
      "inter",
      "monospace",
    ];
    Quill.register(Font, true);

    // ✅ Sizes (Quill default labels)
    const Size = Quill.import("formats/size");
    Size.whitelist = ["small", "normal", "large", "huge"];
    Quill.register(Size, true);
  }, []);

  // ✅ Toolbar (NO code-block)
  const toolbarOptions = useMemo(
    () => [
      [{ font: ["arial", "times-new-roman", "georgia", "poppins", "inter", "monospace"] }],
      [{ size: ["small", "normal", "large", "huge"] }],
      [{ header: [1, 2, 3, false] }],

      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote"],
      ["link"],
      ["clean"],
    ],
    []
  );

  const modules = useMemo(() => ({ toolbar: toolbarOptions }), [toolbarOptions]);

  const formats = useMemo(
    () => [
      "font",
      "size",
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "blockquote",
      "link",
      // ❌ code-block removed
    ],
    []
  );

  return (
    <div className="bg-white rounded border">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || "Write here..."}
        modules={modules}
        formats={formats}
      />

      {/* ✅ Font classes for Quill */}
      <style>{`
        .ql-font-arial { font-family: Arial, Helvetica, sans-serif; }
        .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif; }
        .ql-font-georgia { font-family: Georgia, serif; }
        .ql-font-poppins { font-family: Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
        .ql-font-inter { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
        .ql-font-monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

        /* ✅ editor height better */
        .ql-container { min-height: 180px; }
      `}</style>
    </div>
  );
}
