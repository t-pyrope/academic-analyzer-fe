import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { analyzeSchema } from "@/lib/validation";
import { analyzeDocuments } from "@/lib/ai";
import { analyzePdf } from "@/lib/pdf/analyzePdf";
import { CheckResult } from "@/types";
import { DOCUMENTS } from "@/app/components/constants";

import { measureAnalysisRequest } from "@/lib/instrumentation/analysis";

export async function POST(req: Request) {
  return measureAnalysisRequest(async (measureDocument) => {
    try {
      const ip = req.headers.get("x-forwarded-for") ?? "unknown";

      if (!(await rateLimit(`analyze:${ip}`, 10, 60))) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 },
        );
      }

      const formData = await req.formData();
      const input = {
        rules: formData.get("rules"),
        assignment: formData.get("assignment"),
        documents: formData.getAll("documents"),
      };

      const parsed = analyzeSchema.safeParse(input);

      if (!parsed.success) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
      }

      const {
        data: { rules, documents, assignment },
      } = parsed;
      const results: { [key: string]: CheckResult } = {};

      const selectedDocument = DOCUMENTS.find(
        (document) => document.profile_id === rules,
      );

      if (!selectedDocument) {
        return NextResponse.json({ error: "Invalid input" }, { status: 403 });
      }
      for (const doc of documents) {
        await measureDocument(async () => {
          const analysisResult = await analyzePdf(
            doc,
            selectedDocument.documentRules,
          );
          const aiResults = await analyzeDocuments([doc], selectedDocument);

          results[doc.name] = {
            pdf: analysisResult,
            // ai: null,
            ai: aiResults,
          };
        });

        // console.log(
        //   JSON.stringify(
        //     Object.fromEntries(
        //       Object.entries(analysisResult).filter(([, v]) => {
        //         // console.log("HELLOU v", v);
        //         return !v?.valid;
        //       }),
        //     ),
        //   ),
        // );
      }

      // const response = null;

      // console.log("HELLOU analysis result", analysisResult);

      // console.log("response", response);

      return NextResponse.json(results);
    } catch {
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
  });
}
