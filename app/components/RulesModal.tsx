import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import definitionsDocument from "@/app/docs/rule-definitions.json";
import { DOCUMENTS } from "@/app/components/constants";
import { RuleValue } from "@/app/components/types";
import { formatLabel } from "./utils";
import { ParameterValue } from "@/app/components/ParameterValue";

type GuidelineRule = {
  definition: string;
  severity: string;
  parameters: Record<string, RuleValue>;
};
const definitionMap = new Map(
  definitionsDocument.rule_definitions.map((definition) => [
    definition.id,
    definition,
  ]),
);

const categoryMap = new Map(
  definitionsDocument.categories.map((category) => [
    category.id,
    category.name,
  ]),
);

const severityColor = (severity: string) => {
  switch (severity) {
    case "error":
      return "error" as const;

    case "warning":
      return "warning" as const;

    case "recommendation":
      return "info" as const;

    default:
      return "default" as const;
  }
};

const severityLabel = (severity: string) => {
  switch (severity) {
    case "error":
      return "Povinné";

    case "warning":
      return "Upozornění";

    case "recommendation":
      return "Doporučení";

    default:
      return formatLabel(severity);
  }
};

export const RulesModal = ({
  selectedProfileId,
}: {
  selectedProfileId: string;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedDocument = DOCUMENTS.find(
    (document) => document.profile_id === selectedProfileId,
  );

  const rulesByCategory = selectedDocument?.rules.reduce(
    (groups, rule) => {
      const definition = definitionMap.get(rule.definition);

      if (!definition) {
        return groups;
      }

      const category = definition.category;

      (groups[category] ??= []).push(rule);

      return groups;
    },
    {} as Record<string, GuidelineRule[]>,
  );

  return (
    <>
      <Dialog
        open={isDialogOpen && Boolean(selectedDocument)}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        {selectedDocument && (
          <>
            <DialogTitle>
              <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
                {selectedDocument.institution.faculty}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {formatLabel(selectedDocument.institution.work_type)} ·{" "}
                {selectedDocument.year}
              </Typography>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={1.5}>
                {Object.entries(rulesByCategory ?? {}).map(
                  ([category, rules]) => (
                    <Box
                      key={category}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        "&:before": {
                          display: "none",
                        },
                        "&:not(:last-child)": {
                          marginBottom: 1,
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        <Typography sx={{ fontWeight: 700 }}>
                          {categoryMap.get(category) ?? formatLabel(category)}
                        </Typography>

                        <Chip label={rules.length} size="small" />
                      </Stack>
                      <Stack spacing={2}>
                        {rules.map((rule, index) => {
                          const definition = definitionMap.get(rule.definition);

                          if (!definition) {
                            return null;
                          }

                          return (
                            <Box key={rule.definition}>
                              {index > 0 && <Divider sx={{ mb: 2 }} />}

                              <Stack spacing={1}>
                                <Stack
                                  direction={{
                                    xs: "column",
                                    sm: "row",
                                  }}
                                  spacing={1}
                                  // alignItems={{
                                  //   xs: "flex-start",
                                  //   sm: "center",
                                  // }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontWeight: 700,
                                    }}
                                  >
                                    {definition.name}
                                  </Typography>

                                  <Chip
                                    label={severityLabel(rule.severity)}
                                    color={severityColor(rule.severity)}
                                    size="small"
                                  />
                                </Stack>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {definition.description}:{" "}
                                  {Array.isArray(rule.parameters.check) &&
                                    rule.parameters.check.join(", ")}
                                </Typography>

                                {Object.entries(rule.parameters).map(
                                  ([key, value]) => {
                                    const parameter =
                                      definition.parameters_schema[
                                        key as keyof typeof definition.parameters_schema
                                      ];

                                    return (
                                      <Box key={key} sx={{ mt: 0.5 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: 600,
                                          }}
                                        >
                                          {parameter?.label ?? formatLabel(key)}
                                        </Typography>

                                        {parameter?.description && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {parameter.description}
                                          </Typography>
                                        )}

                                        <ParameterValue value={value} />
                                      </Box>
                                    );
                                  },
                                )}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  ),
                )}
              </Stack>
            </DialogContent>
          </>
        )}

        <DialogActions>
          <Button type="button" onClick={() => setIsDialogOpen(false)}>
            Zavřít
          </Button>
        </DialogActions>
      </Dialog>{" "}
      {selectedDocument && (
        <Button
          type="button"
          variant="outlined"
          onClick={() => setIsDialogOpen(true)}
          sx={{
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          Zobrazit pravidla
        </Button>
      )}
    </>
  );
};
