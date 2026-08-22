-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "key_takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "quote_author" TEXT,
ADD COLUMN     "quote_text" TEXT,
ADD COLUMN     "reading_time_minutes" INTEGER,
ADD COLUMN     "statistics" JSONB;
