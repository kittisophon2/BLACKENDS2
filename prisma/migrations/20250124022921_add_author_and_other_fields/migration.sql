/*
  Warnings:

  - Added the required column `title` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `book` ADD COLUMN `author` VARCHAR(191) NULL,
    ADD COLUMN `publish_year` INTEGER NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL;
