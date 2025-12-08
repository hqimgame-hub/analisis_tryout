import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all tryouts with subjects
export async function GET() {
    try {
        const tryouts = await prisma.tryout.findMany({
            include: {
                subjects: {
                    include: {
                        subject: true
                    }
                },
                _count: {
                    select: { scores: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json({ success: true, data: tryouts });
    } catch (error) {
        console.error('Fetch tryouts error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data tryout' },
            { status: 500 }
        );
    }
}

// POST create new tryout
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, date, subjectIds } = body;

        if (!name || !date || !subjectIds || subjectIds.length === 0) {
            return NextResponse.json(
                { error: 'Nama, tanggal, dan mapel wajib diisi' },
                { status: 400 }
            );
        }

        // Create tryout with subjects
        const tryout = await prisma.tryout.create({
            data: {
                name,
                date: new Date(date),
                subjects: {
                    create: subjectIds.map((subjectId: string) => ({
                        subjectId
                    }))
                }
            },
            include: {
                subjects: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, data: tryout });
    } catch (error) {
        console.error('Create tryout error:', error);
        return NextResponse.json(
            { error: 'Gagal membuat tryout' },
            { status: 500 }
        );
    }
}

// PUT update tryout
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, date, subjectIds } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'ID tryout diperlukan' },
                { status: 400 }
            );
        }

        // Update tryout
        const updateData: any = {};
        if (name) updateData.name = name;
        if (date) updateData.date = new Date(date);

        // If subjects provided, update them
        if (subjectIds) {
            // Delete existing subjects
            await prisma.tryoutSubject.deleteMany({
                where: { tryoutId: id }
            });

            // Create new subjects
            updateData.subjects = {
                create: subjectIds.map((subjectId: string) => ({
                    subjectId
                }))
            };
        }

        const tryout = await prisma.tryout.update({
            where: { id },
            data: updateData,
            include: {
                subjects: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, data: tryout });
    } catch (error) {
        console.error('Update tryout error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupdate tryout' },
            { status: 500 }
        );
    }
}

// DELETE tryout
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID tryout diperlukan' },
                { status: 400 }
            );
        }

        await prisma.tryout.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete tryout error:', error);
        return NextResponse.json(
            { error: 'Gagal menghapus tryout' },
            { status: 500 }
        );
    }
}
