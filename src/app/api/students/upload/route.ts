import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'File wajib diupload' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'File Excel kosong' }, { status: 400 });
        }

        let successCount = 0;
        let skipCount = 0;
        const errors: string[] = [];

        for (const row of data as any[]) {
            const nisn = String(row.NISN || '').trim();
            const name = String(row.NAMA || '').trim();
            const classroom = String(row.KELAS || '').trim();

            if (!nisn || !name || !classroom) {
                errors.push(`Baris dengan NISN "${nisn}": Data tidak lengkap`);
                continue;
            }

            try {
                // Check if already exists
                const existing = await prisma.student.findUnique({
                    where: { nisn }
                });

                if (existing) {
                    skipCount++;
                    continue;
                }

                await prisma.student.create({
                    data: { nisn, name, classroom }
                });

                successCount++;
            } catch (err) {
                errors.push(`NISN ${nisn}: ${err instanceof Error ? err.message : 'Error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil: ${successCount} siswa, Dilewati: ${skipCount} siswa (sudah ada)`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Upload students error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan saat memproses file' },
            { status: 500 }
        );
    }
}
