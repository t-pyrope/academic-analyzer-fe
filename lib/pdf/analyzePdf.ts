import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFObjects } from "pdfjs-dist/types/src/display/pdf_objects";
import { CheckResult, DocumentRules, PdfCheckResult } from "@/app/types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const TOLERANCE = 2;

interface PageData {
  page: number;
  width: number;
  height: number;
  commonObjs: PDFObjects;
  textItems: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    fontSize: number;
  }[];
}

const isA4 = (width: number, height: number): boolean => {
  const portrait =
    Math.abs(width - A4_WIDTH) <= TOLERANCE &&
    Math.abs(height - A4_HEIGHT) <= TOLERANCE;

  const landscape =
    Math.abs(width - A4_HEIGHT) <= TOLERANCE &&
    Math.abs(height - A4_WIDTH) <= TOLERANCE;

  return portrait || landscape;
};

const checkPageSize = (
  pages: PageData[],
  pageSize: DocumentRules["pageSize"],
): PdfCheckResult => {
  const invalidPages = pages.filter(({ width, height }) =>
    pageSize === "A4" ? !isA4(width, height) : true,
  );

  return {
    valid: invalidPages.length === 0,

    message:
      invalidPages.length === 0
        ? "OK"
        : `${invalidPages.map((p) => p.page).length} stránek nejsou A4`,

    details: invalidPages.map((p) => ({
      page: p.page,
      width: p.width,
      height: p.height,
    })),
  };
};

const groupValues = (values: number[], tolerance: number) => {
  const groups: number[][] = [];

  for (const value of [...values].sort((a, b) => a - b)) {
    const group = groups.find((g) => {
      const average = g.reduce((sum, value) => sum + value, 0) / g.length;

      return Math.abs(value - average) <= tolerance;
    });

    if (group) {
      group.push(value);
    } else {
      groups.push([value]);
    }
  }

  return groups
    .map((values) => ({
      values,
      count: values.length,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
    }))
    .sort((a, b) => b.count - a.count);
};

const checkMarginLeft = (
  pages: PageData[],
  marginLeftMm: DocumentRules["marginLeftMm"],
  fontSize: DocumentRules["fontSize"],
): PdfCheckResult => {
  const leftValues: number[] = [];

  // const expectedMarginPt = marginLeftMm * (72 / 25.4);
  const tolerancePt = 2;

  for (const page of pages) {
    const textItems = page.textItems.filter(
      (item) =>
        Math.abs(item.fontSize - fontSize) <= TOLERANCE &&
        item.text.trim().length > 0,
    );

    if (!textItems.length) continue;

    const left = Math.min(...textItems.map((item) => item.x));

    leftValues.push(left);
  }

  if (leftValues.length === 0) {
    return {
      valid: false,
      message: "Nebylo možné zjistit velikost levého okraje stránky",
      details: [],
    };
  }

  const groups = groupValues(leftValues, tolerancePt);
  const mainLeft = groups[0];

  if (!mainLeft) {
    return {
      valid: false,
      message: "Nebylo možné zjistit velikost levého okraje stránky",
      details: [],
    };
  }

  const detectedMm = mainLeft.average * (25.4 / 72);
  const valid = Math.abs(detectedMm - marginLeftMm) <= 1;

  return {
    valid,
    message: valid
      ? `OK (${detectedMm.toFixed(1)} mm)`
      : `nevalidní (${detectedMm.toFixed(1)} mm)`,
    details: {
      detected: detectedMm,
      expected: marginLeftMm,
      count: mainLeft.count,
      distribution: groups.map((group) => ({
        average: group.average * (25.4 / 72),
        count: group.count,
      })),
    },
  };
};

const checkFont = (
  pages: PageData[],
  fontFamily: DocumentRules["fontFamily"],
): PdfCheckResult => {
  const fonts: { [key: string]: number } = {};

  for (const page of pages) {
    const fontNames = [...new Set(page.textItems.map((item) => item.fontName))];

    for (const fontName of fontNames) {
      const font = page.commonObjs.get(fontName);

      if (font?.name) {
        const fontName = font.name.includes("TimesNewRoman")
          ? "Times New Roman"
          : font.name.replace(/^[A-Z]{6}\+/, "");
        fonts[fontName] = fontName in fonts ? fonts[fontName] + 1 : 1;
      }
    }
  }

  const mainFont = Object.entries(fonts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const valid =
    mainFont === fontFamily
      ? true
      : mainFont.includes("CIDFont")
        ? undefined
        : false;

  return {
    valid,
    message: valid
      ? "OK"
      : valid === false
        ? `nevalidní (${mainFont})`
        : "nebylo možné zjistit písmo",
    details: fonts,
  };
};

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

const checkFontSize = (
  pages: PageData[],
  fontSize: DocumentRules["fontSize"],
): PdfCheckResult => {
  const mainFontSize = getMainFontSize(pages);

  if (mainFontSize === undefined) {
    return {
      valid: false,
      message: "Nebylo možné zjistit velikost písma",
      details: [],
    };
  }

  const valid = Math.abs(mainFontSize - fontSize) <= TOLERANCE;

  return {
    valid,
    message: valid ? "OK" : `nevalidní (${mainFontSize} pt)`,
    details: {
      expected: fontSize,
      detected: mainFontSize,
    },
  };
};

const checkLineSpacing = (
  pages: PageData[],
  lineSpacing: DocumentRules["lineSpacing"],
): PdfCheckResult => {
  const mainFontSize = getMainFontSize(pages);

  if (mainFontSize === undefined) {
    return {
      valid: false,
      message: "Nebylo možné zjistit velikost písma",
      details: [],
    };
  }

  const expectedLineSpacing = mainFontSize * lineSpacing * 1.1;

  const spacings: number[] = [];

  for (const page of pages) {
    const items = page.textItems
      .filter(
        (item) =>
          Math.abs(item.fontSize - mainFontSize) <= TOLERANCE &&
          item.text.trim().length > 0,
      )
      .sort((a, b) => b.y - a.y);

    for (let i = 1; i < items.length; i++) {
      const distance = items[i - 1].y - items[i].y;

      if (distance > 10 && distance < 30) {
        spacings.push(distance);
      }
    }
  }

  if (spacings.length === 0) {
    return {
      valid: false,
      message: "Nebylo možné zjistit řádkování",
      details: [],
    };
  }

  const distribution = new Map<number, number>();

  for (const spacing of spacings) {
    const normalized = Math.round(spacing * 10) / 10;

    distribution.set(normalized, (distribution.get(normalized) ?? 0) + 1);
  }

  const [detected, count] =
    [...distribution.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  if (detected === undefined) {
    return {
      valid: false,
      message: "Nebylo možné zjistit řádkování",
      details: [],
    };
  }

  const valid = Math.abs(detected - expectedLineSpacing) <= 1;
  const detectedLineSpacing = detected / (mainFontSize * 1.1);

  return {
    valid,

    message: valid ? `OK` : `nevalidní (${detectedLineSpacing.toFixed(2)})`,

    details: valid
      ? null
      : {
          fontSize: mainFontSize,
          expectedLineSpacing,
          detected,
          count,
        },
  };
};

const checkFileSize = (file: File, maxFileSizeInMb: number) => {
  const fileSizeMb = file.size / (1024 * 1024);
  const valid = fileSizeMb <= maxFileSizeInMb;

  return {
    valid,
    message: valid ? "OK" : `nevalidní (${fileSizeMb.toFixed(2)}MB)`,
  };
};

const checkChapterStartsNewPage = (file: File) => {
  return {
    valid: false,
    message: "",
  };
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

  const result: CheckResult["pdf"] = {
    pageSize: checkPageSize(pages, documentRules.pageSize),
    marginLeftMm: checkMarginLeft(
      pages,
      documentRules.marginLeftMm,
      documentRules.fontSize,
    ),
    fontFamily: checkFont(pages, documentRules.fontFamily),
    fontSize: checkFontSize(pages, documentRules.fontSize),
    lineSpacing: checkLineSpacing(pages, documentRules.lineSpacing),
    maxFileSizeInMb: checkFileSize(file, documentRules.maxFileSizeInMb),
  };

  if (documentRules.chapterStartsNewPage) {
    result.chapterStartsNewPage = checkChapterStartsNewPage(file);
  }

  return result;
};
