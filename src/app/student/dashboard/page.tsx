'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressChart } from '@/components/ProgressChart';
import { RadarChart } from '@/components/RadarChart';
import { BarChart } from '@/components/BarChart';
import { ProgressBar } from '@/components/ProgressBar';
import { generateStudentPDF } from '@/utils/pdfExport';
import styles from './page.module.css';
import './print.css';

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-dynamic';

interface TryoutResult {
    id: string;
    name: string;
    date: string;
    average: number;
    scores: { subject: string; subjectCode: string; value: number }[];
}

interface SubjectProgress {
    code: string;
    name: string;
    values: number[];
}

interface StudentData {
    student: {
        name: string;
        classroom: string;
        nisn: string;
    };
    tryouts: TryoutResult[];
    overallAverage: number;
    subjectProgress: SubjectProgress[];
    ranking: {
        classRank: number;
        classTotalStudents: number;
        overallRank: number;
        overallTotalStudents: number;
    };
    classComparison: {
        studentAverages: number[];
        classAverages: number[];
    };
    subjectAnalysis: {
        strongest: any;
        weakest: any;
        all: any[];
    };
    kkmComparison: Array<{
        code: string;
        name: string;
        kkm: number;
        currentValue: number;
        average: number;
        passedKKM: boolean;
        gap: number;
    }>;
}

// Inner component that uses useSearchParams
function StudentDashboardContent() {
    const searchParams = useSearchParams();
    const nisn = searchParams.get('nisn');

    const [data, setData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!nisn) {
            setLoading(false);
            return;
        }

        fetch(`/api/student/${nisn}`)
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    setData(resData.data);
                } else {
                    setError(resData.error || 'Data tidak ditemukan');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [nisn]);

    if (!nisn) {
        return (
            <div className={styles.centerContainer}>
                <Card>
                    <p>NISN tidak valid. Silakan cari kembali.</p>
                    <Button onClick={() => window.location.href = '/'}>Kembali ke Beranda</Button>
                </Card>
            </div>
        );
    }

    if (loading) return <div className={styles.center}>Memuat data siswa...</div>;

    if (error || !data) {
        return (
            <div className={styles.centerContainer}>
                <Card className={styles.errorCard}>
                    <h2 className={styles.errorTitle}>Maaf, Data Tidak Ditemukan</h2>
                    <p className={styles.errorText}>
                        Siswa dengan NISN <strong>{nisn}</strong> belum memiliki data tryout atau tidak terdaftar.
                    </p>
                    <Button onClick={() => window.location.href = '/'}>Cari Lagi</Button>
                </Card>
            </div>
        );
    }

    const chartLabels = data.tryouts.map(t => t.name);
    const chartData = data.tryouts.map(t => t.average);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Halo, {data.student.name}</h1>
                    <p className={styles.subtitle}>
                        NISN: {data.student.nisn} • Kelas: {data.student.classroom}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Button
                        variant="outline"
                        onClick={() => generateStudentPDF(data)}
                    >
                        📥 Download PDF
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                    >
                        🖨️ Print
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                    >
                        Keluar / Cari Baru
                    </Button>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <Card padding="lg" className={styles.statCard}>
                    <div className={styles.statLabel}>Rata-rata Keseluruhan</div>
                    <div className={styles.statValue}>{data.overallAverage.toFixed(1)}</div>
                </Card>
                <Card padding="lg" className={styles.statCard}>
                    <div className={styles.statLabel}>Ranking di Kelas</div>
                    <div className={styles.statValue}>
                        #{data.ranking.classRank}
                        <span className={styles.statSmall}>/ {data.ranking.classTotalStudents}</span>
                    </div>
                </Card>
                <Card padding="lg" className={styles.statCard}>
                    <div className={styles.statLabel}>Ranking Keseluruhan</div>
                    <div className={styles.statValue}>
                        #{data.ranking.overallRank}
                        <span className={styles.statSmall}>/ {data.ranking.overallTotalStudents}</span>
                    </div>
                </Card>
            </div>

            {data.subjectAnalysis && (
                <div className={styles.analysisSection}>
                    <h2 className={styles.sectionTitle}>📊 Analisis Kekuatan & Kelemahan</h2>
                    <div className={styles.analysisGrid}>
                        <Card padding="lg" className={styles.strengthCard}>
                            <div className={styles.badgeIcon}>🏆</div>
                            <h3>Mapel Terkuat</h3>
                            <div className={styles.subjectName}>{data.subjectAnalysis.strongest?.name}</div>
                            <div className={styles.subjectAvg}>
                                Rata-rata: {data.subjectAnalysis.strongest?.average.toFixed(1)}
                            </div>
                        </Card>
                        <Card padding="lg" className={styles.weaknessCard}>
                            <div className={styles.badgeIcon}>⚠️</div>
                            <h3>Perlu Ditingkatkan</h3>
                            <div className={styles.subjectName}>{data.subjectAnalysis.weakest?.name}</div>
                            <div className={styles.subjectAvg}>
                                Rata-rata: {data.subjectAnalysis.weakest?.average.toFixed(1)}
                            </div>
                            <div className={styles.recommendation}>
                                💡 Fokus belajar {data.subjectAnalysis.weakest?.name}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {data.kkmComparison && data.kkmComparison.length > 0 && (
                <div className={styles.kkmSection}>
                    <h2 className={styles.sectionTitle}>🎯 Perbandingan Nilai dengan KKM</h2>
                    <div className={styles.radarSection}>
                        <Card padding="lg">
                            <RadarChart
                                labels={data.kkmComparison.map(item => item.code)}
                                studentData={data.kkmComparison.map(item => item.currentValue)}
                                kkmData={data.kkmComparison.map(item => item.kkm)}
                                title="Radar Chart: Nilai vs KKM"
                            />
                        </Card>
                    </div>
                    <div className={styles.progressSection}>
                        <Card padding="lg">
                            <h3 className={styles.chartTitle}>Progress Menuju KKM</h3>
                            {data.kkmComparison.map(item => (
                                <ProgressBar
                                    key={item.code}
                                    label={item.name}
                                    current={item.currentValue}
                                    target={item.kkm}
                                />
                            ))}
                        </Card>
                    </div>
                </div>
            )}

            {data.classComparison && (
                <div className={styles.chartSection}>
                    <Card padding="lg">
                        <h3 className={styles.chartTitle}>Perbandingan dengan Rata-rata Kelas</h3>
                        <p className={styles.chartDesc}>Garis biru = Nilai kamu | Garis merah = Rata-rata kelas</p>
                        <ProgressChart
                            labels={chartLabels}
                            dataBox={data.classComparison.studentAverages}
                            classAverage={data.classComparison.classAverages}
                            title=""
                        />
                    </Card>
                </div>
            )}

            <div className={styles.chartSection}>
                <Card padding="lg">
                    <ProgressChart
                        labels={chartLabels}
                        dataBox={chartData}
                        title="Grafik Perkembangan Rata-rata Nilai"
                    />
                </Card>
            </div>

            {data.subjectProgress && data.subjectProgress.length > 0 && (
                <div className={styles.subjectChartsSection}>
                    <h2 className={styles.sectionTitle}>📊 Perkembangan per Mata Pelajaran</h2>
                    <div className={styles.subjectChartsGrid}>
                        {data.subjectProgress.map((subject, idx) => {
                            const colors = [
                                'rgb(59, 130, 246)',
                                'rgb(16, 185, 129)',
                                'rgb(245, 158, 11)',
                                'rgb(239, 68, 68)',
                                'rgb(139, 92, 246)',
                                'rgb(236, 72, 153)',
                            ];
                            return (
                                <Card key={subject.code} padding="lg" className={styles.subjectChartCard}>
                                    <h3 className={styles.subjectChartTitle}>{subject.name}</h3>
                                    <BarChart
                                        labels={chartLabels}
                                        dataBox={subject.values}
                                        title=""
                                        color={colors[idx % colors.length]}
                                    />
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            <section className={styles.historySection}>
                <h2 className={styles.sectionTitle}>Riwayat Tryout</h2>
                <div className={styles.grid}>
                    {data.tryouts.map((t) => (
                        <Card key={t.id} className={styles.resultCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.tryoutName}>{t.name}</h3>
                                    <span className={styles.date}>
                                        {new Date(t.date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                                    </span>
                                </div>
                                <div className={styles.averageBadge}>
                                    <span className={styles.avgLabel}>Rata-rata</span>
                                    <span className={styles.avgValue}>{t.average.toFixed(1)}</span>
                                </div>
                            </div>

                            <div className={styles.scoresList}>
                                {t.scores.map((s, idx) => (
                                    <div key={idx} className={styles.scoreItem}>
                                        <span>{s.subject}</span>
                                        <span className={styles.scoreValue}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}

// Main export wrapped in Suspense
export default function StudentDashboard() {
    return (
        <Suspense fallback={<div className={styles.center}>Memuat data siswa...</div>}>
            <StudentDashboardContent />
        </Suspense>
    );
}
