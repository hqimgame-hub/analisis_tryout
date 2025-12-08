'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import DashboardStats from '@/components/DashboardStats';
import AnalyticsChart from '@/components/AnalyticsChart';
import styles from './page.module.css';

interface Tryout {
    id: string;
    name: string;
    date: string;
    studentCount: number;
    totalScores: number;
}

interface AnalyticsData {
    overview: {
        totalStudents: number;
        totalTryouts: number;
        totalSubjects: number;
        overallAverage: number;
        totalScores: number;
    };
    subjectStats: Array<{
        code: string;
        name: string;
        average: number;
        count: number;
        kkm: number;
    }>;
    trendData: Array<{
        name: string;
        date: string;
        average: number;
    }>;
    classStats: Array<{
        classroom: string;
        count: number;
    }>;
    belowKKM: {
        total: number;
        bySubject: Array<{
            code: string;
            name: string;
            count: number;
            kkm: number;
        }>;
    };
}

export default function AdminDashboard() {
    const [tryouts, setTryouts] = useState<Tryout[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/tryouts').then(res => res.json()),
            fetch('/api/analytics/dashboard').then(res => res.json())
        ])
            .then(([tryoutsData, analyticsData]) => {
                if (tryoutsData.success) {
                    setTryouts(tryoutsData.data);
                }
                if (analyticsData.success) {
                    setAnalytics(analyticsData.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.loading}>Loading...</div>;

    const statCards = analytics ? [
        {
            title: 'Total Siswa',
            value: analytics.overview.totalStudents,
            icon: '👥'
        },
        {
            title: 'Total Tryout',
            value: analytics.overview.totalTryouts,
            icon: '📝'
        },
        {
            title: 'Rata-rata Keseluruhan',
            value: analytics.overview.overallAverage.toFixed(1),
            icon: '📊'
        },
        {
            title: 'Siswa Di Bawah KKM',
            value: analytics.belowKKM.total,
            icon: '⚠️'
        }
    ] : [];

    // Chart data
    const trendChartData = analytics ? {
        labels: analytics.trendData.map(d => d.name),
        datasets: [{
            label: 'Rata-rata Nilai',
            data: analytics.trendData.map(d => d.average),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
        }]
    } : { labels: [], datasets: [] };

    const subjectChartData = analytics ? {
        labels: analytics.subjectStats.map(s => s.code),
        datasets: [{
            label: 'Rata-rata per Mapel',
            data: analytics.subjectStats.map(s => s.average),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)',
            ],
        }]
    } : { labels: [], datasets: [] };

    const classChartData = analytics ? {
        labels: analytics.classStats.map(c => c.classroom),
        datasets: [{
            label: 'Jumlah Siswa',
            data: analytics.classStats.map(c => c.count),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
            ],
        }]
    } : { labels: [], datasets: [] };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Admin Dashboard</h1>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Logout
                </Button>
            </header>

            {analytics && <DashboardStats stats={statCards} />}

            {analytics && (
                <div className={styles.chartsSection}>
                    <Card padding="lg" variant="glass">
                        <h3 className={styles.chartTitle}>Trend Rata-rata Nilai</h3>
                        <div className={styles.chartContainer}>
                            <AnalyticsChart type="line" data={trendChartData} />
                        </div>
                    </Card>

                    <Card padding="lg" variant="glass">
                        <h3 className={styles.chartTitle}>Perbandingan per Mapel</h3>
                        <div className={styles.chartContainer}>
                            <AnalyticsChart type="bar" data={subjectChartData} />
                        </div>
                    </Card>

                    <Card padding="lg" variant="glass">
                        <h3 className={styles.chartTitle}>Distribusi Siswa per Kelas</h3>
                        <div className={styles.chartContainer}>
                            <AnalyticsChart type="pie" data={classChartData} />
                        </div>
                    </Card>
                </div>
            )}

            <div className={styles.menuSection}>
                <h2 className={styles.sectionTitle}>Menu Utama</h2>
                <div className={styles.statsGrid}>
                    <Card padding="lg" variant="glass">
                        <h3 className={styles.cardTitle}>Kelola Data Siswa</h3>
                        <p className={styles.cardDesc}>Tambah, edit, atau hapus data master siswa</p>
                        <div className={styles.actionParams}>
                            <Button onClick={() => window.location.href = '/admin/students'}>
                                Kelola Siswa
                            </Button>
                        </div>
                    </Card>

                    <Card padding="lg" variant="glass">
                        <h3 className={styles.cardTitle}>Kelola Data Mapel</h3>
                        <p className={styles.cardDesc}>Atur kode dan nama mata pelajaran</p>
                        <div className={styles.actionParams}>
                            <Button onClick={() => window.location.href = '/admin/subjects'}>
                                Kelola Mapel
                            </Button>
                        </div>
                    </Card>

                    <Card padding="lg" variant="glass">
                        <h3 className={styles.cardTitle}>Kelola Tryout</h3>
                        <p className={styles.cardDesc}>Buat tryout baru dan upload nilai</p>
                        <div className={styles.actionParams}>
                            <Button onClick={() => window.location.href = '/admin/tryouts'}>
                                Kelola Tryout
                            </Button>
                        </div>
                    </Card>

                    <Card padding="lg" variant="glass">
                        <h3 className={styles.cardTitle}>Analisis Per Kelas</h3>
                        <p className={styles.cardDesc}>Bandingkan performa antar kelas</p>
                        <div className={styles.actionParams}>
                            <Button onClick={() => window.location.href = '/admin/class-analysis'}>
                                Lihat Analisis
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <div className={styles.tryoutsSection}>
                <h2 className={styles.sectionTitle}>Daftar Tryout</h2>
                <div className={styles.tryoutsList}>
                    {tryouts.map((tryout) => (
                        <Card
                            key={tryout.id}
                            padding="md"
                            variant="glass"
                            onClick={() => window.location.href = `/admin/tryout/${tryout.id}`}
                            className={styles.tryoutCard}
                        >
                            <h3 className={styles.tryoutName}>{tryout.name}</h3>
                            <p className={styles.tryoutDate}>
                                {new Date(tryout.date).toLocaleDateString('id-ID')}
                            </p>
                            <div className={styles.tryoutStats}>
                                <span>{tryout.studentCount || 0} siswa</span>
                                <span>{tryout.totalScores || 0} nilai</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
