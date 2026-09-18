"use client";
import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { useId } from "react";
import { CheckResult, PdfCheckResult } from "@/app/types";

const DocumentCheckResultItem = ({
  title,
  result,
}: {
  title: string;
  result: PdfCheckResult;
}) => {
  return (
    <Box>
      {title}:{" "}
      <Typography
        component="span"
        sx={{ color: result.valid ? "success.main" : "error.main" }}
      >
        {result.message}
      </Typography>
    </Box>
  );
};

export const ResultItem = ({
  title,
  result,
  selectedDocument,
}: {
  title: string;
  result: CheckResult;
  selectedDocument: any;
}) => {
  const id = useId();

  const {
    documentRules: {
      pageSize,
      marginLeftMm,
      fontFamily,
      fontSize,
      lineSpacing,
    },
  } = selectedDocument;

  return (
    <Accordion
      defaultExpanded={true}
      elevation={0}
      sx={{ border: `1px solid`, borderColor: "divider", width: "100%" }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls={`${id}-panel1-content`}
        id={`${id}-panel1-header`}
        sx={{ "& .MuiAccordionSummary-content": { maxWidth: "stretch" } }}
      >
        <Typography
          component="h2"
          variant="h3"
          sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
        >
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h3" variant="h4">
              Vlastnosti souboru
            </Typography>

            <DocumentCheckResultItem
              title={`Písmo (${fontFamily})`}
              result={result.pdf.font}
            />

            <DocumentCheckResultItem
              title={`Okraje stránky (${marginLeftMm})`}
              result={result.pdf.margins}
            />

            <DocumentCheckResultItem
              title={`Velikost písma (${fontSize})`}
              result={result.pdf.fontSize}
            />

            <DocumentCheckResultItem
              title={`Řádkování (${lineSpacing})`}
              result={result.pdf.lineSpacing}
            />

            <DocumentCheckResultItem
              title={`Rozměr stránek (${pageSize})`}
              result={result.pdf.pageSize}
            />
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
