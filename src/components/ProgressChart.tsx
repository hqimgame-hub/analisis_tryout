'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface ProgressChartProps {
    labels: string[];
    dataBox: number[];
    title?: string;
    classAverage?: number[];
}

export const ProgressChart = ({ labels, dataBox, title, classAverage }: ProgressChartProps) => {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: !!title,
                text: title,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
            }
        }
    };

    const datasets = [
        {
            label: 'Nilai Kamu',
            data: dataBox,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3,
        }
    ];

    if (classAverage && classAverage.length > 0) {
        datasets.push({
            label: 'Rata-rata Kelas',
            data: classAverage,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            tension: 0.3,
        });
    }

    const data = {
        labels,
        datasets,
    };

    return <Line options={options} data={data} />;
};
