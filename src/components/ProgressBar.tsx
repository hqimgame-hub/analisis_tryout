import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    current: number;
    target: number;
    label: string;
    showPercentage?: boolean;
}

export const ProgressBar = ({ current, target, label, showPercentage = true }: ProgressBarProps) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isPassed = current >= target;
    const isClose = !isPassed && (target - current) <= 5;

    const getColor = () => {
        if (isPassed) return styles.passed;
        if (isClose) return styles.close;
        return styles.far;
    };

    return (
        <div className={styles.container}>
            <div className={styles.labelRow}>
                <span className={styles.label}>{label}</span>
                {showPercentage && (
                    <span className={styles.values}>
                        {current} / {target}
                    </span>
                )}
            </div>
            <div className={styles.barContainer}>
                <div
                    className={`${styles.bar} ${getColor()}`}
                    style={{ width: `${percentage}%` }}
                >
                    {isPassed && <span className={styles.checkmark}>✓</span>}
                </div>
            </div>
            {!isPassed && (
                <div className={styles.gap}>
                    Kurang {(target - current).toFixed(0)} poin
                </div>
            )}
        </div>
    );
};
