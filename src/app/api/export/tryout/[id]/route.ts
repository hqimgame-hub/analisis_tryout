// src/app/api/export/tryout/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    try {
        const { id } = context.params;

        const tryout = await prisma.tryout.findUnique({
            where: { id },
            include: {
                scores: {
                    include: {
                        student: true,
                        subject: true,
                    },
                },
            },
        });

        if (!tryout) {
            return NextResponse.json({ error: 'Tryout tidak ditemukan' }, { status: 404 });
        }

        // Group scores by student
        const studentMap = new Map<string, any>();

        tryout.scores.forEach(score => {
            // gunakan nisn kalau ada, fallback ke id siswa jika perlu
            const key = score.student?.nisn ?? `student-${score.student?.id ?? Math.random()}`;

            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    NISN: score.student?.nisn ?? null,
                    Nama: score.student?.name ?? 'Unknown',
                    Kelas: score.student?.classroom ?? null,
                });
            }
            const studentData = studentMap.get(key);
            if (studentData) {
                // pastikan value numerik jika mungkin
                studentData[score.subject.code] = typeof score.value === 'number' ? score.value : Number(score.value) || 0;
            }
        });

        const data = Array.from(studentMap.values());

        // Calculate totals and averages
        const subjects = [...new Set(tryout.scores.map(s => s.subject.code))];
        data.forEach((row: any) => {
            let total = 0;
            let count = 0;
            subjects.forEach(subject => {
                if (row[subject] !== undefined && row[subject] !== null) {
                    total += Number(row[subject]) || 0;
                    count++;
                }
            });
            row.Total = total;
            row['Rata-rata'] = count > 0 ? (total / count).toFixed(2) : '0.00';
        });

        return NextResponse.json({
            success: true,
            data: {
                tryoutName: tryout.name,
                // serialisasi date ke ISO string supaya JSON-safe
                tryoutDate: tryout.date ? new Date(tryout.date).toISOString() : null,
                students: data,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Gagal export data' }, { status: 500 });
    }
}
