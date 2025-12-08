import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

// Download template for student list
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tryoutId = searchParams.get('tryoutId');

    try {
        if (type === 'students') {
            // Download all students
            const students = await prisma.student.findMany({
                orderBy: { classroom: 'asc' }
            });

            const data = students.map(s => ({
                NISN: s.nisn,
                NAMA: s.name,
                KELAS: s.classroom
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Siswa');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': 'attachment; filename="Daftar_Siswa.xlsx"'
                }
            });
        }

        if (type === 'template' && tryoutId) {
            // Download template for specific tryout
            const tryout = await prisma.tryout.findUnique({
                where: { id: tryoutId },
                include: {
                    subjects: {
                        include: {
                            subject: true
                        }
                    }
                }
            });

            if (!tryout) {
                return NextResponse.json({ error: 'Tryout tidak ditemukan' }, { status: 404 });
            }

            const students = await prisma.student.findMany({
                orderBy: { classroom: 'asc' }
            });

            // Create header row
            const headers = ['NISN', ...tryout.subjects.map(s => s.subject.code)];

            // Create data rows with NISN only
            const data = students.map(s => {
                const row: any = { NISN: s.nisn };
                tryout.subjects.forEach(sub => {
                    row[sub.subject.code] = ''; // Empty cells for scores
                });
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            const filename = `Template_${tryout.name.replace(/\s+/g, '_')}.xlsx`;

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Gagal download template' },
            { status: 500 }
        );
    }
}
