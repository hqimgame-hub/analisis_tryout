import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to define param type
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
                        subject: true,
                    }
                }
            }
        });

        if (!tryout) {
            return NextResponse.json({ error: 'Tryout tidak ditemukan' }, { status: 404 });
        }

        // Extract Subjects info
        const subjectsMap = new Map<string, string>(); // Name -> ID (or vice versa for display)
        // We want unique subjects
        const uniqueSubjects: { id: string, name: string }[] = [];
        const seenSubs = new Set<string>();

        tryout.scores.forEach(s => {
            if (!seenSubs.has(s.subject.id)) {
                seenSubs.add(s.subject.id);
                uniqueSubjects.push({ id: s.subject.id, name: s.subject.name });
            }
        });

        // Sort subjects by name
        uniqueSubjects.sort((a, b) => a.name.localeCompare(b.name));

        // Group Scores by Student
        const studentsMap = new Map<string, any>();

        tryout.scores.forEach(s => {
            if (!studentsMap.has(s.student.id)) {
                studentsMap.set(s.student.id, {
                    id: s.student.id,
                    nisn: s.student.nisn,
                    name: s.student.name,
                    classroom: s.student.classroom,
                    scores: {}
                });
            }
            const studentEntry = studentsMap.get(s.student.id);
            studentEntry.scores[s.subject.name] = s.value;
        });

        const students = Array.from(studentsMap.values());

        // Sort by Total Score or Name? Let's default to Name for now, or Classroom.
        students.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            success: true,
            data: {
                tryout: { name: tryout.name, date: tryout.date },
                subjects: uniqueSubjects,
                students: students
            }
        });

    } catch (error) {
        console.error('Fetch detail error:', error);
        return NextResponse.json({ error: 'Gagal mengambil detail data' }, { status: 500 });
    }
}
