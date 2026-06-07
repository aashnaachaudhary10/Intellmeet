-- Force-reset non-user tables for UUID migration
-- Preserves users, deletes meetings/tasks/refresh_tokens

DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "meetings" CASCADE;

-- Users already has UUID, no change needed

-- Meetings: recreate with UUID
CREATE TABLE "meetings" (
  "id" VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::text,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "meetingCode" VARCHAR(50) NOT NULL UNIQUE,
  "hostId" VARCHAR(255) NOT NULL,
  "participants" JSONB NOT NULL DEFAULT '[]',
  "status" VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "duration" INTEGER NOT NULL DEFAULT 0,
  "transcript" TEXT NOT NULL DEFAULT '',
  "recordingFolder" TEXT NOT NULL DEFAULT '',
  "recordingParts" JSONB NOT NULL DEFAULT '[]',
  "summary" TEXT NOT NULL DEFAULT '',
  "keyPoints" JSONB NOT NULL DEFAULT '[]',
  "actionItems" JSONB NOT NULL DEFAULT '[]',
  "chatMessages" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "meetings_meetingCode_key" ON "meetings"("meetingCode");

-- Tasks: recreate with UUID
CREATE TABLE "tasks" (
  "id" VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::text,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "status" VARCHAR(50) NOT NULL DEFAULT 'todo',
  "userId" VARCHAR(255) NOT NULL,
  "meetingId" VARCHAR(255),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- RefreshTokens: recreate with UUID
CREATE TABLE "refresh_tokens" (
  "id" VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::text,
  "token" TEXT NOT NULL UNIQUE,
  "userId" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
