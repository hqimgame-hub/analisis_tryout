import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get overall statistics
        const [
            totalStudents,
            totalTryouts,
            totalSubjects,
            allScores,
            recentTryouts,
            classDistribution
        ] = await Promise.all([
            prisma.student.count(),
            prisma.tryout.count(),
            prisma.subject.count(),
            prisma.score.findMany({
                include: {
                    subject: true,
                    tryout: true,
                    student: true
                }
            }),
            prisma.tryout.findMany({
                take: 5,
                orderBy: { date: 'desc' },
                include: {
                    scores: {
                        include: {
                            subject: true
                        }
                    }
                }
            }),
            prisma.student.groupBy({
                by: ['classroom'],
                _count: true
            })
        ]);

        // Calculate overall average
        const overallAverage = allScores.length > 0
            ? allScores.reduce((sum, score) => sum + score.value, 0) / allScores.length
            : 0;

        // Calculate average per subject
        const subjectAverages = await prisma.subject.findMany({
            include: {
                scores: true
            }
        });

        const subjectStats = subjectAverages.map(subject => {
            const scores = subject.scores;
            const average = scores.length > 0
                ? scores.reduce((sum, s) => sum + s.value, 0) / scores.length
                : 0;

            return {
                code: subject.code,
                name: subject.name,
                average: Math.round(average * 100) / 100,
                count: scores.length,
                kkm: subject.kkm || 0
            };
        }).sort((a, b) => b.average - a.average);

        // Calculate trend data (last 5 tryouts)
        const trendData = recentTryouts.map(tryout => {
            const scores = tryout.scores;
            const average = scores.length > 0
                ? scores.reduce((sum, s) => sum + s.value, 0) / scores.length
                : 0;

            return {
                name: tryout.name,
                date: tryout.date,
                average: Math.round(average * 100) / 100
            };
        }).reverse(); // Oldest first for chart

        // Class distribution
        const classStats = classDistribution.map(item => ({
            classroom: item.classroom,
            count: item._count
        }));

        // Students below KKM
        const belowKKM = allScores.filter(score => {
            const kkm = score.subject.kkm;
            return kkm && score.value < kkm;
        });

        const belowKKMBySubject = subjectAverages.map(subject => {
            const kkm = subject.kkm || 0;
            const belowCount = subject.scores.filter(s => s.value < kkm).length;
            return {
                code: subject.code,
                name: subject.name,
                count: belowCount,
                kkm
            };
        }).filter(item => item.count > 0);

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalStudents,
                    totalTryouts,
                    totalSubjects,
                    overallAverage: Math.round(overallAverage * 100) / 100,
                    totalScores: allScores.length
                },
                subjectStats,
                trendData,
                classStats,
                belowKKM: {
                    total: belowKKM.length,
                    bySubject: belowKKMBySubject
                }
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data analytics' },
            { status: 500 }
        );
    }
}
