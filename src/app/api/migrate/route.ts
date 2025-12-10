import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET() {
    try {
        // Use Prisma db push to sync schema to database
        // This uses proper connection handling and permissions
        const result = await new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
            const process = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.DATABASE_URL,
                },
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Process exited with code ${code}\n${stderr}`));
                }
            });

            process.on('error', (error) => {
                reject(error);
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Database schema pushed successfully',
            details: result.stdout
        });
    } catch (error) {
        console.error('DB push error:', error);
        return NextResponse.json(
            {
                error: `DB push failed: ${error instanceof Error ? error.message : String(error)}`,
                suggestion: 'Please run migration manually using Vercel CLI or check database permissions'
            },
            { status: 500 }
        );
    }
}
