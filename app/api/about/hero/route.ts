import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface AboutSection {
  section_type: string;
  title: string | null;
  content: string | null;
  image: string | null;
}

function getFirstParagraph(html: string | null) {
  if (!html) return null;
  const match = html.match(/<p[^>]*>.*?<\/p>/i);
  return match ? match[0] : html;
}

export async function GET() {
  const data = await query<AboutSection>(
    `
    SELECT section_type, title, content, image
    FROM about_tab_sections
    WHERE tab_id = ?
    ORDER BY sort_order ASC
    `,
    [1]
  );

  const mapped = data.map((item) => ({
    ...item,
    content:
      item.section_type === "text"
        ? getFirstParagraph(item.content)
        : item.content,
  }));

  return NextResponse.json(mapped);
}
