'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BarChartProps {
    labels: string[];
    dataBox: number[];
    title?: string;
    color?: string;
}

export const BarChart = ({ labels, dataBox, title, color = 'rgb(59, 130, 246)' }: BarChartProps) => {
    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false,
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

    const data = {
        labels,
        datasets: [
            {
                label: 'Nilai',
                data: dataBox,
                backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.5)'),
                borderColor: color,
                borderWidth: 1,
            },
        ],
    };

    return <Bar options={options} data={data} />;
};
