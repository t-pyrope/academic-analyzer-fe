"use client";

import type { ChangeEvent } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";

type FormData = {
  university: string;
  documents: File[];
  assignment: string;
};

const MAX_DOCUMENTS = 30;
const ACCEPTED_DOCUMENT_TYPES = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function Form() {
  const { register, setValue, watch, handleSubmit } = useForm<FormData>({
    defaultValues: {
      university: "ČZU",
      documents: [],
      assignment: "",
    },
  });
  const documents = watch("documents");

  const addDocuments = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedDocuments = Array.from(event.target.files ?? []);
    const remainingSlots = MAX_DOCUMENTS - documents.length;

    setValue("documents", [...documents, ...selectedDocuments.slice(0, remainingSlots)], {
      shouldDirty: true,
    });

    // Allows choosing the same file again after it has been removed.
    event.target.value = "";
  };

  const removeDocument = (indexToRemove: number) => {
    setValue(
      "documents",
      documents.filter((_, index) => index !== indexToRemove),
      { shouldDirty: true },
    );
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(() => undefined)}
      noValidate
      sx={{ maxWidth: 640, width: "100%" }}
    >
      <Stack spacing={3}>
        <TextField
          {...register("university")}
          select
          fullWidth
          label="University"
          slotProps={{ select: { native: true } }}
        >
          <option value="ČZU">ČZU</option>
          <option value="Univerzita Karlova">Univerzita Karlova</option>
          <option value="ČVUT">ČVUT</option>
        </TextField>

        <Stack spacing={1.25}>
          <Typography component="h2" variant="subtitle1" fontWeight={600}>
            Required documents
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
            <Stack spacing={1} alignItems="center">
              <Button component="label" variant="outlined" disabled={documents.length >= MAX_DOCUMENTS}>
                Upload documents
                <input
                  hidden
                  type="file"
                  multiple
                  accept={ACCEPTED_DOCUMENT_TYPES}
                  onChange={addDocuments}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                PDF and DOCX files only · up to {MAX_DOCUMENTS} documents
              </Typography>
            </Stack>
          </Paper>

          {documents.length > 0 && (
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                Selected files ({documents.length}/{MAX_DOCUMENTS})
              </Typography>
              {documents.map((document, index) => (
                <Paper
                  key={`${document.name}-${document.lastModified}-${index}`}
                  variant="outlined"
                  sx={{ px: 1.5, py: 1, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Typography variant="body2" sx={{ flexGrow: 1, overflowWrap: "anywhere" }}>
                    {document.name}
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    color="inherit"
                    onClick={() => removeDocument(index)}
                  >
                    Remove
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
          label="Assignment"
          placeholder="Enter the assignment given by the teacher..."
        />

        <Button type="submit" variant="contained" size="large" sx={{ alignSelf: "flex-start" }}>
          Analyze documents
        </Button>
      </Stack>
    </Box>
  );
}
