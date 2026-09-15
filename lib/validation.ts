import { z } from "zod";

export const analyzeSchema = z.object({
  rules: z.string(),
  documents: z.array(
    z
      .instanceof(File)
      .refine(
        (file) =>
          [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ].includes(file.type),
        {
          message: "Only PDF and DOCX files are allowed",
        },
      ),
  ),
  assignment: z.string(),
});
