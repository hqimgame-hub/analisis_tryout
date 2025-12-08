'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';

export default function UploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setMessage({ type: 'success', text: data.message });
            // Reset form
            (e.target as HTMLFormElement).reset();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <Card className={styles.card} padding="lg">
                <h1 className={styles.title}>Upload Data Tryout</h1>
                <p className={styles.subtitle}>
                    Unggah file Excel (.xlsx) sesuai format template untuk menambahkan data tryout baru.
                </p>

                {message && (
                    <div className={`${styles.alert} ${message.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Nama Tryout"
                        name="tryoutName"
                        placeholder="Contoh: Tryout Matematika Tahap 1"
                        required
                    />

                    <Input
                        label="Tanggal Pelaksanaan"
                        name="tryoutDate"
                        type="date"
                        required
                    />

                    <div className={styles.fileInputWrapper}>
                        <label className={styles.fileLabel}>File Excel</label>
                        <input
                            type="file"
                            name="file"
                            accept=".xlsx,.xls"
                            required
                            className={styles.fileInput}
                        />
                        <p className={styles.hint}>Format kolom: NO, NISN, NAMA, KELAS, [MAPEL 1], [MAPEL 2]...</p>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Kembali
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Upload Data
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
