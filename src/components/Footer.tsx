import { SCHOOL_CONFIG } from '@/config/school';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerContent}>
                    <div className={styles.schoolInfo}>
                        <h3>{SCHOOL_CONFIG.fullName}</h3>
                        <p>{SCHOOL_CONFIG.address}</p>
                        <p>Telp: {SCHOOL_CONFIG.phone}</p>
                        <p>Email: {SCHOOL_CONFIG.email}</p>
                    </div>
                    <div className={styles.copyright}>
                        <p>&copy; {new Date().getFullYear()} {SCHOOL_CONFIG.name}</p>
                        <p>Sistem Analisis Tryout Kelas 9</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
