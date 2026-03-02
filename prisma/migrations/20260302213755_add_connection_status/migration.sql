-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "agency_connections" ADD COLUMN     "status" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED';
