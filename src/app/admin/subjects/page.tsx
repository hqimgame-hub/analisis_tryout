'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';

interface Subject {
    id: string;
    code: string;
    name: string;
    kkm?: number;
    _count?: { scores: number };
}

export default function SubjectsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ code: '', name: '', kkm: undefined as number | undefined });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/subjects');
            const data = await res.json();
            if (data.success) {
                setSubjects(data.data);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = '/api/subjects';
        const method = editingId ? 'PUT' : 'POST';
        const body = editingId
            ? JSON.stringify({ id: editingId, ...formData })
            : JSON.stringify(formData);

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body,
            });

            const data = await res.json();
            if (data.success) {
                alert(editingId ? 'Mapel berhasil diupdate' : 'Mapel berhasil ditambahkan');
                setFormData({ code: '', name: '', kkm: undefined });
                setEditingId(null);
                fetchSubjects();
            } else {
                alert(data.error || 'Gagal menyimpan data');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingId(subject.id);
        setFormData({
            code: subject.code,
            name: subject.name,
            kkm: subject.kkm
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus mapel ini? Semua nilai terkait akan ikut terhapus.')) return;

        try {
            const res = await fetch(`/api/subjects?id=${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (data.success) {
                alert('Mapel berhasil dihapus');
                fetchSubjects();
            } else {
                alert(data.error || 'Gagal menghapus');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        }
    };

    const addDefaultSubjects = async () => {
        const defaults = [
            { code: 'MAT', name: 'Matematika', kkm: 75 },
            { code: 'IPA', name: 'Ilmu Pengetahuan Alam', kkm: 70 },
            { code: 'BIND', name: 'Bahasa Indonesia', kkm: 75 },
            { code: 'BING', name: 'Bahasa Inggris', kkm: 70 },
            { code: 'IPS', name: 'Ilmu Pengetahuan Sosial', kkm: 70 },
            { code: 'PKN', name: 'Pendidikan Kewarganegaraan', kkm: 75 },
        ];

        for (const subject of defaults) {
            try {
                await fetch('/api/subjects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subject),
                });
            } catch (error) {
                console.error('Error adding default:', error);
            }
        }

        alert('Mapel default berhasil ditambahkan');
        fetchSubjects();
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Kelola Data Mapel</h1>
                <Button onClick={() => router.push('/admin/dashboard')}>
                    ← Kembali ke Dashboard
                </Button>
            </div>

            <div className={styles.formSection}>
                <h2>{editingId ? 'Edit Mapel' : 'Tambah Mapel Baru'}</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Kode (contoh: MAT, IPA)"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                        maxLength={10}
                        disabled={!!editingId}
                    />
                    <input
                        type="text"
                        placeholder="Nama Lengkap (contoh: Matematika)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="KKM (opsional, contoh: 75)"
                        value={formData.kkm || ''}
                        onChange={(e) => setFormData({ ...formData, kkm: e.target.value ? parseFloat(e.target.value) : undefined })}
                        min="0"
                        max="100"
                        step="0.1"
                    />
                    <div className={styles.formButtons}>
                        <Button type="submit">{editingId ? 'Update' : 'Tambah'}</Button>
                        {editingId && (
                            <Button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ code: '', name: '', kkm: undefined });
                                }}
                            >
                                Batal
                            </Button>
                        )}
                        {!editingId && subjects.length === 0 && (
                            <Button type="button" onClick={addDefaultSubjects}>
                                Tambah Mapel Default
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            <div className={styles.tableSection}>
                <h2>Daftar Mapel ({subjects.length})</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama Mapel</th>
                            <th>KKM</th>
                            <th>Digunakan di Tryout</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((subject) => {
                            const usageCount = subject._count?.scores || 0;
                            // Estimate tryouts used (assuming average 30 students per tryout)
                            const estimatedTryouts = usageCount > 0 ? Math.ceil(usageCount / 30) : 0;

                            return (
                                <tr key={subject.id}>
                                    <td><strong>{subject.code}</strong></td>
                                    <td>{subject.name}</td>
                                    <td>
                                        <span title={subject.kkm ? `KKM: ${subject.kkm}` : 'KKM belum diset'}>
                                            {subject.kkm || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.statsCell}>
                                            <span className={styles.mainStat} title={`Total ${usageCount} nilai tersimpan`}>
                                                {usageCount} nilai
                                            </span>
                                            {usageCount > 0 && (
                                                <span className={styles.subStat} title="Estimasi penggunaan di tryout">
                                                    (~{estimatedTryouts} tryout)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.actions}>
                                        <button onClick={() => handleEdit(subject)}>Edit</button>
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            title={usageCount > 0 ? `Perhatian: ${usageCount} nilai akan terhapus` : 'Hapus mapel'}
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
