import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { analyzeSchema } from "@/lib/validation";
import { analyzeDocuments } from "@/lib/ai";
import { analyzePdf } from "@/lib/pdf/analyzePdf";
import { CheckResult } from "@/app/types";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";

    if (!(await rateLimit(`analyze:${ip}`, 10, 60))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const formData = await req.formData();
    const input = {
      rules: formData.get("rules"),
      assignment: formData.get("assignment"),
      documents: formData.getAll("documents"),
    };

    const parsed = analyzeSchema.safeParse(input);
    // console.log(parsed);

    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const {
      data: { rules, documents, assignment },
    } = parsed;

    // const response = await analyzeDocuments(rules, documents);

    const results: { [key: string]: CheckResult } = {};

    for (const doc of documents) {
      const analysisResult = await analyzePdf(doc);

      results[doc.name] = {
        pdf: analysisResult,
      };

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

    console.log(results);

    // const response = null;

    // console.log("HELLOU analysis result", analysisResult);

    // console.log("response", response);

    return NextResponse.json(results);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
