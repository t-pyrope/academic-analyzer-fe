import { CheckResult } from "@/app/types";
import { Box, Stack, Typography } from "@mui/material";
import { DOCUMENTS } from "@/app/components/constants";
import { Fragment } from "react";

export const Results = ({
  results,
  selectedProfileId,
}: {
  results: { [key: string]: CheckResult };
  selectedProfileId: string;
}) => {
  const resultsArray = Object.entries(results);
  const selectedDocument = DOCUMENTS.find(
    (document) => document.profile_id === selectedProfileId,
  );

  const {
    documentRules: { pageSize, margins, fontFamily, fontSize, lineSpacing },
  } = selectedDocument ?? {
    documentRules: {
      pageSize: "",
      margins: "",
      fontFamily: "",
      fontSize: "",
      lineSpacing: "",
    },
  };

  return resultsArray.length > 0 ? (
    <>
      <Typography variant="h2" component="h2">
        Výsledky
      </Typography>

      {resultsArray.map(([documentName, result]) => (
        <Fragment key={documentName}>
          <Typography variant="h3" component="h3">
            {documentName}
          </Typography>

          <Stack spacing={1}>
            <Box>
              Písmo ({fontFamily}):{" "}
              {result.pdf.font.valid
                ? "OK"
                : `nevalidní (${result.pdf.font.message})`}
            </Box>

            <Box>
              Okraje stránky ({margins}):{" "}
              {result.pdf.margins.valid
                ? "OK"
                : `nevalidní (${result.pdf.margins.message})`}
            </Box>

            <Box>
              Velikost písma ({fontSize}):{" "}
              {result.pdf.fontSize.valid
                ? "OK"
                : `nevalidní (${result.pdf.fontSize.message})`}
            </Box>

            <Box>
              Řádkování ({lineSpacing}):{" "}
              {result.pdf.lineSpacing.valid
                ? "OK"
                : `nevalidní (${result.pdf.lineSpacing.message})`}
            </Box>

            <Box>
              Rozměr stránek ({pageSize}):{" "}
              {result.pdf.pageSize.valid
                ? "OK"
                : `nevalidní (${result.pdf.pageSize.message})`}
            </Box>
          </Stack>
        </Fragment>
      ))}
    </>
  ) : null;
};
