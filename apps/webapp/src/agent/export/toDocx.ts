import * as docx from "docx";
import { CompiledBook } from "./compile";

// Robust Inline MD Text Tokenizer and Smart Suffix Formatter
function parseInlineText(text: string, forceBold = false, fontSize = 22): docx.Run[] {
  // Normalize dashes
  let cleanText = text
    .replace(/---/g, "\u2014")
    .replace(/--/g, "\u2014")
    // Convert to smart quotes
    .replace(/"([^"]*)"/g, "\u201C$1\u201D")
    .replace(/'([^']*)'/g, "\u2018$1\u2019");

  const runs: docx.Run[] = [];
  let i = 0;

  while (i < cleanText.length) {
    if (cleanText.startsWith("***", i)) {
      const end = cleanText.indexOf("***", i + 3);
      if (end !== -1) {
        runs.push(
          new docx.Run({
            text: cleanText.substring(i + 3, end),
            bold: true,
            italics: true,
            font: "Georgia",
            size: fontSize,
          })
        );
        i = end + 3;
        continue;
      }
    }
    if (cleanText.startsWith("**", i)) {
      const end = cleanText.indexOf("**", i + 2);
      if (end !== -1) {
        runs.push(
          new docx.Run({
            text: cleanText.substring(i + 2, end),
            bold: true,
            font: "Georgia",
            size: fontSize,
          })
        );
        i = end + 2;
        continue;
      }
    }
    if (cleanText.startsWith("*", i)) {
      const end = cleanText.indexOf("*", i + 1);
      if (end !== -1) {
        runs.push(
          new docx.Run({
            text: cleanText.substring(i + 1, end),
            italics: true,
            font: "Georgia",
            size: fontSize,
          })
        );
        i = end + 1;
        continue;
      }
    }
    if (cleanText.startsWith("_", i)) {
      const end = cleanText.indexOf("_", i + 1);
      if (end !== -1) {
        runs.push(
          new docx.Run({
            text: cleanText.substring(i + 1, end),
            italics: true,
            font: "Georgia",
            size: fontSize,
          })
        );
        i = end + 1;
        continue;
      }
    }

    // Capture standard segment until next formatting token
    let nextFormatting = cleanText.length;
    for (const token of ["***", "**", "*", "_"]) {
      const idx = cleanText.indexOf(token, i);
      if (idx !== -1 && idx < nextFormatting) {
        nextFormatting = idx;
      }
    }

    runs.push(
      new docx.Run({
        text: cleanText.substring(i, nextFormatting),
        font: "Georgia",
        size: fontSize,
        bold: forceBold || undefined,
      })
    );
    i = nextFormatting;
  }

  return runs;
}

export function buildDocxDocument(book: CompiledBook): docx.Document {
  const children: docx.FileChild[] = [];

  // 1. FRONT MATTER - TITLE PAGE
  children.push(
    new docx.Paragraph({
      children: [
        new docx.Run({
          text: book.title,
          bold: true,
          font: "Georgia",
          size: 56, // 28pt
        }),
      ],
      alignment: docx.AlignmentType.CENTER,
      spacing: { before: 2400, after: 240 }, // High vertical offset
    })
  );

  if (book.author) {
    children.push(
      new docx.Paragraph({
        children: [
          new docx.Run({
            text: `by ${book.author}`,
            font: "Georgia",
            size: 28, // 14pt
          }),
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 480, after: 1440 },
      })
    );
  }

  // Dedication Page (if specified)
  if (book.dedication) {
    children.push(
      new docx.Paragraph({
        children: [
          new docx.Run({
            text: book.dedication,
            italics: true,
            font: "Georgia",
            size: 24, // 12pt
          }),
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 2400 },
        pageBreakBefore: true,
      })
    );
  }

  // 2. CHAPTERS COMPILATION
  for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
    const ch = book.chapters[chapterIndex];

    // Chapter Header
    children.push(
      new docx.Paragraph({
        children: [
          new docx.Run({
            text: ch.title,
            bold: true,
            font: "Georgia",
            size: 36, // 18pt
          }),
        ],
        alignment: docx.AlignmentType.CENTER,
        spacing: { before: 1200, after: 720 },
        pageBreakBefore: true, // New page per chapter
      })
    );

    // Parse Chapter Body
    const paragraphs = ch.markdown.split(/\n\s*\n/);
    let isFirstParagraphAfterHeader = true;

    for (const pText of paragraphs) {
      const trimmed = pText.trim();
      if (!trimmed) continue;

      // Handle Headings in Markdown
      if (trimmed.startsWith("#### ")) {
        children.push(
          new docx.Paragraph({
            children: parseInlineText(trimmed.substring(5).trim(), true, 24), // 12pt bold
            spacing: { before: 240, after: 120 },
          })
        );
        isFirstParagraphAfterHeader = true;
        continue;
      }
      if (trimmed.startsWith("### ")) {
        children.push(
          new docx.Paragraph({
            children: parseInlineText(trimmed.substring(4).trim(), true, 26), // 13pt bold
            spacing: { before: 240, after: 120 },
          })
        );
        isFirstParagraphAfterHeader = true;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        children.push(
          new docx.Paragraph({
            children: parseInlineText(trimmed.substring(3).trim(), true, 28), // 14pt bold
            spacing: { before: 240, after: 120 },
          })
        );
        isFirstParagraphAfterHeader = true;
        continue;
      }
      if (trimmed.startsWith("# ")) {
        children.push(
          new docx.Paragraph({
            children: parseInlineText(trimmed.substring(2).trim(), true, 32), // 16pt bold
            spacing: { before: 240, after: 120 },
          })
        );
        isFirstParagraphAfterHeader = true;
        continue;
      }

      // Handle Blockquotes
      if (trimmed.startsWith("> ")) {
        children.push(
          new docx.Paragraph({
            children: parseInlineText(trimmed.substring(2).trim()),
            indent: { left: 720 }, // 0.5 inches left margin
            spacing: { before: 180, after: 180 },
            style: "Normal",
          })
        );
        isFirstParagraphAfterHeader = true;
        continue;
      }

      // Handle Scene Break Dividers
      if (trimmed === "* * *" || trimmed === "***" || trimmed === "---") {
        children.push(
          new docx.Paragraph({
            children: [
              new docx.Run({
                text: "",
                font: "Georgia",
                size: 24,
              }),
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 360, after: 360 },
          })
        );
        isFirstParagraphAfterHeader = true;
        continue;
      }

      // Standard prose block paragraph
      const runs = parseInlineText(trimmed);

      // Book design standard: The first paragraph of a chapter/scene should NOT be indented.
      // All subsequent prose paragraphs have a 0.3-inch first-line indent.
      const hasIndent = !isFirstParagraphAfterHeader;

      children.push(
        new docx.Paragraph({
          children: runs,
          alignment: docx.AlignmentType.LEFT,
          spacing: {
            before: 0,
            after: 0,
            line: 360, // 1.5x Line spacing
            lineRule: docx.LineRuleType.AUTO,
          },
          indent: hasIndent ? { firstLine: 432 } : undefined, // 432 dxa = 0.3 inches
        })
      );

      isFirstParagraphAfterHeader = false;
    }
  }

  return new docx.Document({
    creator: book.author || "Novelwrite compiler",
    title: book.title,
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}
