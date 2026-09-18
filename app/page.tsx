import MainForm from "@/app/MainForm";
import { Typography } from "@mui/material";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Typography variant="h1" component="h1">
          Hromadná AI analýza akademických prací
        </Typography>

        <MainForm />
      </main>
    </div>
  );
}
