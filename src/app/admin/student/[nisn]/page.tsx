'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import AnalyticsChart from '@/components/AnalyticsChart';

interface StudentData {
    student: {
        nisn: string;
        name: string;
        classroom: string;
    };
    subjectTrends: Array<{
        code: string;
        scores: Array<{
            tryoutName: string;
            tryoutDate: string;
            value: number;
            kkm?: number;
        }>;
        trend: number;
        average: number;
        improving: boolean;
    }>;
    comparison: {
        studentAverage: number;
        classAverage: number;
        aboveClass: boolean;
    };
}

export default function StudentDetailPage({ params }: { params: { nisn: string } }) {
    const router = useRouter();
    const [data, setData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/analytics/student/${params.nisn}`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setData(result.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.nisn]);

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!data) return <div className={styles.error}>Data tidak ditemukan</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{data.student.name}</h1>
                    <p className={styles.subtitle}>
                        NISN: {data.student.nisn} | Kelas: {data.student.classroom}
                    </p>
                </div>
                <Button onClick={() => router.back()}>← Kembali</Button>
            </div>

            <div className={styles.comparisonCard}>
                <h2>Perbandingan dengan Kelas</h2>
                <div className={styles.comparisonStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Rata-rata Siswa</span>
                        <span className={styles.statValue}>{data.comparison.studentAverage}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Rata-rata Kelas</span>
                        <span className={styles.statValue}>{data.comparison.classAverage}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Status</span>
                        <span className={`${styles.statValue} ${data.comparison.aboveClass ? styles.positive : styles.negative}`}>
                            {data.comparison.aboveClass ? '↑ Di Atas Rata-rata' : '↓ Di Bawah Rata-rata'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.trendsSection}>
                <h2>Progress per Mata Pelajaran</h2>
                {data.subjectTrends.map(subject => {
                    const chartData = {
                        labels: subject.scores.map(s => s.tryoutName),
                        datasets: [
                            {
                                label: 'Nilai',
                                data: subject.scores.map(s => s.value),
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                tension: 0.4
                            },
                            ...(subject.scores[0]?.kkm ? [{
                                label: 'KKM',
                                data: subject.scores.map(s => s.kkm),
                                borderColor: 'rgb(255, 99, 132)',
                                borderDash: [5, 5],
                                fill: false
                            }] : [])
                        ]
                    };

                    return (
                        <div key={subject.code} className={styles.subjectCard}>
                            <div className={styles.subjectHeader}>
                                <h3>{subject.code}</h3>
                                <div className={styles.subjectStats}>
                                    <span>Rata-rata: <strong>{subject.average}</strong></span>
                                    <span className={subject.improving ? styles.improving : styles.declining}>
                                        {subject.improving ? '↑' : '↓'} {subject.trend > 0 ? '+' : ''}{subject.trend.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.chartContainer}>
                                <AnalyticsChart type="line" data={chartData} />
                            </div>
                            {subject.scores.length > 0 && (
                                <div className={styles.scoresList}>
                                    {subject.scores.map((score, idx) => (
                                        <div key={idx} className={styles.scoreItem}>
                                            <span>{score.tryoutName}</span>
                                            <span className={
                                                score.kkm && score.value < score.kkm
                                                    ? styles.belowKKM
                                                    : styles.aboveKKM
                                            }>
                                                {score.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {data.subjectTrends.some(s => !s.improving) && (
                <div className={styles.recommendations}>
                    <h3>⚠️ Rekomendasi</h3>
                    <ul>
                        {data.subjectTrends
                            .filter(s => !s.improving)
                            .map(s => (
                                <li key={s.code}>
                                    <strong>{s.code}:</strong> Nilai menurun {Math.abs(s.trend).toFixed(1)} poin.
                                    Perlu perhatian khusus dan remedial.
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
