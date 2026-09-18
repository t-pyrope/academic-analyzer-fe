export type FormValues = {
  rules: string;
  documents: File[];
  assignment: string;
};

export interface PdfCheckResult {
  valid: boolean;
  message: string;
  details?: unknown;
}

export interface CheckResult {
  pdf: {
    pageSize: PdfCheckResult;
    margins: PdfCheckResult;
    font: PdfCheckResult;
    fontSize: PdfCheckResult;
    lineSpacing: PdfCheckResult;
  };
}

export interface DocumentRules {
  pageSize: string;
  marginLeftMm: number;
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
}
