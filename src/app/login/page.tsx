'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Login failed');
            }

            router.push('/admin/dashboard');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.pageWrapper}>
            <Header />
            <div className={styles.container}>
                <Card className={styles.loginCard} padding="lg">
                    <h1 className={styles.title}>Admin Login</h1>
                    <p className={styles.subtitle}>Masuk untuk mengelola data tryout.</p>

                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Username"
                            name="username"
                            placeholder="admin"
                            required
                        />
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                        />

                        <Button type="submit" size="lg" isLoading={loading} className={styles.submitBtn}>
                            Masuk
                        </Button>
                    </form>
                </Card>
            </div>
            <Footer />
        </div>
    );
}
