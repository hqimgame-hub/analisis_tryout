/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TryoutSubject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tryoutId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "TryoutSubject_tryoutId_fkey" FOREIGN KEY ("tryoutId") REFERENCES "Tryout" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TryoutSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nisn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classroom" TEXT NOT NULL
);
INSERT INTO "new_Student" ("classroom", "id", "name", "nisn") SELECT "classroom", "id", "name", "nisn" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_nisn_key" ON "Student"("nisn");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL
);
INSERT INTO "new_User" ("id", "password", "role", "username") SELECT "id", "password", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TryoutSubject_tryoutId_subjectId_key" ON "TryoutSubject"("tryoutId", "subjectId");
