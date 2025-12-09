import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Run raw SQL migration
        await prisma.$executeRawUnsafe(`
-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL,
    "nisn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classroom" TEXT NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Tryout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tryout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kkm" DOUBLE PRECISION,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Score" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "studentId" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TryoutSubject" (
    "id" TEXT NOT NULL,
    "tryoutId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "TryoutSubject_pkey" PRIMARY KEY ("id")
);
        `);

        // Create indexes
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Student_nisn_key" ON "Student"("nisn");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Subject_code_key" ON "Subject"("code");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Score_studentId_tryoutId_subjectId_key" ON "Score"("studentId", "tryoutId", "subjectId");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "TryoutSubject_tryoutId_subjectId_key" ON "TryoutSubject"("tryoutId", "subjectId");`);

        // Add foreign keys
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Score_studentId_fkey') THEN
                    ALTER TABLE "Score" ADD CONSTRAINT "Score_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Score_tryoutId_fkey') THEN
                    ALTER TABLE "Score" ADD CONSTRAINT "Score_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Score_subjectId_fkey') THEN
                    ALTER TABLE "Score" ADD CONSTRAINT "Score_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TryoutSubject_tryoutId_fkey') THEN
                    ALTER TABLE "TryoutSubject" ADD CONSTRAINT "TryoutSubject_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TryoutSubject_subjectId_fkey') THEN
                    ALTER TABLE "TryoutSubject" ADD CONSTRAINT "TryoutSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);

        return NextResponse.json({
            success: true,
            message: 'Database migration completed successfully'
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            { error: `Migration failed: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
