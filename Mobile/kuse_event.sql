-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 27, 2026 at 01:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kuse_event`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_users`
--

CREATE TABLE `app_users` (
  `app_user_id` int(11) NOT NULL,
  `device_token` text NOT NULL,
  `display_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `app_users`
--

INSERT INTO `app_users` (`app_user_id`, `device_token`, `display_name`, `created_at`) VALUES
(1, 'test-device-id-001', 'KUSE-User-7524', '2026-05-22 06:08:43');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `cat_id` int(11) NOT NULL,
  `cat_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`cat_id`, `cat_name`) VALUES
(1, 'หลักสูตร'),
(2, 'ภาควิชา'),
(3, 'ฝ่ายงาน'),
(4, 'สโมสรนิสิต');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `dept_id` int(11) NOT NULL,
  `dept_name` varchar(100) NOT NULL,
  `dept_description` text DEFAULT NULL,
  `cat_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`dept_id`, `dept_name`, `dept_description`, `cat_id`) VALUES
(11, 'หลักสูตรวิศวกรรมโยธา', 'Course', 1),
(12, 'หลักสูตรวิศวกรรมไฟฟ้า', 'Course', 1),
(13, 'หลักสูตรวิศวกรรมเครื่องกลและการผลิต', 'Course', 1),
(14, 'หลักสูตรวิศวกรรมอุตสาหการ', 'Course', 1),
(15, 'หลักสูตรวิศวกรรมคอมพิวเตอร์', 'Course', 1),
(16, 'หลักสูตรวิศวกรรมสิ่งแวดล้อมเพื่อการพัฒนาอย่างยั่งยืน', 'Course', 1),
(17, 'หลักสูตรวิทยาการคอมพิวเตอร์', 'Course', 1),
(18, 'หลักสูตรเคมีประยุกต์', 'Course', 1),
(21, 'ภาควิชาวิศวกรรมเครื่องกลและการผลิต', 'Dept', 2),
(22, 'ภาควิชาวิศวกรรมไฟฟ้าและคอมพิวเตอร์', 'Dept', 2),
(23, 'ภาควิชาวิศวกรรมโยธาและสิ่งแวดล้อม', 'Dept', 2),
(24, 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ', 'Dept', 2),
(25, 'ภาควิชาวิทยาศาสตร์ทั่วไป', 'Dept', 2),
(31, 'ฝ่ายยุทธศาสตร์และพัฒนาองค์กร', 'Section', 3),
(32, 'ฝ่ายรับเข้าศึกษาและกิจการพิเศษ', 'Section', 3),
(33, 'ฝ่ายกิจการนิสิตและพัฒนาอย่างยั่งยืน', 'Section', 3),
(34, 'ฝ่ายวิจัยและบริการวิชาการ', 'Section', 3),
(35, 'ฝ่ายดิจิทัลและสื่อสารองค์กร', 'Section', 3),
(36, 'ฝ่ายวิเทศสัมพันธ์', 'Section', 3),
(37, 'ฝ่ายวิชาการ', 'Section', 3),
(41, 'สโมสรนิสิตคณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 'Club', 4);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` int(11) NOT NULL,
  `event_title` varchar(255) NOT NULL,
  `event_description` text DEFAULT NULL,
  `objectives` text DEFAULT NULL,
  `responsibilities` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `event_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `volunteer_hours` decimal(4,2) DEFAULT 0.00,
  `dept_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `status` enum('pending','published','cancelled') DEFAULT 'pending',
  `is_published` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`event_id`, `event_title`, `event_description`, `objectives`, `responsibilities`, `event_date`, `end_date`, `event_time`, `end_time`, `location`, `volunteer_hours`, `dept_id`, `created_by`, `status`, `is_published`) VALUES
(10, 'ถอดไท ใส่ช็อป มอบเกียร์', 'เชิญชวนน้อง KU86 มาร่วมกิจกรรมกันเยอะๆ น้องๆจะพบกับกิจกรรมสุดสร้างสรรค์เพื่อต้อนรับสู่ครอบครัว วว.', 'เป็นกิจกรรมสืบทอดมานาน สำหรับคณะ วว. เพื่อให้นิสิตตระหนักถึงความสำคัญ ของเครื่องแบบช็อปในฐานะสัญลักษณ์ของนิสิตวิศวะ พร้อมทั้งส่งเสริมความมีระเบียบวินัย ความรับผิดชอบการเคารพกฎระเบียบ', 'เชิญชวนนิสิตคณะวิทยาศาสตร์และวิศวกรรมศาสตร์ KU86 เข้าร่วมกิจกรรม แต่งกายภาคเช้าเป็นชุดนักศึกษาเพื่อรับช็อป และภาคบ่ายสวมเสื้อเชียร์คณะเพื่อเข้าร่วมวิ่งเกียร์', '2569-05-24', '2569-05-25', '08:00:00', '15:00:00', 'อาคาร 9', 7.00, 41, 30, '', 1),
(11, 'กิจกรรมสอนน้องร้องเพลง', 'เชิญชวนนิสิตเฟรชชี่ปี 1 KU85 เข้าร่วมกิจกรรมสืบสานตำนานเพลงสถาบันร่วมกันครับ/ค่ะ', 'กิจกรรมสอนน้องร้องเพลงจัดขึ้นเพื่อให้นิสิตใหม่ได้ฝึกซ้อมและร้องเพลงประจำสถาบันอย่างถูกต้อง เสริมสร้างความเคารพต่อสถาบัน และสร้างความผูกพันกับมหาวิทยาลัย', 'เข้าร่วมซ้อมร้องเพลงกับพี่ๆ ตามกำหนดเวลา รับชั่วโมงจิตอาสา โดยแต่งกายเสื้อสีขาวและกางเกงขายาว', '2569-06-29', '2569-06-29', '16:00:00', '20:00:00', 'อาคาร 14', 4.00, 41, 30, '', 1),
(12, 'Homeroom CIS 2026', 'เชิญชวนนิสิตภาควิชาวิทยาการคอมพิวเตอร์ทุกชั้นปีเข้าร่วมกิจกรรมโฮมรูมพบปะอาจารย์และพี่น้องร่วมภาควิชาครับ/ค่ะ', 'กิจกรรมโฮมรูมสาขาวิชาวิทยาการคอมพิวเตอร์จัดขึ้นเพื่อเปิดโอกาสให้นิสิตทุกชั้นปีได้พบปะและรับคำแนะนำจากอาจารย์ผู้รับผิดชอบสาขา เกี่ยวกับหลักสูตร การวางแผนการเรียน และการเตรียมความพร้อมสำหรับการศึกษา', 'เชิญชวนนิสิตทุกชั้นปีเข้าร่วมกิจกรรม เพื่อรับคำแนะนำจากอาจารย์และแลกเปลี่ยนประสบการณ์ในการวางแผนการเรียน', '2569-06-29', '2569-06-29', '15:00:00', '16:00:00', 'อาคาร 2-302', 1.00, 24, 21, '', 1),
(13, 'กิจกรรมกีฬาสีมหาลัย', 'เชิญชวนนิสิตจิตอาสาเข้าร่วมเป็นเชียร์ลีดเดอร์ ขึ้นแสตนด์เชียร์ และร่วมเดินขบวนพาเหรดครับ/ค่ะ', 'จัดขึ้นเพื่อส่งเสริมให้นิสิตได้มีส่วนร่วมในกิจกรรมของมหาวิทยาลัย พร้อมทั้งพัฒนาความคิดสร้างสรรค์ ความกล้าแสดงออก และสร้างความสามัคคีในหมู่คณะ', 'เชิญชวนนิสิตจิตอาสาเข้าร่วมเป็นเชียร์ลีดเดอร์ ขึ้นแสตนด์เชียร์ และร่วมเดินขบวนพาเหรด เพื่อสร้างสีสันและบรรยากาศให้กับกิจกรรมกีฬาสีของคณะวิทยาศาสตร์และวิศวกรรมศาสตร์', '2569-07-07', '2569-07-14', '10:00:00', '14:00:00', 'อาคาร 19', 20.00, 41, 30, '', 1),
(14, 'กิจกรรมต้อนรับนิสิตใหม่ KU86', 'เชิญชวนนิสิตเฟรชชี่ปี 1 เข้าร่วมกิจกรรมต้อนรับน้องใหม่สุดอบอุ่นครับ/ค่ะ', 'กิจกรรมต้อนรับนิสิตคณะ วว. KU86 จัดขึ้นเพื่อสร้างความประทับใจและความภาคภูมิใจให้กับนิสิตใหม่ ผ่านกิจกรรมต้อนรับจากรุ่นพี่ การแสดงและกิจกรรมสันทนาการต่าง ๆ เพื่อเสริมสร้างความผูกพัน ความสามัคคี และบรรยากาศที่อบอุ่น', 'เชิญชวนนิสิตชั้นปีที่ 1 เข้าร่วมกิจกรรมต้อนรับ เพื่อร่วมทำกิจกรรมและรับชมการแสดงจากรุ่นพี่ โดยผู้เข้าร่วมจะได้รับชั่วโมงจิตอาสา และแต่งกายเสื้อสีขาว กางเกงขายาว', '2569-07-08', '2569-07-08', '16:00:00', '21:00:00', 'อาคาร 14', 5.00, 41, 30, '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `event_images`
--

CREATE TABLE `event_images` (
  `image_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `is_cover` tinyint(1) DEFAULT 0 COMMENT '1 = รูปปก (Highlight), 0 = รูปทั่วไป',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_events`
--

CREATE TABLE `saved_events` (
  `save_id` int(11) NOT NULL,
  `app_user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `saved_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `saved_events`
--

INSERT INTO `saved_events` (`save_id`, `app_user_id`, `event_id`, `saved_at`) VALUES
(1, 1, 10, '2026-05-22 06:10:40');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `dept_id` int(11) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','super_admin') DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `full_name`, `dept_id`, `department`, `email`, `role`, `is_active`, `created_at`) VALUES
(1, 'superadmin', '123456', 'ผู้ดูแลระบบสูงสุด', NULL, NULL, 'superadmin@kuse.com', 'super_admin', 1, '2026-05-15 03:10:55'),
(10, 'civil_course', '123456', 'แอดมินหลักสูตรวิศวกรรมโยธา', 11, NULL, 'civil_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(11, 'ee_course', '123456', 'แอดมินหลักสูตรวิศวกรรมไฟฟ้า', 12, NULL, 'ee_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(12, 'me_course', '123456', 'แอดมินหลักสูตรวิศวกรรมเครื่องกล', 13, NULL, 'me_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(13, 'ie_course', '123456', 'แอดมินหลักสูตรวิศวกรรมอุตสาหการ', 14, NULL, 'ie_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(14, 'cpe_course', '123456', 'แอดมินหลักสูตรวิศวกรรมคอมพิวเตอร์', 15, NULL, 'cpe_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(15, 'env_course', '123456', 'แอดมินหลักสูตรวิศวกรรมสิ่งแวดล้อม', 16, NULL, 'env_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(16, 'csc_course', '123456', 'แอดมินหลักสูตรวิทยาการคอมพิวเตอร์', 17, NULL, 'csc_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(17, 'chem_course', '123456', 'แอดมินหลักสูตรเคมีประยุกต์', 18, NULL, 'chem_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(18, 'me_dept', '123456', 'แอดมินภาควิชาวิศวกรรมเครื่องกล', 21, NULL, 'me_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(19, 'ee_dept', '123456', 'แอดมินภาควิชาวิศวกรรมไฟฟ้า', 22, NULL, 'ee_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(20, 'civil_dept', '123456', 'แอดมินภาควิชาวิศวกรรมโยธา', 23, NULL, 'civil_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(21, 'cpe_dept', '123456', 'แอดมินภาควิชาวิทยาการคอมพิวเตอร์', 24, NULL, 'cpe_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(22, 'science_dept', '123456', 'แอดมินภาควิชาวิทยาศาสตร์ทั่วไป', 25, NULL, 'sci_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(23, 'strategy_sec', '123456', 'แอดมินฝ่ายยุทธศาสตร์', 31, NULL, 'strat@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(24, 'admission_sec', '123456', 'แอดมินฝ่ายรับเข้าศึกษา', 32, NULL, 'adminssion@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(25, 'student_affairs_sec', '123456', 'แอดมินฝ่ายกิจการนิสิต', 33, NULL, 'student@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(26, 'research_sec', '123456', 'แอดมินฝ่ายวิจัยและบริการวิชาการ', 34, NULL, 'research@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(27, 'digital_sec', '123456', 'แอดมินฝ่ายดิจิทัลและสื่อสารองค์กร', 35, NULL, 'digital@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(28, 'inter_sec', '123456', 'แอดมินฝ่ายวิเทศสัมพันธ์', 36, NULL, 'inter@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(29, 'academic_sec', '123456', 'แอดมินฝ่ายวิชาการ', 37, NULL, 'academic@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(30, 'smo_club', '123456', 'แอดมินสโมสรนิสิตคณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 41, NULL, 'smo@kuse.com', 'admin', 1, '2026-05-15 03:34:24');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_users`
--
ALTER TABLE `app_users`
  ADD PRIMARY KEY (`app_user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`cat_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`dept_id`),
  ADD KEY `fk_departments_categories` (`cat_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `fk_events_departments` (`dept_id`);

--
-- Indexes for table `event_images`
--
ALTER TABLE `event_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_image_event` (`event_id`);

--
-- Indexes for table `saved_events`
--
ALTER TABLE `saved_events`
  ADD PRIMARY KEY (`save_id`),
  ADD KEY `app_user_id` (`app_user_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_user_dept` (`dept_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app_users`
--
ALTER TABLE `app_users`
  MODIFY `app_user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `dept_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `event_images`
--
ALTER TABLE `event_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `saved_events`
--
ALTER TABLE `saved_events`
  MODIFY `save_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_categories` FOREIGN KEY (`cat_id`) REFERENCES `categories` (`cat_id`);

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_events_departments` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `event_images`
--
ALTER TABLE `event_images`
  ADD CONSTRAINT `fk_image_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_events`
--
ALTER TABLE `saved_events`
  ADD CONSTRAINT `saved_events_ibfk_1` FOREIGN KEY (`app_user_id`) REFERENCES `app_users` (`app_user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_events_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_dept` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
