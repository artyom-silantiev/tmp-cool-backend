-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "JwtType" AS ENUM ('USER_AUTH', 'USER_ACTIVATION', 'USER_RECOVERY');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SEND_EMAIL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('OTHER', 'IMAGE', 'VIDEO', 'AUDIO');

-- CreateTable
CREATE TABLE "Seed" (
    "id" SERIAL NOT NULL,
    "seed" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "email" VARCHAR(255) NOT NULL,
    "emailActivatedAt" TIMESTAMP(3),
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "phone" VARCHAR(16),
    "passwordHash" VARCHAR(72) NOT NULL,
    "loggedAt" TIMESTAMP(3),
    "imageId" BIGINT,
    "isSim" BOOLEAN NOT NULL DEFAULT false,
    "isClean" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jwt" (
    "id" BIGSERIAL NOT NULL,
    "type" "JwtType" NOT NULL,
    "uid" VARCHAR(32) NOT NULL,
    "expirationAt" TIMESTAMP(3) NOT NULL,
    "userId" BIGINT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jwt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "value" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" BIGSERIAL NOT NULL,
    "type" "TaskType" NOT NULL DEFAULT 'SEND_EMAIL',
    "data" JSON NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "forNodeUid" VARCHAR(32),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isFail" BOOLEAN NOT NULL DEFAULT false,
    "lastStartAt" TIMESTAMP(3),
    "failAt" TIMESTAMP(3),
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileRef" (
    "id" BIGSERIAL NOT NULL,
    "uid" VARCHAR(20) NOT NULL,
    "fileId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" BIGSERIAL NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "mime" VARCHAR(255) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" INTEGER,
    "pathToFile" VARCHAR(255) NOT NULL,
    "type" "MediaType" NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_isClean_idx" ON "User"("isClean");

-- CreateIndex
CREATE INDEX "User_isSim_idx" ON "User"("isSim");

-- CreateIndex
CREATE UNIQUE INDEX "Jwt_uid_key" ON "Jwt"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Jwt_type_uid_key" ON "Jwt"("type", "uid");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_name_key" ON "Setting"("name");

-- CreateIndex
CREATE INDEX "Task_type_idx" ON "Task"("type");

-- CreateIndex
CREATE INDEX "Task_isActive_idx" ON "Task"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FileRef_uid_key" ON "FileRef"("uid");

-- CreateIndex
CREATE INDEX "File_sha256_idx" ON "File"("sha256");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "FileRef"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jwt" ADD CONSTRAINT "Jwt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileRef" ADD CONSTRAINT "FileRef_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
