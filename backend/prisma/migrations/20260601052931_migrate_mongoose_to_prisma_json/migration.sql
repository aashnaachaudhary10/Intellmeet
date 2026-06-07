/*
  Warnings:

  - The `participants` column on the `meetings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `recordingParts` column on the `meetings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `keyPoints` column on the `meetings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `actionItems` column on the `meetings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "chatMessages" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "participants",
ADD COLUMN     "participants" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "recordingParts",
ADD COLUMN     "recordingParts" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "keyPoints",
ADD COLUMN     "keyPoints" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "actionItems",
ADD COLUMN     "actionItems" JSONB NOT NULL DEFAULT '[]';
