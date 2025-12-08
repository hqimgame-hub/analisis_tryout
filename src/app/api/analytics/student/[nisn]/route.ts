import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { nisn: string } }
) {
    try {
        const student = await prisma.student.findUnique({
            where: { nisn: params.nisn },
            include: {
                scores: {
                    include: {
                        subject: true,
                        tryout: true
                    },
                    orderBy: {
                        tryout: {
                            date: 'asc'
                        }
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
        }

        // Group scores by subject
        const subjectMap = new Map<string, any[]>();

        student.scores.forEach(score => {
            const key = score.subject.code;
            if (!subjectMap.has(key)) {
                subjectMap.set(key, []);
            }
            subjectMap.get(key)!.push({
                tryoutName: score.tryout.name,
                tryoutDate: score.tryout.date,
                value: score.value,
                kkm: score.subject.kkm
            });
        });

        // Calculate trends
        const subjectTrends = Array.from(subjectMap.entries()).map(([code, scores]) => {
            const trend = scores.length >= 2
                ? scores[scores.length - 1].value - scores[0].value
                : 0;

            const average = scores.reduce((sum, s) => sum + s.value, 0) / scores.length;

            return {
                code,
                scores,
                trend,
                average: Math.round(average * 100) / 100,
                improving: trend > 0
            };
        });

        // Get class average for comparison
        const classmates = await prisma.student.findMany({
            where: { classroom: student.classroom },
            include: {
                scores: true
            }
        });

        const classAverage = classmates.reduce((sum, s) => {
            const avg = s.scores.length > 0
                ? s.scores.reduce((scoreSum, score) => scoreSum + score.value, 0) / s.scores.length
                : 0;
            return sum + avg;
        }, 0) / classmates.length;

        const studentAverage = student.scores.length > 0
            ? student.scores.reduce((sum, s) => sum + s.value, 0) / student.scores.length
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                student: {
                    nisn: student.nisn,
                    name: student.name,
                    classroom: student.classroom
                },
                subjectTrends,
                comparison: {
                    studentAverage: Math.round(studentAverage * 100) / 100,
                    classAverage: Math.round(classAverage * 100) / 100,
                    aboveClass: studentAverage > classAverage
                }
            }
        });
    } catch (error) {
        console.error('Student analysis error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data analisis siswa' },
            { status: 500 }
        );
    }
}
