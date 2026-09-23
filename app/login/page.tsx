import { Box, Button, TextField, Typography } from "@mui/material";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <Box component="main" sx={{ maxWidth: 400, mx: "auto", mt: 10, px: 3 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Přihlášení
      </Typography>
      <Box
        component="form"
        action="/api/login"
        method="post"
        sx={{ display: "grid", gap: 2 }}
      >
        <TextField
          name="password"
          label="Heslo"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          error={!!error}
          helperText={error ? "Nesprávné heslo." : undefined}
        />
        <Button type="submit" variant="contained">
          Přihlásit se
        </Button>
      </Box>
    </Box>
  );
}
