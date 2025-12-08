import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const tryouts = await prisma.tryout.findMany({
            orderBy: { date: 'desc' },
            include: {
                _count: {
                    select: { scores: true } // Total score entries
                },
                scores: {
                    select: { studentId: true },
                    distinct: ['studentId'] // Get unique students
                }
            }
        });

        const data = tryouts.map(t => ({
            id: t.id,
            name: t.name,
            date: t.date,
            totalScores: t._count.scores,
            studentCount: t.scores.length
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Gagal mengambil data tryout' }, { status: 500 });
    }
}
