import styles from './DashboardStats.module.css';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function DashboardStats({ stats }: { stats: StatCardProps[] }) {
    return (
        <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
                <div key={index} className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statTitle}>{stat.title}</span>
                        {stat.icon && <span className={styles.statIcon}>{stat.icon}</span>}
                    </div>
                    <div className={styles.statValue}>{stat.value}</div>
                    {stat.trend && (
                        <div className={`${styles.statTrend} ${stat.trend.isPositive ? styles.positive : styles.negative}`}>
                            {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
