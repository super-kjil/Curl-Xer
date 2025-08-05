-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 03, 2025 at 06:14 AM
-- Server version: 8.0.30
-- PHP Version: 8.3.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET time_zone = "+07:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;

--
-- Database: `domain_checker`
--

-- --------------------------------------------------------

--
-- Table structure for table `url_checks`
--

CREATE TABLE `url_checks` (
    `id` varchar(255) NOT NULL,
    `timestamp` datetime DEFAULT NULL,
    `f_name` varchar(255) DEFAULT NULL,
    `batch_id` varchar(255) DEFAULT NULL,
    `primary_dns` varchar(45) DEFAULT NULL,
    `secondary_dns` varchar(45) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `url_check_results`
--

CREATE TABLE `url_check_results` (
    `id` int NOT NULL,
    `url_check_id` varchar(255) NOT NULL,
    `url` varchar(2048) NOT NULL,
    `time` int DEFAULT NULL,
    `status` int DEFAULT NULL,
    `used_dns` varchar(45) DEFAULT NULL,
    `accessible` tinyint(1) DEFAULT NULL,
    `timestamp` datetime DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `url_checks`
--
ALTER TABLE `url_checks`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_timestamp` (`timestamp`),
ADD KEY `idx_batch_id` (`batch_id`),
ADD KEY `idx_primary_dns` (`primary_dns`),
ADD KEY `idx_secondary_dns` (`secondary_dns`);

--
-- Indexes for table `url_check_results`
--
ALTER TABLE `url_check_results`
ADD PRIMARY KEY (`id`),
ADD KEY `fk_url_check_id` (`url_check_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `url_check_results`
--
ALTER TABLE `url_check_results`
MODIFY `id` int NOT NULL AUTO_INCREMENT,
AUTO_INCREMENT = 41;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `url_check_results`
--
ALTER TABLE `url_check_results`
ADD CONSTRAINT `fk_url_check_id` FOREIGN KEY (`url_check_id`) REFERENCES `url_checks` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;