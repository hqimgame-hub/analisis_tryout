import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Params) {
    try {
        const { id } = await params;

        const tryout = await prisma.tryout.findUnique({
            where: { id },
            include: {
                scores: {
                    include: {
                        student: true,
                        subject: true
                    }
                }
            }
        });

        if (!tryout) {
            return NextResponse.json({ error: 'Tryout tidak ditemukan' }, { status: 404 });
        }

        // Group scores by student
        const studentMap = new Map();

        tryout.scores.forEach(score => {
            const key = score.student.nisn;
            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    NISN: score.student.nisn,
                    Nama: score.student.name,
                    Kelas: score.student.classroom,
                });
            }
            studentMap.get(key)[score.subject.code] = score.value;
        });

        const data = Array.from(studentMap.values());

        // Calculate totals and averages
        const subjects = [...new Set(tryout.scores.map(s => s.subject.code))];
        data.forEach(row => {
            let total = 0;
            let count = 0;
            subjects.forEach(subject => {
                if (row[subject]) {
                    total += row[subject];
                    count++;
                }
            });
            row.Total = total;
            row['Rata-rata'] = count > 0 ? (total / count).toFixed(2) : 0;
        });

        return NextResponse.json({
            success: true,
            data: {
                tryoutName: tryout.name,
                tryoutDate: tryout.date,
                students: data
            }
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Gagal export data' },
            { status: 500 }
        );
    }
}
