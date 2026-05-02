import Image from "next/image";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div>
          <h1 className={styles.title}>
            To get started, edit the page.tsx file.
          </h1>

          <p className={styles.text}>
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates"
              className={styles.link}
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn"
              className={styles.link}
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>

        <div className={styles.buttons}>
          <a
            className={styles.buttonPrimary}
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>

          <a
            className={styles.buttonSecondary}
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
