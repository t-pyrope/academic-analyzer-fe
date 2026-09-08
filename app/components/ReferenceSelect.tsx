"use client";

import { useState, type ChangeEvent } from "react";
import { Stack, TextField } from "@mui/material";
import { UseFormRegisterReturn } from "react-hook-form";

import { DOCUMENTS } from "@/app/components/constants";
import { RulesModal } from "@/app/components/RulesModal";

export const ReferenceSelect = (
  props: Partial<UseFormRegisterReturn<string>>,
) => {
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const options = DOCUMENTS.map((doc) => ({
    label: `${doc.institution.faculty_code}, ${doc.institution.work_type} (${doc.year})`,
    value: doc.profile_id,
  }));

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setSelectedProfileId(event.target.value);
    props.onChange?.(event);
  };

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        // alignItems={{ xs: "stretch", sm: "center" }}
        component="div"
      >
        <TextField
          {...props}
          select
          fullWidth
          label="Metodické pokyny"
          value={selectedProfileId}
          onChange={handleChange}
          slotProps={{
            select: {
              native: true,
            },
          }}
        >
          <option value="" />

          {options.map(({ label, value }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </TextField>

        <RulesModal selectedProfileId={selectedProfileId} />
      </Stack>
    </>
  );
};
