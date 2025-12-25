/*
  Warnings:

  - The primary key for the `book` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `author` on the `book` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `book` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `book` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `book` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `book` table. All the data in the column will be lost.
  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `category` table. All the data in the column will be lost.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `userbook` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `book_id` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `book` DROP FOREIGN KEY `Book_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `userbook` DROP FOREIGN KEY `UserBook_bookId_fkey`;

-- DropForeignKey
ALTER TABLE `userbook` DROP FOREIGN KEY `UserBook_userId_fkey`;

-- DropIndex
DROP INDEX `Book_categoryId_fkey` ON `book`;

-- DropIndex
DROP INDEX `User_username_key` ON `user`;

-- AlterTable
ALTER TABLE `book` DROP PRIMARY KEY,
    DROP COLUMN `author`,
    DROP COLUMN `categoryId`,
    DROP COLUMN `id`,
    DROP COLUMN `picture`,
    DROP COLUMN `title`,
    ADD COLUMN `book_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `book_photo` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `summary` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`book_id`);

-- AlterTable
ALTER TABLE `category` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`category_id`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    DROP COLUMN `createdAt`,
    DROP COLUMN `id`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`user_id`);

-- DropTable
DROP TABLE `userbook`;

-- CreateTable
CREATE TABLE `ReadingList` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `book_id` INTEGER NOT NULL,
    `status` ENUM('TO_READ', 'READING', 'COMPLETED') NOT NULL DEFAULT 'TO_READ',
    `add_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `review` VARCHAR(191) NULL,
    `finish_date` DATETIME(3) NULL,
    `start_date` DATETIME(3) NULL,

    UNIQUE INDEX `ReadingList_user_id_book_id_key`(`user_id`, `book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookCategory` (
    `book_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,

    PRIMARY KEY (`book_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReadingList` ADD CONSTRAINT `ReadingList_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReadingList` ADD CONSTRAINT `ReadingList_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `Book`(`book_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookCategory` ADD CONSTRAINT `BookCategory_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `Book`(`book_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookCategory` ADD CONSTRAINT `BookCategory_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
