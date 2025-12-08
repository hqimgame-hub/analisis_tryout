import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentData {
    student: {
        name: string;
        nisn: string;
        classroom: string;
    };
    overallAverage: number;
    ranking: {
        classRank: number;
        classTotalStudents: number;
        overallRank: number;
        overallTotalStudents: number;
    };
    subjectAnalysis: {
        strongest: any;
        weakest: any;
    };
    tryouts: any[];
    kkmComparison: any[];
}

export const generateStudentPDF = (data: StudentData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN HASIL TRYOUT', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistem Analisis Tryout Kelas 9', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Student Info
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI SISWA', 20, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nama: ${data.student.name}`, 20, yPos);
    yPos += 6;
    doc.text(`NISN: ${data.student.nisn}`, 20, yPos);
    yPos += 6;
    doc.text(`Kelas: ${data.student.classroom}`, 20, yPos);

    // Statistics
    yPos += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('STATISTIK PRESTASI', 20, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Rata-rata Keseluruhan: ${data.overallAverage.toFixed(1)}`, 20, yPos);
    yPos += 6;
    doc.text(`Ranking di Kelas: #${data.ranking.classRank} dari ${data.ranking.classTotalStudents} siswa`, 20, yPos);
    yPos += 6;
    doc.text(`Ranking Keseluruhan: #${data.ranking.overallRank} dari ${data.ranking.overallTotalStudents} siswa`, 20, yPos);

    // Strength & Weakness
    if (data.subjectAnalysis.strongest && data.subjectAnalysis.weakest) {
        yPos += 12;
        doc.setFont('helvetica', 'bold');
        doc.text('ANALISIS KEKUATAN & KELEMAHAN', 20, yPos);

        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 128, 0);
        doc.text(`✓ Mapel Terkuat: ${data.subjectAnalysis.strongest.name} (${data.subjectAnalysis.strongest.average.toFixed(1)})`, 20, yPos);

        yPos += 6;
        doc.setTextColor(255, 0, 0);
        doc.text(`! Perlu Ditingkatkan: ${data.subjectAnalysis.weakest.name} (${data.subjectAnalysis.weakest.average.toFixed(1)})`, 20, yPos);
        doc.setTextColor(0, 0, 0);
    }

    // KKM Status
    if (data.kkmComparison && data.kkmComparison.length > 0) {
        yPos += 12;
        doc.setFont('helvetica', 'bold');
        doc.text('STATUS KKM', 20, yPos);

        yPos += 5;
        const kkmData = data.kkmComparison.map(item => [
            item.name,
            item.currentValue.toString(),
            item.kkm.toString(),
            item.passedKKM ? '✓ Lulus' : '✗ Belum'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Mata Pelajaran', 'Nilai', 'KKM', 'Status']],
            body: kkmData,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204] },
            styles: { fontSize: 9 },
            columnStyles: {
                3: {
                    cellWidth: 25,
                    halign: 'center'
                }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Tryout History
    if (data.tryouts && data.tryouts.length > 0) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('RIWAYAT TRYOUT', 20, yPos);

        yPos += 5;
        const tryoutData = data.tryouts.map(t => [
            t.name,
            new Date(t.date).toLocaleDateString('id-ID'),
            t.average.toFixed(1)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Nama Tryout', 'Tanggal', 'Rata-rata']],
            body: tryoutData,
            theme: 'striped',
            headStyles: { fillColor: [0, 102, 204] },
            styles: { fontSize: 9 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Recommendations
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('REKOMENDASI', 20, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (data.subjectAnalysis.weakest) {
        doc.text(`• Fokus belajar ${data.subjectAnalysis.weakest.name} untuk meningkatkan nilai`, 20, yPos);
        yPos += 6;
    }

    const failedKKM = data.kkmComparison?.filter(item => !item.passedKKM) || [];
    if (failedKKM.length > 0) {
        const subjects = failedKKM.map(item => item.name).join(', ');
        doc.text(`• Tingkatkan nilai untuk mencapai KKM: ${subjects}`, 20, yPos);
        yPos += 6;
    }

    if (data.ranking.classRank <= 3) {
        doc.text(`• Pertahankan prestasi! Kamu termasuk top 3 di kelas`, 20, yPos);
    } else {
        doc.text(`• Terus belajar untuk meningkatkan ranking di kelas`, 20, yPos);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
            `Halaman ${i} dari ${pageCount} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save PDF
    doc.save(`Laporan_Tryout_${data.student.name.replace(/\s+/g, '_')}.pdf`);
};
