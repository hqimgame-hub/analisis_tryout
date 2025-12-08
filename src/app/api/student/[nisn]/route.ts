import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
    params: Promise<{ nisn: string }>
}

export async function GET(request: Request, { params }: Params) {
    try {
        const { nisn } = await params;

        const student = await prisma.student.findUnique({
            where: { nisn },
            include: {
                scores: {
                    include: {
                        tryout: true,
                        subject: true,
                    }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
        }

        // Group Scores by Tryout
        const tryoutMap = new Map<string, any>();

        student.scores.forEach(s => {
            if (!tryoutMap.has(s.tryout.id)) {
                tryoutMap.set(s.tryout.id, {
                    id: s.tryout.id,
                    name: s.tryout.name,
                    date: s.tryout.date,
                    scores: [],
                    total: 0,
                    count: 0
                });
            }
            const t = tryoutMap.get(s.tryout.id);
            t.scores.push({
                subject: s.subject.name,
                subjectCode: s.subject.code,
                value: s.value
            });
            t.total += s.value;
            t.count += 1;
        });

        const tryouts = Array.from(tryoutMap.values()).map(t => ({
            ...t,
            average: t.count > 0 ? t.total / t.count : 0
        }));

        // Sort tryouts by date
        tryouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate overall average
        const overallAverage = tryouts.length > 0
            ? tryouts.reduce((sum, t) => sum + t.average, 0) / tryouts.length
            : 0;

        // Get subject progress (average per subject across all tryouts)
        const subjectProgress = new Map<string, { code: string, name: string, values: number[] }>();

        student.scores.forEach(s => {
            if (!subjectProgress.has(s.subject.code)) {
                subjectProgress.set(s.subject.code, {
                    code: s.subject.code,
                    name: s.subject.name,
                    values: []
                });
            }
        });

        // Fill subject values per tryout
        tryouts.forEach(tryout => {
            tryout.scores.forEach((score: any) => {
                const subj = subjectProgress.get(score.subjectCode);
                if (subj) {
                    subj.values.push(score.value);
                }
            });
        });

        const subjectProgressArray = Array.from(subjectProgress.values());

        // Calculate class ranking
        const classStudents = await prisma.student.findMany({
            where: { classroom: student.classroom },
            include: {
                scores: {
                    include: {
                        tryout: true
                    }
                }
            }
        });

        const classAverages = classStudents.map(s => {
            const studentTryouts = new Map<string, { total: number, count: number }>();
            s.scores.forEach(score => {
                if (!studentTryouts.has(score.tryout.id)) {
                    studentTryouts.set(score.tryout.id, { total: 0, count: 0 });
                }
                const t = studentTryouts.get(score.tryout.id)!;
                t.total += score.value;
                t.count += 1;
            });

            const tryoutAverages = Array.from(studentTryouts.values()).map(t =>
                t.count > 0 ? t.total / t.count : 0
            );
            const avg = tryoutAverages.length > 0
                ? tryoutAverages.reduce((sum, a) => sum + a, 0) / tryoutAverages.length
                : 0;

            return { nisn: s.nisn, average: avg };
        });

        classAverages.sort((a, b) => b.average - a.average);
        const classRank = classAverages.findIndex(s => s.nisn === nisn) + 1;

        // Calculate overall ranking (all students)
        const allStudents = await prisma.student.findMany({
            include: {
                scores: {
                    include: {
                        tryout: true
                    }
                }
            }
        });

        const allAverages = allStudents.map(s => {
            const studentTryouts = new Map<string, { total: number, count: number }>();
            s.scores.forEach(score => {
                if (!studentTryouts.has(score.tryout.id)) {
                    studentTryouts.set(score.tryout.id, { total: 0, count: 0 });
                }
                const t = studentTryouts.get(score.tryout.id)!;
                t.total += score.value;
                t.count += 1;
            });

            const tryoutAverages = Array.from(studentTryouts.values()).map(t =>
                t.count > 0 ? t.total / t.count : 0
            );
            const avg = tryoutAverages.length > 0
                ? tryoutAverages.reduce((sum, a) => sum + a, 0) / tryoutAverages.length
                : 0;

            return { nisn: s.nisn, average: avg };
        });

        allAverages.sort((a, b) => b.average - a.average);
        const overallRank = allAverages.findIndex(s => s.nisn === nisn) + 1;

        // Calculate class average per tryout for comparison
        const classAveragePerTryout = tryouts.map(tryout => {
            const tryoutScores = classStudents.flatMap(s =>
                s.scores.filter(score => score.tryout.id === tryout.id)
            );
            const classAvg = tryoutScores.length > 0
                ? tryoutScores.reduce((sum, s) => sum + s.value, 0) / tryoutScores.length
                : 0;
            return classAvg;
        });

        // Analyze subject strengths and weaknesses
        const subjectAnalysis = subjectProgressArray.map(subject => {
            const avg = subject.values.reduce((sum, v) => sum + v, 0) / subject.values.length;
            const trend = subject.values.length >= 2
                ? subject.values[subject.values.length - 1] - subject.values[subject.values.length - 2]
                : 0;
            return {
                code: subject.code,
                name: subject.name,
                average: avg,
                trend,
                trendLabel: trend > 5 ? 'Naik' : trend < -5 ? 'Turun' : 'Stabil'
            };
        });

        subjectAnalysis.sort((a, b) => b.average - a.average);
        const strongest = subjectAnalysis[0];
        const weakest = subjectAnalysis[subjectAnalysis.length - 1];

        // Get KKM data and compare
        const subjects = await prisma.subject.findMany();
        const subjectKKM = new Map(subjects.map(s => [s.code, s.kkm || 75]));

        const kkmComparison = subjectProgressArray.map(subject => {
            const kkm = subjectKKM.get(subject.code) || 75;
            const latestValue = subject.values[subject.values.length - 1] || 0;
            const avg = subject.values.reduce((sum, v) => sum + v, 0) / subject.values.length;
            return {
                code: subject.code,
                name: subject.name,
                kkm,
                currentValue: latestValue,
                average: avg,
                passedKKM: latestValue >= kkm,
                gap: latestValue - kkm
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                student: {
                    name: student.name,
                    classroom: student.classroom,
                    nisn: student.nisn
                },
                tryouts,
                overallAverage,
                subjectProgress: subjectProgressArray,
                ranking: {
                    classRank,
                    classTotalStudents: classAverages.length,
                    overallRank,
                    overallTotalStudents: allAverages.length
                },
                classComparison: {
                    studentAverages: tryouts.map(t => t.average),
                    classAverages: classAveragePerTryout
                },
                subjectAnalysis: {
                    strongest,
                    weakest,
                    all: subjectAnalysis
                },
                kkmComparison
            }
        });

    } catch (error) {
        console.error('Fetch student error:', error);
        return NextResponse.json({ error: 'Gagal mengambil data siswa' }, { status: 500 });
    }
}
