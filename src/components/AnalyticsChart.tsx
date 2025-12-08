import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface ChartProps {
    type: 'line' | 'bar' | 'pie';
    data: any;
    options?: any;
}

export default function AnalyticsChart({ type, data, options }: ChartProps) {
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        ...options
    };

    if (type === 'line') {
        return <Line data={data} options={defaultOptions} />;
    }

    if (type === 'bar') {
        return <Bar data={data} options={defaultOptions} />;
    }

    if (type === 'pie') {
        return <Pie data={data} options={defaultOptions} />;
    }

    return null;
}
