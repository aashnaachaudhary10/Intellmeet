/*
  Warnings:

  - You are about to drop the column `hostId` on the `meetings` table. All the data in the column will be lost.
  - Added the required column `host` to the `meetings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_hostId_fkey";

-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "hostId",
ADD COLUMN     "host" VARCHAR(255) NOT NULL;
