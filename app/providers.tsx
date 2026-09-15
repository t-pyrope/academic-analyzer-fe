"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material";
import { theme } from "@/app/theme";

export const Providers = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
