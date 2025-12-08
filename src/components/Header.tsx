import { SCHOOL_CONFIG } from '@/config/school';
import styles from './Header.module.css';

interface HeaderProps {
    showLogo?: boolean;
    title?: string;
}

export default function Header({ showLogo = true, title }: HeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {showLogo && (
                    <div className={styles.logoSection}>
                        <div className={styles.logoPlaceholder}>
                            {/* Replace with actual logo image */}
                            <div className={styles.logoCircle}>
                                <span className={styles.logoText}>LOGO</span>
                            </div>
                        </div>
                        <div className={styles.schoolInfo}>
                            <h1 className={styles.schoolName}>{SCHOOL_CONFIG.name}</h1>
                            <p className={styles.schoolTagline}>Sistem Analisis Tryout Kelas 9</p>
                        </div>
                    </div>
                )}
                {title && (
                    <div className={styles.titleSection}>
                        <h2>{title}</h2>
                    </div>
                )}
            </div>
        </header>
    );
}
