const { PrismaClient } = require('@prisma/client');

// Mock process.env for the check
process.env.DATABASE_URL = "file:./dev.db";

const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking database connection...");
        const userCount = await prisma.user.count();
        console.log(`Total users: ${userCount}`);

        const admin = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (admin) {
            console.log("Admin user FOUND.");
            console.log("ID:", admin.id);
            console.log("Role:", admin.role);
            console.log("Password Hash:", admin.password.substring(0, 10) + "...");
        } else {
            console.log("Admin user NOT FOUND.");
        }
    } catch (e) {
        console.error("Error connecting or querying:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
