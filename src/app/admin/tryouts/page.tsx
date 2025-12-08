'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';

interface Subject {
    id: string;
    code: string;
    name: string;
}

interface Tryout {
    id: string;
    name: string;
    date: string;
    subjects: Array<{
        subject: Subject;
    }>;
    _count?: { scores: number };
}

export default function TryoutsManagePage() {
    const router = useRouter();
    const [tryouts, setTryouts] = useState<Tryout[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        subjectIds: [] as string[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tryoutsRes, subjectsRes] = await Promise.all([
                fetch('/api/tryouts/manage'),
                fetch('/api/subjects')
            ]);

            const tryoutsData = await tryoutsRes.json();
            const subjectsData = await subjectsRes.json();

            if (tryoutsData.success) setTryouts(tryoutsData.data);
            if (subjectsData.success) setSubjects(subjectsData.data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.subjectIds.length === 0) {
            alert('Pilih minimal 1 mapel');
            return;
        }

        const url = '/api/tryouts/manage';
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
                alert(editingId ? 'Tryout berhasil diupdate' : 'Tryout berhasil dibuat');
                setFormData({ name: '', date: '', subjectIds: [] });
                setEditingId(null);
                setShowForm(false);
                fetchData();
            } else {
                alert(data.error || 'Gagal menyimpan');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        }
    };

    const handleEdit = (tryout: Tryout) => {
        setEditingId(tryout.id);
        setFormData({
            name: tryout.name,
            date: new Date(tryout.date).toISOString().split('T')[0],
            subjectIds: tryout.subjects.map(s => s.subject.id)
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus tryout ini? Semua nilai akan ikut terhapus.')) return;

        try {
            const res = await fetch(`/api/tryouts/manage?id=${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (data.success) {
                alert('Tryout berhasil dihapus');
                fetchData();
            } else {
                alert(data.error || 'Gagal menghapus');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        }
    };

    const toggleSubject = (subjectId: string) => {
        setFormData(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(subjectId)
                ? prev.subjectIds.filter(id => id !== subjectId)
                : [...prev.subjectIds, subjectId]
        }));
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Kelola Tryout</h1>
                <div className={styles.headerActions}>
                    <Button onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData({ name: '', date: '', subjectIds: [] });
                    }}>
                        {showForm ? 'Tutup Form' : '+ Buat Tryout Baru'}
                    </Button>
                    <Button onClick={() => router.push('/admin/dashboard')}>
                        ← Dashboard
                    </Button>
                </div>
            </div>

            {showForm && (
                <div className={styles.formSection}>
                    <h2>{editingId ? 'Edit Tryout' : 'Buat Tryout Baru'}</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Nama Tryout</label>
                            <input
                                type="text"
                                placeholder="Contoh: Tryout 1 - Semester Ganjil"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Tanggal</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Pilih Mata Pelajaran</label>
                            <div className={styles.subjectGrid}>
                                {subjects.map(subject => (
                                    <label key={subject.id} className={styles.subjectCheckbox}>
                                        <input
                                            type="checkbox"
                                            checked={formData.subjectIds.includes(subject.id)}
                                            onChange={() => toggleSubject(subject.id)}
                                        />
                                        <span>{subject.code} - {subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formButtons}>
                            <Button type="submit">{editingId ? 'Update' : 'Buat Tryout'}</Button>
                            <Button type="button" onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setFormData({ name: '', date: '', subjectIds: [] });
                            }}>
                                Batal
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.tryoutsList}>
                <h2>Daftar Tryout ({tryouts.length})</h2>
                {tryouts.map(tryout => (
                    <div key={tryout.id} className={styles.tryoutCard}>
                        <div className={styles.tryoutHeader}>
                            <div>
                                <h3>{tryout.name}</h3>
                                <p className={styles.tryoutDate}>
                                    {new Date(tryout.date).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className={styles.tryoutActions}>
                                <Button onClick={() => router.push(`/admin/tryouts/${tryout.id}/upload`)}>
                                    📤 Upload Nilai
                                </Button>
                                <button onClick={() => handleEdit(tryout)} className={styles.editBtn}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(tryout.id)} className={styles.deleteBtn}>
                                    Hapus
                                </button>
                            </div>
                        </div>

                        <div className={styles.tryoutInfo}>
                            <div className={styles.subjectTags}>
                                <strong>Mapel:</strong>
                                {tryout.subjects.map(s => (
                                    <span key={s.subject.id} className={styles.subjectTag}>
                                        {s.subject.code}
                                    </span>
                                ))}
                            </div>
                            <div className={styles.scoreCount}>
                                {tryout._count?.scores || 0} nilai tersimpan
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
