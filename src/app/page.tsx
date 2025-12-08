import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.pageWrapper}>
      <Header />

      <main className={styles.main}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Cek Hasil <span className={styles.highlight}>Tryout</span> Anda
          </h1>
          <p className={styles.subtitle}>
            Pantau perkembangan nilai dan prestasi akademik dengan mudah dan cepat.
          </p>

          <Card variant="glass" className={styles.searchCard}>
            <form action="/student/dashboard" method="GET" className={styles.searchForm}>
              <div className={styles.inputWrapper}>
                <Input
                  name="nisn"
                  placeholder="Masukkan Nomor NISN"
                  className={styles.searchInput}
                  required
                />
              </div>
              <Button type="submit" size="lg" className={styles.searchButton}>
                Cari Hasil
              </Button>
            </form>
          </Card>

          <div className={styles.quickLinks}>
            <Link href="/login">
              <Button variant="outline">
                Login Admin
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
