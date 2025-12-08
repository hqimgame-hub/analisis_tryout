'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';

interface Student {
    id: string;
    nisn: string;
    name: string;
    classroom: string;
    _count?: { scores: number };
}

export default function StudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nisn: '', name: '', classroom: '' });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        // Apply filters
        let filtered = students;

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.nisn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedClass) {
            filtered = filtered.filter(s => s.classroom === selectedClass);
        }

        setFilteredStudents(filtered);
    }, [students, searchTerm, selectedClass]);

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            const data = await res.json();
            if (data.success) {
                setStudents(data.data);
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

        try {
            const res = await fetch('/api/students/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchStudents();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = '/api/students';
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
                alert(editingId ? 'Siswa berhasil diupdate' : 'Siswa berhasil ditambahkan');
                setFormData({ nisn: '', name: '', classroom: '' });
                setEditingId(null);
                fetchStudents();
            } else {
                alert(data.error || 'Gagal menyimpan data');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        }
    };

    const handleEdit = (student: Student) => {
        setEditingId(student.id);
        setFormData({
            nisn: student.nisn,
            name: student.name,
            classroom: student.classroom,
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus siswa ini?')) return;

        try {
            const res = await fetch(`/api/students?id=${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (data.success) {
                alert('Siswa berhasil dihapus');
                fetchStudents();
            } else {
                alert(data.error || 'Gagal menghapus');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Kelola Data Siswa</h1>
                <div className={styles.headerActions}>
                    <Button onClick={() => {
                        window.location.href = '/api/download/template?type=students';
                    }}>
                        📥 Download Daftar Siswa
                    </Button>
                    <Button onClick={() => router.push('/admin/dashboard')}>
                        ← Kembali ke Dashboard
                    </Button>
                </div>
            </div>

            <div className={styles.uploadSection}>
                <h2>Upload Excel (NISN, NAMA, KELAS)</h2>
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className={styles.fileInput}
                />
                {uploading && <span className={styles.uploadingText}>Uploading...</span>}
            </div>

            <div className={styles.formSection}>
                <h2>{editingId ? 'Edit Siswa' : 'Tambah Siswa Manual'}</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="NISN"
                        value={formData.nisn}
                        onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                        required
                        disabled={!!editingId}
                    />
                    <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Kelas (contoh: 9A)"
                        value={formData.classroom}
                        onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                        required
                    />
                    <div className={styles.formButtons}>
                        <Button type="submit">{editingId ? 'Update' : 'Tambah'}</Button>
                        {editingId && (
                            <Button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ nisn: '', name: '', classroom: '' });
                                }}
                            >
                                Batal
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <h2>Daftar Siswa ({filteredStudents.length} dari {students.length})</h2>
                    <div className={styles.filterBar}>
                        <input
                            type="text"
                            placeholder="🔍 Cari NISN atau Nama..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">Semua Kelas</option>
                            {[...new Set(students.map(s => s.classroom))].sort().map(classroom => (
                                <option key={classroom} value={classroom}>{classroom}</option>
                            ))}
                        </select>
                        {(searchTerm || selectedClass) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedClass('');
                                }}
                                className={styles.resetButton}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>NISN</th>
                            <th>Nama</th>
                            <th>Kelas</th>
                            <th>Total Nilai Tersimpan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((student) => {
                            const totalScores = student._count?.scores || 0;
                            // Estimate tryouts participated (assuming average 5 subjects per tryout)
                            const estimatedTryouts = totalScores > 0 ? Math.ceil(totalScores / 5) : 0;

                            return (
                                <tr key={student.id}>
                                    <td>{student.nisn}</td>
                                    <td>
                                        <a
                                            href={`/admin/student/${student.nisn}`}
                                            className={styles.studentLink}
                                        >
                                            {student.name}
                                        </a>
                                    </td>
                                    <td>{student.classroom}</td>
                                    <td>
                                        <div className={styles.statsCell}>
                                            <span className={styles.mainStat} title={`Total ${totalScores} nilai tersimpan`}>
                                                {totalScores}
                                            </span>
                                            {totalScores > 0 && (
                                                <span className={styles.subStat} title="Estimasi tryout yang diikuti">
                                                    (~{estimatedTryouts} tryout)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.actions}>
                                        <button onClick={() => handleEdit(student)}>Edit</button>
                                        <button
                                            onClick={() => handleDelete(student.id)}
                                            title={totalScores > 0 ? `Perhatian: ${totalScores} nilai akan terhapus` : 'Hapus siswa'}
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
