import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/analyze": [
      // PDF.js loads its worker and native canvas dynamically.
      "./node_modules/pdfjs-dist/package.json",
      "./node_modules/pdfjs-dist/legacy/build/*.mjs",
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/@napi-rs/canvas*/**/*",
      // Imports inside the eval-based table worker are invisible to tracing.
      // Keep PDFExcavator's separate PDF.js version and canvas together.
      "./node_modules/pdfexcavator/package.json",
      "./node_modules/pdfexcavator/dist/**/*.js",
      "./node_modules/pdfexcavator/node_modules/pdfjs-dist/package.json",
      "./node_modules/pdfexcavator/node_modules/pdfjs-dist/legacy/build/*.mjs",
      "./node_modules/pdfexcavator/node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/pdfexcavator/node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfexcavator/node_modules/@napi-rs/canvas*/**/*",
    ],
  },
};

export default nextConfig;
