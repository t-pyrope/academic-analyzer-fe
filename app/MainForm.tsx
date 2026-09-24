"use client";

import { ChangeEvent, useEffect } from "react";
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
import { FormValues } from "@/types";
import {
  LOCAL_STORAGE_DOCUMENT_ID_KEY,
  LOCAL_STORAGE_RESULTS_KEY,
} from "@/app/constants";
import { useRouter } from "next/navigation";
import { setStateFromLocalStorage } from "@/app/utils";

const MAX_DOCUMENTS = 30;
const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function MainForm() {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      rules: pefBp.profile_id,
      documents: [],
      assignment: "",
    },
  });
  const router = useRouter();

  const documents = watch("documents");
  const selectedProfileId = watch("rules");

  useEffect(() => {
    const results = setStateFromLocalStorage(LOCAL_STORAGE_RESULTS_KEY);
    const documentId = setStateFromLocalStorage(LOCAL_STORAGE_DOCUMENT_ID_KEY);

    if (results && documentId) {
      router.replace("/results");
    } else {
      localStorage.removeItem(LOCAL_STORAGE_DOCUMENT_ID_KEY);
      localStorage.removeItem(LOCAL_STORAGE_RESULTS_KEY);
    }
  }, [router]);

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

    localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(resBody));
    localStorage.setItem(
      LOCAL_STORAGE_DOCUMENT_ID_KEY,
      JSON.stringify(form.rules),
    );
    router.push("/results");
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{ maxWidth: 640, width: "100%" }}
    >
      <Stack spacing={4}>
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
              borderStyle: "solid",
              borderColor: "divider",
              p: 4,
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
          loading={isSubmitting}
        >
          Analyzovat
        </Button>
      </Stack>
    </Box>
  );
}
