'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';

interface Tryout {
    id: string;
    name: string;
    date: string;
    subjects: Array<{
        subject: {
            id: string;
            code: string;
            name: string;
        };
    }>;
}

export default function UploadScoresPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [tryout, setTryout] = useState<Tryout | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTryout();
    }, []);

    const fetchTryout = async () => {
        try {
            const res = await fetch(`/api/tryouts/${resolvedParams.id}`);
            const data = await res.json();
            if (data.success) {
                setTryout(data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tryoutId', resolvedParams.id);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                alert(`Upload berhasil!\n${data.message}`);
                router.push('/admin/tryouts');
            } else {
                alert(data.error || 'Upload gagal');
            }
        } catch (error) {
            alert('Terjadi kesalahan saat upload');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!tryout) return <div className={styles.error}>Tryout tidak ditemukan</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Upload Nilai Tryout</h1>
                <Button onClick={() => router.push('/admin/tryouts')}>
                    ← Kembali
                </Button>
            </div>

            <div className={styles.tryoutInfo}>
                <h2>{tryout.name}</h2>
                <p className={styles.date}>
                    {new Date(tryout.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
                <div className={styles.subjectTags}>
                    {tryout.subjects && tryout.subjects.map(s => (
                        s.subject && (
                            <span key={s.subject.id} className={styles.subjectTag}>
                                {s.subject.code}
                            </span>
                        )
                    ))}
                </div>
            </div>

            <div className={styles.uploadSection}>
                <div className={styles.downloadBox}>
                    <h3>📥 Download Template Excel</h3>
                    <p>Template sudah berisi daftar siswa dan kolom mapel yang sesuai</p>
                    <Button onClick={() => {
                        window.location.href = `/api/download/template?type=template&tryoutId=${resolvedParams.id}`;
                    }}>
                        Download Template
                    </Button>
                </div>

                <div className={styles.uploadBox}>
                    <h3>📤 Upload File Excel</h3>
                    <p>Pilih file Excel yang sudah diisi nilai</p>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className={styles.fileInput}
                    />
                    {uploading && <div className={styles.uploadingText}>Uploading...</div>}
                </div>
            </div>
        </div>
    );
}
