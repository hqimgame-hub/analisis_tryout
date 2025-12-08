import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get all students with their scores
        const students = await prisma.student.findMany({
            include: {
                scores: {
                    include: {
                        subject: true,
                        tryout: true
                    }
                }
            }
        });

        // Group by classroom
        const classMap = new Map<string, any>();

        students.forEach(student => {
            if (!classMap.has(student.classroom)) {
                classMap.set(student.classroom, {
                    classroom: student.classroom,
                    students: [],
                    totalScores: 0,
                    scoreCount: 0
                });
            }

            const classData = classMap.get(student.classroom);
            classData.students.push(student);

            student.scores.forEach(score => {
                classData.totalScores += score.value;
                classData.scoreCount++;
            });
        });

        // Calculate averages and subject breakdown
        const classAnalysis = Array.from(classMap.values()).map(classData => {
            const average = classData.scoreCount > 0
                ? classData.totalScores / classData.scoreCount
                : 0;

            // Subject breakdown
            const subjectMap = new Map<string, { total: number; count: number }>();

            classData.students.forEach((student: any) => {
                student.scores.forEach((score: any) => {
                    const key = score.subject.code;
                    if (!subjectMap.has(key)) {
                        subjectMap.set(key, { total: 0, count: 0 });
                    }
                    const subData = subjectMap.get(key)!;
                    subData.total += score.value;
                    subData.count++;
                });
            });

            const subjectAverages = Array.from(subjectMap.entries()).map(([code, data]) => ({
                code,
                average: data.count > 0 ? data.total / data.count : 0
            }));

            // Top students
            const studentAverages = classData.students.map((student: any) => {
                const scores = student.scores;
                const avg = scores.length > 0
                    ? scores.reduce((sum: number, s: any) => sum + s.value, 0) / scores.length
                    : 0;
                return {
                    nisn: student.nisn,
                    name: student.name,
                    average: avg
                };
            }).sort((a: any, b: any) => b.average - a.average);

            return {
                classroom: classData.classroom,
                studentCount: classData.students.length,
                average: Math.round(average * 100) / 100,
                subjectAverages,
                topStudents: studentAverages.slice(0, 5)
            };
        }).sort((a, b) => b.average - a.average);

        return NextResponse.json({
            success: true,
            data: classAnalysis
        });
    } catch (error) {
        console.error('Class analysis error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data analisis kelas' },
            { status: 500 }
        );
    }
}
