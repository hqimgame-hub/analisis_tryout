import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all students
export async function GET() {
    try {
        const students = await prisma.student.findMany({
            orderBy: [
                { classroom: 'asc' },
                { name: 'asc' }
            ],
            include: {
                _count: {
                    select: { scores: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: students });
    } catch (error) {
        console.error('Fetch students error:', error);
        return NextResponse.json(
            { error: 'Gagal mengambil data siswa' },
            { status: 500 }
        );
    }
}

// POST create new student
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nisn, name, classroom } = body;

        if (!nisn || !name || !classroom) {
            return NextResponse.json(
                { error: 'NISN, Nama, dan Kelas wajib diisi' },
                { status: 400 }
            );
        }

        // Check if NISN already exists
        const existing = await prisma.student.findUnique({
            where: { nisn }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'NISN sudah terdaftar' },
                { status: 409 }
            );
        }

        const student = await prisma.student.create({
            data: { nisn, name, classroom }
        });

        return NextResponse.json({ success: true, data: student });
    } catch (error) {
        console.error('Create student error:', error);
        return NextResponse.json(
            { error: 'Gagal menambahkan siswa' },
            { status: 500 }
        );
    }
}

// DELETE student
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID siswa diperlukan' },
                { status: 400 }
            );
        }

        await prisma.student.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete student error:', error);
        return NextResponse.json(
            { error: 'Gagal menghapus siswa' },
            { status: 500 }
        );
    }
}

// PUT update student
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, nisn, name, classroom } = body;

        if (!id || !nisn || !name || !classroom) {
            return NextResponse.json(
                { error: 'Semua field wajib diisi' },
                { status: 400 }
            );
        }

        const student = await prisma.student.update({
            where: { id },
            data: { nisn, name, classroom }
        });

        return NextResponse.json({ success: true, data: student });
    } catch (error) {
        console.error('Update student error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupdate siswa' },
            { status: 500 }
        );
    }
}
