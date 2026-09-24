import OpenAI from "openai";
import {
  approximateJsonBytes,
  measureOpenAICall,
} from "@/lib/instrumentation/analysis";
import { AnalysisResult, SelectedDocument } from "@/types";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const analyzeDocuments = async (
  documents: File[],
  selectedDocument: SelectedDocument,
) => {
  const systemPrompt = `
Ты — модуль автоматической предварительной проверки академических работ.

Проанализируй предоставленный документ согласно правилам профиля.

ПРАВИЛА:
${JSON.stringify(selectedDocument.rules, null, 2)}

ЗАДАЧИ:

1. Проверь каждое применимое правило.
2. Если нет нарушения правила, не возвращай его
2. Для каждого нарушения укажи:
   - ID правила;
   - описание нарушения;
   - место обнаружения;
   - краткое объяснение.
3. Отдельно укажи правила, которые невозможно достоверно проверить
   по содержимому документа.
4. Сделай краткое резюме работы.
5. Сформируй 5 вопросов к защите, основанных непосредственно
   на содержании работы.

ВАЖНО:
- Не выдумывай отсутствующую информацию.
- Если правило невозможно проверить по документу, напиши "невозможно определить".
- Не объявляй нарушение только потому, что в извлечённом тексте
  нет информации о визуальном или техническом свойстве документа.
- Отвечай на языке документа.
`;

  const uploadedFiles = await Promise.all(
    documents.map(async (document) => {
      const body = {
        file: await OpenAI.toFile(await document.arrayBuffer(), document.name, {
          type: document.type,
        }),
        purpose: "user_data" as const,
      };
      return measureOpenAICall(
        "files.create",
        document.size + Buffer.byteLength(body.purpose),
        () => openai.files.create(body),
      );
    }),
  );
  const body: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: "gpt-5.6-terra",
    reasoning: {
      effort: "medium",
    },
    instructions: systemPrompt,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text" as const,
            text: "Проанализируй предоставленные академические работы",
          },
          ...uploadedFiles.map((file) => ({
            type: "input_file" as const,
            file_id: file.id,
          })),
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "academic_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            violations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ruleId: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["ruleId", "description", "location", "explanation"],
                additionalProperties: false,
              },
            },

            impossibleToDetermine: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ruleId: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["ruleId", "reason"],
                additionalProperties: false,
              },
            },

            summary: {
              type: "string",
            },

            questions: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },

          required: [
            "violations",
            "impossibleToDetermine",
            "summary",
            "questions",
          ],

          additionalProperties: false,
        },
      },
    },
  };
  const response = await measureOpenAICall(
    "responses.create",
    approximateJsonBytes(body),
    () => openai.responses.create(body),
  );

  return JSON.parse(response.output_text) as AnalysisResult;
};
