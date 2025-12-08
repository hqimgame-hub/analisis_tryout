'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import AnalyticsChart from '@/components/AnalyticsChart';
import { exportToExcel } from '@/utils/exportHelpers';

interface ClassData {
    classroom: string;
    studentCount: number;
    average: number;
    subjectAverages: Array<{
        code: string;
        average: number;
    }>;
    topStudents: Array<{
        nisn: string;
        name: string;
        average: number;
    }>;
}

export default function ClassAnalysisPage() {
    const router = useRouter();
    const [classData, setClassData] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics/class')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setClassData(data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleExport = () => {
        const exportData = classData.map(c => ({
            Kelas: c.classroom,
            'Jumlah Siswa': c.studentCount,
            'Rata-rata': c.average
        }));
        exportToExcel(exportData, 'Analisis_Per_Kelas');
    };

    const chartData = {
        labels: classData.map(c => c.classroom),
        datasets: [{
            label: 'Rata-rata per Kelas',
            data: classData.map(c => c.average),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    // Subject comparison chart data
    const getSubjectComparisonData = () => {
        if (classData.length === 0) return { labels: [], datasets: [] };

        // Get all unique subjects
        const allSubjects = new Set<string>();
        classData.forEach(c => {
            c.subjectAverages.forEach(s => allSubjects.add(s.code));
        });

        const subjects = Array.from(allSubjects);
        const colors = [
            { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
            { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
            { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
            { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
            { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' },
            { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' },
        ];

        const datasets = subjects.map((subject, idx) => {
            const color = colors[idx % colors.length];
            return {
                label: subject,
                data: classData.map(c => {
                    const subj = c.subjectAverages.find(s => s.code === subject);
                    return subj ? subj.average : 0;
                }),
                backgroundColor: color.bg,
                borderColor: color.border,
                borderWidth: 2,
                tension: 0.3,
                fill: false
            };
        });

        return {
            labels: classData.map(c => c.classroom),
            datasets
        };
    };

    const subjectComparisonData = getSubjectComparisonData();

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Analisis Per Kelas</h1>
                <div className={styles.headerActions}>
                    <Button onClick={handleExport}>Export Excel</Button>
                    <Button onClick={() => router.push('/admin/dashboard')}>← Kembali</Button>
                </div>
            </div>

            <div className={styles.chartSection}>
                <h2>Perbandingan Rata-rata Kelas</h2>
                <div className={styles.chartContainer}>
                    <AnalyticsChart type="bar" data={chartData} />
                </div>
            </div>

            <div className={styles.chartSection}>
                <h2>Perbandingan Rata-rata per Mapel</h2>
                <p className={styles.chartDesc}>Grafik perbandingan nilai rata-rata setiap mata pelajaran di semua kelas</p>
                <div className={styles.chartContainer}>
                    <AnalyticsChart type="line" data={subjectComparisonData} />
                </div>
            </div>

            <div className={styles.classList}>
                {classData.map((classInfo) => (
                    <div key={classInfo.classroom} className={styles.classCard}>
                        <div className={styles.classHeader}>
                            <h3>Kelas {classInfo.classroom}</h3>
                            <div className={styles.classAverage}>
                                Rata-rata: <strong>{classInfo.average.toFixed(2)}</strong>
                            </div>
                        </div>

                        <div className={styles.classStats}>
                            <p>Jumlah Siswa: {classInfo.studentCount}</p>
                        </div>

                        <div className={styles.subjectBreakdown}>
                            <h4>Rata-rata per Mapel:</h4>
                            <div className={styles.subjectGrid}>
                                {classInfo.subjectAverages.map(sub => (
                                    <div key={sub.code} className={styles.subjectItem}>
                                        <span className={styles.subjectCode}>{sub.code}</span>
                                        <span className={styles.subjectAvg}>{sub.average.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.topStudents}>
                            <h4>Top 5 Siswa:</h4>
                            <ol>
                                {classInfo.topStudents.map((student, idx) => (
                                    <li key={student.nisn}>
                                        {student.name} - {student.average.toFixed(2)}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
