"use client";

import { ChangeEvent, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { ReferenceSelect } from "@/app/components/ReferenceSelect";
import pefBp from "@/app/docs/01-czu-pef-bakalarka.json";
import { CheckResult, FormValues } from "@/app/types";
import { Results } from "@/app/Results";

const MAX_DOCUMENTS = 30;
const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function MainForm() {
  const [results, setResults] = useState<{ [key: string]: CheckResult }>({});
  const { register, setValue, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      rules: pefBp.profile_id,
      documents: [],
      assignment: "",
    },
  });
  const documents = watch("documents");
  const selectedProfileId = watch("rules");

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedDocuments = Array.from(event.target.files ?? []);
    const remainingSlots = MAX_DOCUMENTS - documents.length;

    setValue(
      "documents",
      [...documents, ...selectedDocuments.slice(0, remainingSlots)],
      {
        shouldDirty: true,
      },
    );

    event.target.value = "";
  };

  const removeDocument = (indexToRemove: number) => {
    setValue(
      "documents",
      documents.filter((_, index) => index !== indexToRemove),
      { shouldDirty: true },
    );
  };

  const onSubmit = async (form: FormValues) => {
    if (form.documents.length === 0) {
      return;
    }

    const body = new FormData();

    body.append("rules", form.rules);
    body.append("assignment", form.assignment);

    form.documents.forEach((file) => {
      body.append("documents", file);
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      body,
    });

    const resBody = await response.json();

    setResults(resBody);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ maxWidth: 640, width: "100%" }}
    >
      <Stack spacing={3}>
        <ReferenceSelect
          {...register("rules")}
          selectedProfileId={selectedProfileId}
        />

        <Stack spacing={1.25}>
          <Typography
            component="h2"
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            Akademické práce
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              borderStyle: "dashed",
              borderColor: "divider",
              p: 2.5,
              textAlign: "center",
            }}
          >
            <Stack spacing={1} sx={{ alignItems: "center" }}>
              <Button
                component="label"
                variant="outlined"
                disabled={documents.length >= MAX_DOCUMENTS}
              >
                Nahrát soubor
                <input
                  hidden
                  type="file"
                  multiple
                  accept={ACCEPTED_DOCUMENT_TYPES}
                  onChange={addDocuments}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                Pouze PDF a DOCX soubory, maximálně {MAX_DOCUMENTS} souborů
              </Typography>
            </Stack>
          </Paper>

          {documents.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Nahrané dokumenty ({documents.length}/{MAX_DOCUMENTS}):
              </Typography>
              {documents.map((document, index) => (
                <Paper
                  key={`${document.name}-${document.lastModified}-${index}`}
                  variant="outlined"
                  sx={{
                    px: 1.5,
                    py: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ flexGrow: 1, overflowWrap: "anywhere" }}
                  >
                    {document.name}
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    color="inherit"
                    onClick={() => removeDocument(index)}
                  >
                    Odebrat
                  </Button>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>

        <TextField
          {...register("assignment")}
          fullWidth
          multiline
          minRows={5}
          label="Zadání práce"
          placeholder="Cílem semestrální práce je navrhnout a implementovat webovou aplikaci..."
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          sx={{ alignSelf: "flex-start" }}
        >
          Analyzovat
        </Button>

        <Results results={results} selectedProfileId={selectedProfileId} />
      </Stack>
    </Box>
  );
}
