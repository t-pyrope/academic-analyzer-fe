import OpenAI from "openai";
import { DOCUMENTS } from "@/app/components/constants";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const analyzeDocuments = async (ruleId: string, documents: File[]) => {
  const rules = DOCUMENTS.find((doc) => doc.profile_id === ruleId);

  if (!rules) {
    return;
  }

  const systemPrompt = `
Ты — модуль автоматической предварительной проверки академических работ.

Проанализируй предоставленный документ согласно правилам профиля.

ПРАВИЛА:
${JSON.stringify(rules, null, 2)}

ЗАДАЧИ:

1. Проверь каждое применимое правило.
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
- Используй Markdown.
`;

  const uploadedFiles = await Promise.all(
    documents.map(async (document) => {
      return openai.files.create({
        file: await OpenAI.toFile(await document.arrayBuffer(), document.name, {
          type: document.type,
        }),
        purpose: "user_data",
      });
    }),
  );

  // console.log("uploadedFiles", uploadedFiles);

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
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
  });

  // console.log("response", response);

  return response.output_text;
};
