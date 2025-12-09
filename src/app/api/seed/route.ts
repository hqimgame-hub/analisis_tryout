import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (existingAdmin) {
            return NextResponse.json({
                message: 'Admin user already exists',
                username: 'admin'
            });
        }

        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Admin user created successfully',
            username: admin.username,
            defaultPassword: 'admin123'
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json(
            { error: `Failed to seed: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
