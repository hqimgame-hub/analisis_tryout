import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all subjects
export async function GET() {
    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { code: 'asc' },
            include: {
                _count: {
                    select: { scores: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Fetch subjects error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data mapel' },
            { status: 500 }
        );
    }
}

// POST create new subject
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, kkm } = body;

        if (!code || !name) {
            return NextResponse.json(
                { error: 'Kode dan Nama Mapel wajib diisi' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.subject.findUnique({
            where: { code }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Kode mapel sudah digunakan' },
                { status: 409 }
            );
        }

        const subject = await prisma.subject.create({
            data: {
                code: code.toUpperCase(),
                name,
                kkm: kkm ? parseFloat(kkm) : null
            }
        });

        return NextResponse.json({ success: true, data: subject });
    } catch (error) {
        console.error('Create subject error:', error);
        return NextResponse.json(
            { error: 'Gagal menambahkan mapel' },
            { status: 500 }
        );
    }
}

// DELETE subject
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID mapel diperlukan' },
                { status: 400 }
            );
        }

        await prisma.subject.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete subject error:', error);
        return NextResponse.json(
            { error: 'Gagal menghapus mapel' },
            { status: 500 }
        );
    }
}

// PUT update subject
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, code, name, kkm } = body;

        if (!id || !code || !name) {
            return NextResponse.json(
                { error: 'Semua field wajib diisi' },
                { status: 400 }
            );
        }

        const subject = await prisma.subject.update({
            where: { id },
            data: {
                code: code.toUpperCase(),
                name,
                kkm: kkm ? parseFloat(kkm) : null
            }
        });

        return NextResponse.json({ success: true, data: subject });
    } catch (error) {
        console.error('Update subject error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupdate mapel' },
            { status: 500 }
        );
    }
}
