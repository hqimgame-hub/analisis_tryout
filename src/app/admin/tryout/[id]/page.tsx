'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

interface Subject {
    id: string;
    name: string;
}

interface Student {
    id: string;
    nisn: string;
    name: string;
    classroom: string;
    scores: Record<string, number>;
}

interface TryoutDetail {
    tryout: {
        name: string;
        date: string;
    };
    subjects: Subject[];
    students: Student[];
}

export default function TryoutDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [data, setData] = useState<TryoutDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        fetch(`/api/tryouts/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Gagal memuat data');
                return res.json();
            })
            .then(json => {
                if (json.success) {
                    setData(json.data);
                } else {
                    throw new Error(json.error || 'Terjadi kesalahan');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className={styles.loading}>Memuat data detail...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;
    if (!data) return <div className={styles.error}>Data tidak ditemukan</div>;

    const { tryout, subjects, students } = data;

    // Calculate averages per student
    const processedStudents = students.map(student => {
        const scores = Object.values(student.scores);
        const total = scores.reduce((a, b) => a + b, 0);
        const avg = scores.length > 0 ? total / scores.length : 0;
        return { ...student, total, avg };
    });

    // Calculate class average (simple average of student averages)
    const classTotalAvg = processedStudents.reduce((acc, s) => acc + s.avg, 0);
    const classAvg = processedStudents.length > 0 ? classTotalAvg / processedStudents.length : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>{tryout.name}</h1>
                    <span className={styles.date}>
                        {new Date(tryout.date).toLocaleDateString('id-ID', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </span>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Kembali
                </Button>
            </header>

            <div className={styles.content}>
                <div className={styles.statsRow}>
                    <Card padding="md">
                        <div className={styles.center}>
                            <strong>Total Siswa</strong>
                            <div style={{ fontSize: '1.5rem' }}>{students.length}</div>
                        </div>
                    </Card>
                    <Card padding="md">
                        <div className={styles.center}>
                            <strong>Rata-rata Kelas</strong>
                            <div style={{ fontSize: '1.5rem' }}>{classAvg.toFixed(2)}</div>
                        </div>
                    </Card>
                    <Card padding="md">
                        <div className={styles.center}>
                            <strong>Jumlah Mapel</strong>
                            <div style={{ fontSize: '1.5rem' }}>{subjects.length}</div>
                        </div>
                    </Card>
                </div>

                <Card className={styles.tableCard} padding="none">
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>No</th>
                                    <th>Nama Siswa</th>
                                    <th>NISN</th>
                                    <th>Kelas</th>
                                    {subjects.map(sub => (
                                        <th key={sub.id} className={styles.center}>{sub.name}</th>
                                    ))}
                                    <th className={styles.center}>Total</th>
                                    <th className={styles.center}>Rata-rata</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedStudents.map((student, index) => (
                                    <tr key={student.id}>
                                        <td className={styles.center}>{index + 1}</td>
                                        <td>{student.name}</td>
                                        <td>{student.nisn}</td>
                                        <td>{student.classroom}</td>
                                        {subjects.map(sub => (
                                            <td key={sub.id} className={styles.scoreCell}>
                                                {student.scores[sub.name] ?? '-'}
                                            </td>
                                        ))}
                                        <td className={styles.scoreCell}><strong>{student.total.toFixed(2)}</strong></td>
                                        <td className={styles.scoreCell}>{student.avg.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
