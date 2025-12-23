// components/RichTextEditor.tsx
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Code,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  parentDisabled?: boolean;
}

// ✅ KOMPONEN DIPINDAHKAN KELUAR DARI RENDER FUNCTION
const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  active = false,
  children,
  title,
  disabled = false,
  parentDisabled = false,
}) => (
  <button
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-200 ${
      active ? "bg-gray-300" : ""
    } ${disabled || parentDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
    disabled={disabled || parentDisabled}
    title={title}
  >
    {children}
  </button>
);

const ToolbarDivider: React.FC = () => (
  <div className="w-px h-6 bg-gray-300 mx-1" />
);

// ✅ KOMPONEN UTAMA
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis konten di sini...",
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        listItem: {
          HTMLAttributes: {
            class: "ml-4",
          },
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-6",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-6",
        },
      }),
      ListItem,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !disabled,
  });

  if (!editor) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
          parentDisabled={disabled}
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
          parentDisabled={disabled}
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
          parentDisabled={disabled}
        >
          <Strikethrough size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Code"
          parentDisabled={disabled}
        >
          <Code size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
          parentDisabled={disabled}
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
          parentDisabled={disabled}
        >
          <Heading2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
          parentDisabled={disabled}
        >
          <Heading3 size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
          parentDisabled={disabled}
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
          parentDisabled={disabled}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Quote"
          parentDisabled={disabled}
        >
          <Quote size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          parentDisabled={disabled}
        >
          <Undo size={18} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          parentDisabled={disabled}
        >
          <Redo size={18} />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Custom Styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror p {
          margin: 0.75em 0;
          line-height: 1.6;
        }

        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
          line-height: 1.2;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.83em 0 0.5em 0;
          line-height: 1.3;
        }

        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
          line-height: 1.4;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.75em 0;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ul ul {
          list-style-type: circle;
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        .ProseMirror ul ul ul {
          list-style-type: square;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror ol ol {
          list-style-type: lower-alpha;
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }

        .ProseMirror ol ol ol {
          list-style-type: lower-roman;
        }

        .ProseMirror li {
          margin: 0.25em 0;
          line-height: 1.6;
        }

        .ProseMirror li p {
          margin: 0.25em 0;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }

        .ProseMirror code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: "Courier New", monospace;
          font-size: 0.9em;
          color: #dc2626;
        }

        .ProseMirror pre {
          background: #1f2937;
          color: #f9fafb;
          font-family: "Courier New", monospace;
          padding: 0.75em 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 1em 0;
        }

        .ProseMirror pre code {
          background: none;
          color: inherit;
          font-size: 0.875em;
          padding: 0;
        }

        .ProseMirror strong {
          font-weight: 700;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}