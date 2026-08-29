import Image from "next/image";
import styles from "./page.module.css";
import MainForm from "@/app/MainForm";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Hromadná AI analýza akademických prací</h1>

        <MainForm />
      </main>
    </div>
  );
}
