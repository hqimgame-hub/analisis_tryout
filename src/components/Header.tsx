import { SCHOOL_CONFIG } from '@/config/school';
/* import Image from 'next/image'; // Option if we want optimized images, but img is easier for generic paths */
import { ThemeToggle } from '@/components/ThemeToggle';
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
                            {SCHOOL_CONFIG.logo ? (
                                <img
                                    src={SCHOOL_CONFIG.logo}
                                    alt={`${SCHOOL_CONFIG.name} Logo`}
                                    className={styles.logoImage}
                                    width={50}
                                    height={50}
                                />
                            ) : (
                                <div className={styles.logoCircle}>
                                    <span className={styles.logoText}>LOGO</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.schoolInfo}>
                            <h1 className={styles.schoolName}>{SCHOOL_CONFIG.name}</h1>
                            <p className={styles.schoolTagline}>
                                {process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Sistem Analisis Tryout Kelas 9'}
                            </p>
                        </div>
                    </div>
                )}
                {title && (
                    <div className={styles.titleSection}>
                        <h2>{title}</h2>
                    </div>
                )}
                <div className={styles.themeToggleWrapper}>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

