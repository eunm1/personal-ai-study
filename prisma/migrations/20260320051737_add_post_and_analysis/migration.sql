-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'ANALYZING', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "searchIndex" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'admin',
    "password" TEXT NOT NULL DEFAULT 'admin',
    "categoryId" INTEGER,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAnalysis" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "style" TEXT,
    "summary" TEXT,
    "imagePrompt" TEXT,
    "tempImageUrl" TEXT,
    "imageUrl" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PostAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PostAnalysis_postId_key" ON "PostAnalysis"("postId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnalysis" ADD CONSTRAINT "PostAnalysis_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
