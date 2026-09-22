import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { CheckResult, DocumentRules, PageData } from "@/types";
import { checkChapterStartsNewPage } from "@/lib/pdf/checkChapterStartsNewPage";
import { checkMarginLeft } from "./checkMarginLeft";
import { checkFont } from "@/lib/pdf/checkFont";
import { checkLineSpacing } from "@/lib/pdf/checkLineSpacing";
import { checkFileSize } from "@/lib/pdf/checkFileSize";
import { checkFontSize } from "@/lib/pdf/checkFontSize";
import { checkPageSize } from "@/lib/pdf/checkPageSize";

const getMainFontSize = (pages: PageData[]): number | undefined => {
  const fontSizes = pages
    .flatMap((page) => page.textItems)
    .map((item) => item.fontSize)
    .filter((size) => size > 5 && size < 30);

  if (fontSizes.length === 0) {
    return undefined;
  }

  const groups = new Map<number, number>();

  for (const size of fontSizes) {
    const normalized = Math.round(size * 100) / 100;

    groups.set(normalized, (groups.get(normalized) ?? 0) + 1);
  }

  return [...groups.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

export const analyzePdf = async (
  file: File,
  documentRules: DocumentRules,
): Promise<CheckResult["pdf"]> => {
  const buffer = await file.arrayBuffer();

  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/standard_fonts/",
    ),
  }).promise;

  const pages: PageData[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    // possible bottleneck
    await page.getOperatorList();

    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const textItems = textContent.items
      .filter((item) => "str" in item && item.str.trim().length > 0)
      .map((item) => {
        if (!("str" in item)) return null;

        const [, , , , x, y] = item.transform;

        return {
          text: item.str,
          x,
          y,
          width: item.width,
          height: item.height,
          fontName: item.fontName,
          fontSize: Math.abs(item.transform[0]),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    pages.push({
      page: i,
      commonObjs: page.commonObjs,
      width: viewport.width,
      height: viewport.height,
      textItems,
    });
  }

  const mainFontSize = getMainFontSize(pages);

  const result: CheckResult["pdf"] = {
    pageSize: checkPageSize(pages, documentRules.pageSize),
    marginLeftMm: checkMarginLeft(
      pages,
      documentRules.marginLeftMm,
      documentRules.fontSize,
    ),
    fontFamily: checkFont(pages, documentRules.fontFamily),
    fontSize: checkFontSize(mainFontSize, documentRules.fontSize),
    lineSpacing: checkLineSpacing(
      pages,
      documentRules.lineSpacing,
      mainFontSize,
    ),
    maxFileSizeInMb: checkFileSize(file, documentRules.maxFileSizeInMb),
  };

  if (documentRules.chapterStartsNewPage) {
    result.chapterStartsNewPage = checkChapterStartsNewPage(pages);
  }

  return result;
};
