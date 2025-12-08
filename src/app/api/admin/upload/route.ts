import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const tryoutId = formData.get('tryoutId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
        }

        if (!tryoutId) {
            return NextResponse.json({ error: 'Tryout ID diperlukan' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
            return NextResponse.json({ error: 'Format file tidak valid atau kosong' }, { status: 400 });
        }

        // Get tryout with subjects
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

        // Process Headers (Row 1)
        const headers = jsonData[0] as string[];
        const nisnColIndex = headers.findIndex(h => h && h.toString().toUpperCase() === 'NISN');

        if (nisnColIndex === -1) {
            return NextResponse.json({ error: 'Kolom NISN tidak ditemukan di Excel' }, { status: 400 });
        }

        // Get subject codes from headers
        const excelSubjectCodes = headers
            .map((h, idx) => ({ code: h ? h.toString().toUpperCase() : '', idx }))
            .filter(item => item.code && item.idx !== nisnColIndex);

        // Validate subject codes match tryout subjects
        const tryoutSubjectCodes = tryout.subjects.map(s => s.subject.code);
        const excelCodes = excelSubjectCodes.map(s => s.code);

        const missingInExcel = tryoutSubjectCodes.filter(code => !excelCodes.includes(code));
        const extraInExcel = excelCodes.filter(code => !tryoutSubjectCodes.includes(code));

        if (missingInExcel.length > 0 || extraInExcel.length > 0) {
            let errorMsg = 'Kolom Excel tidak sesuai dengan mapel tryout.\n';
            if (missingInExcel.length > 0) {
                errorMsg += `Kurang: ${missingInExcel.join(', ')}\n`;
            }
            if (extraInExcel.length > 0) {
                errorMsg += `Kelebihan: ${extraInExcel.join(', ')}`;
            }
            return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        // Create subject code to ID mapping
        const subjectMap = new Map(
            tryout.subjects.map(s => [s.subject.code, s.subject.id])
        );

        // Process data rows
        const dataRows = jsonData.slice(1) as any[][];
        const nisnList = dataRows
            .map(row => row[nisnColIndex])
            .filter(nisn => nisn);

        // Validate all NISNs exist
        const students = await prisma.student.findMany({
            where: {
                nisn: { in: nisnList.map(n => n.toString()) }
            }
        });

        if (students.length !== nisnList.length) {
            const foundNisns = new Set(students.map(s => s.nisn));
            const missingNisns = nisnList.filter(n => !foundNisns.has(n.toString()));
            return NextResponse.json({
                error: `NISN tidak ditemukan: ${missingNisns.join(', ')}. Silakan tambahkan di "Kelola Siswa" terlebih dahulu.`
            }, { status: 400 });
        }

        // Create student NISN to ID mapping
        const studentMap = new Map(students.map(s => [s.nisn, s.id]));

        // Prepare scores data
        const scoresData: any[] = [];

        for (const row of dataRows) {
            const nisn = row[nisnColIndex]?.toString();
            if (!nisn) continue;

            const studentId = studentMap.get(nisn);
            if (!studentId) continue;

            for (const subjectInfo of excelSubjectCodes) {
                const scoreValue = row[subjectInfo.idx];
                if (scoreValue === null || scoreValue === undefined || scoreValue === '') continue;

                const numValue = parseFloat(scoreValue);
                if (isNaN(numValue)) continue;

                const subjectId = subjectMap.get(subjectInfo.code);
                if (!subjectId) continue;

                scoresData.push({
                    studentId,
                    tryoutId,
                    subjectId,
                    value: numValue
                });
            }
        }

        if (scoresData.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data nilai yang valid' }, { status: 400 });
        }

        // Delete existing scores for this tryout (if re-uploading)
        await prisma.score.deleteMany({
            where: { tryoutId }
        });

        // Insert new scores
        await prisma.score.createMany({
            data: scoresData
        });

        return NextResponse.json({
            success: true,
            message: `Berhasil upload ${scoresData.length} nilai untuk ${students.length} siswa`
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan saat upload' },
            { status: 500 }
        );
    }
}
