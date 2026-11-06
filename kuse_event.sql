-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 18, 2026 at 07:48 PM
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
  `push_token` varchar(255) DEFAULT NULL,
  `display_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notifications_seen_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `app_users`
--

INSERT INTO `app_users` (`app_user_id`, `device_token`, `push_token`, `display_name`, `created_at`, `notifications_seen_at`) VALUES
(1, 'test-device-id-001', NULL, 'KUSE-User-7524', '2026-05-22 06:08:43', NULL),
(2, '1c057238-753f-4236-a2de-d6a84fccd80e', NULL, 'KUSE-User-2107', '2026-07-09 05:19:11', '2026-08-19 00:39:36'),
(3, '0009b087-9d57-4a04-b9d1-bcaf3cf83718', NULL, 'KUSE-User-6047', '2026-07-09 05:19:12', NULL),
(4, 'a1f79ad2-e8b8-44d8-804f-92d722583da6', NULL, 'KUSE-User-5398', '2026-07-10 06:14:47', NULL);

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
-- Table structure for table `department_links`
--

CREATE TABLE `department_links` (
  `id` int(11) NOT NULL,
  `dept_id` int(11) NOT NULL,
  `related_dept_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department_links`
--

INSERT INTO `department_links` (`id`, `dept_id`, `related_dept_id`) VALUES
(1, 21, 13),
(2, 21, 14),
(3, 22, 12),
(4, 22, 15),
(5, 23, 11),
(6, 23, 16),
(7, 24, 17),
(8, 25, 18);

-- --------------------------------------------------------

--
-- Stand-in structure for view `department_link_closure`
-- (See below for the actual view)
--
CREATE TABLE `department_link_closure` (
`dept_id` int(11)
,`linked_dept_id` int(11)
);

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
(10, 'ถอดไท ใส่ช็อป มอบเกียร์', 'เชิญชวนน้อง KU86 มาร่วมกิจกรรมกันเยอะๆ น้องๆจะพบกับกิจกรรมสุดสร้างสรรค์เพื่อต้อนรับสู่ครอบครัว วว.', 'เป็นกิจกรรมสืบทอดมานาน สำหรับคณะ วว. เพื่อให้นิสิตตระหนักถึงความสำคัญ ของเครื่องแบบช็อปในฐานะสัญลักษณ์ของนิสิตวิศวะ พร้อมทั้งส่งเสริมความมีระเบียบวินัย ความรับผิดชอบการเคารพกฎระเบียบ', 'เชิญชวนนิสิตคณะวิทยาศาสตร์และวิศวกรรมศาสตร์ KU86 เข้าร่วมกิจกรรม แต่งกายภาคเช้าเป็นชุดนักศึกษาเพื่อรับช็อป และภาคบ่ายสวมเสื้อเชียร์คณะเพื่อเข้าร่วมวิ่งเกียร์', '2026-05-24', '2026-05-25', '08:00:00', '15:00:00', 'อาคาร 9', 7.00, 41, 30, 'published', 1),
(11, 'กิจกรรมสอนน้องร้องเพลง', 'เชิญชวนนิสิตเฟรชชี่ปี 1 KU85 เข้าร่วมกิจกรรมสืบสานตำนานเพลงสถาบันร่วมกันครับ/ค่ะ', 'กิจกรรมสอนน้องร้องเพลงจัดขึ้นเพื่อให้นิสิตใหม่ได้ฝึกซ้อมและร้องเพลงประจำสถาบันอย่างถูกต้อง เสริมสร้างความเคารพต่อสถาบัน และสร้างความผูกพันกับมหาวิทยาลัย', 'เข้าร่วมซ้อมร้องเพลงกับพี่ๆ ตามกำหนดเวลา รับชั่วโมงจิตอาสา โดยแต่งกายเสื้อสีขาวและกางเกงขายาว', '2026-06-29', '2026-06-29', '16:00:00', '20:00:00', 'อาคาร 14', 4.00, 41, 30, 'published', 1),
(12, 'Homeroom CIS 2026', 'เชิญชวนนิสิตภาควิชาวิทยาการคอมพิวเตอร์ทุกชั้นปีเข้าร่วมกิจกรรมโฮมรูมพบปะอาจารย์และพี่น้องร่วมภาควิชาครับ/ค่ะ', 'กิจกรรมโฮมรูมสาขาวิชาวิทยาการคอมพิวเตอร์จัดขึ้นเพื่อเปิดโอกาสให้นิสิตทุกชั้นปีได้พบปะและรับคำแนะนำจากอาจารย์ผู้รับผิดชอบสาขา เกี่ยวกับหลักสูตร การวางแผนการเรียน และการเตรียมความพร้อมสำหรับการศึกษา', 'เชิญชวนนิสิตทุกชั้นปีเข้าร่วมกิจกรรม เพื่อรับคำแนะนำจากอาจารย์และแลกเปลี่ยนประสบการณ์ในการวางแผนการเรียน', '2026-06-29', '2026-06-29', '15:00:00', '16:00:00', 'อาคาร 2-302', 1.00, 24, 21, 'published', 1),
(13, 'กิจกรรมกีฬาสีมหาลัย', 'เชิญชวนนิสิตจิตอาสาเข้าร่วมเป็นเชียร์ลีดเดอร์ ขึ้นแสตนด์เชียร์ และร่วมเดินขบวนพาเหรดครับ/ค่ะ', 'จัดขึ้นเพื่อส่งเสริมให้นิสิตได้มีส่วนร่วมในกิจกรรมของมหาวิทยาลัย พร้อมทั้งพัฒนาความคิดสร้างสรรค์ ความกล้าแสดงออก และสร้างความสามัคคีในหมู่คณะ', 'เชิญชวนนิสิตจิตอาสาเข้าร่วมเป็นเชียร์ลีดเดอร์ ขึ้นแสตนด์เชียร์ และร่วมเดินขบวนพาเหรด เพื่อสร้างสีสันและบรรยากาศให้กับกิจกรรมกีฬาสีของคณะวิทยาศาสตร์และวิศวกรรมศาสตร์', '2026-07-07', '2026-07-14', '10:00:00', '14:00:00', 'อาคาร 19', 20.00, 41, 30, 'published', 1),
(14, 'กิจกรรมต้อนรับนิสิตใหม่ KU86', 'เชิญชวนนิสิตเฟรชชี่ปี 1 เข้าร่วมกิจกรรมต้อนรับน้องใหม่สุดอบอุ่นครับ/ค่ะ', 'กิจกรรมต้อนรับนิสิตคณะ วว. KU86 จัดขึ้นเพื่อสร้างความประทับใจและความภาคภูมิใจให้กับนิสิตใหม่ ผ่านกิจกรรมต้อนรับจากรุ่นพี่ การแสดงและกิจกรรมสันทนาการต่าง ๆ เพื่อเสริมสร้างความผูกพัน ความสามัคคี และบรรยากาศที่อบอุ่น', 'เชิญชวนนิสิตชั้นปีที่ 1 เข้าร่วมกิจกรรมต้อนรับ เพื่อร่วมทำกิจกรรมและรับชมการแสดงจากรุ่นพี่ โดยผู้เข้าร่วมจะได้รับชั่วโมงจิตอาสา และแต่งกายเสื้อสีขาว กางเกงขายาว', '2026-07-26', '2026-07-26', '16:00:00', '21:00:00', 'อาคาร 14', 5.00, 41, 30, 'published', 1),
(15, 'เต้นแอโรบิค', 'หฟหหห', 'กหแแ', 'กหแหป', '2026-07-25', '2026-07-25', '16:30:00', '18:30:00', 'ลานรวมใจ', 2.00, 41, 1, 'published', 1),
(16, 'เราเป็นอะไรกัน', 'งง', 'บอกที', 'เธอและฉัน', '2026-07-25', '2026-07-25', '12:00:00', '18:00:00', 'ในใจ', 6.00, 13, 1, 'published', 1),
(17, 'เราเป็นอะไรกันพี่น้องหรอ', 'งง', 'ไม่โอเค', 'ไปไกลๆ', '2026-07-25', '2026-07-25', '12:00:00', '18:00:00', 'ใจของฉัน', 8.00, 41, 30, 'published', 1),
(18, 'การเต้นบราซิล', 'สนุก', 'สนิทกับร่างกาย', 'แต่งกายสวยๆ', '2026-08-02', '2026-08-02', '15:00:00', '18:00:00', 'ในใจเสมอ', 2.00, 41, 30, 'published', 1),
(20, 'รักกพี่เวฟฟฟ', 'สสส', 'สสส', 'สสส', '2026-08-19', '2026-08-20', '10:30:00', '11:30:00', 'ตึก 9', 10.00, 25, 1, 'published', 1);

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

--
-- Dumping data for table `event_images`
--

INSERT INTO `event_images` (`image_id`, `event_id`, `image_path`, `is_cover`, `created_at`) VALUES
(13, 15, '/uploads/events/1783574873945-157140864.png', 1, '2026-07-09 05:27:54'),
(14, 15, '/uploads/events/1783574873965-848198914.png', 0, '2026-07-09 05:27:54'),
(15, 15, '/uploads/events/1783574873969-863342306.png', 0, '2026-07-09 05:27:54'),
(16, 15, '/uploads/events/1783574873972-190085912.png', 0, '2026-07-09 05:27:54'),
(17, 15, '/uploads/events/1783574873980-59467064.png', 0, '2026-07-09 05:27:54'),
(18, 16, '/uploads/events/1783576282494-898971421.png', 1, '2026-07-09 05:51:22'),
(19, 16, '/uploads/events/1783576282495-428539815.png', 0, '2026-07-09 05:51:22'),
(20, 16, '/uploads/events/1783576282497-922052909.png', 0, '2026-07-09 05:51:22'),
(21, 16, '/uploads/events/1783576282508-960376674.png', 0, '2026-07-09 05:51:22'),
(22, 16, '/uploads/events/1783576282515-877106187.png', 0, '2026-07-09 05:51:22'),
(23, 17, '/uploads/events/1783576423568-573979560.png', 1, '2026-07-09 05:53:43'),
(24, 17, '/uploads/events/1783576423594-991937823.png', 0, '2026-07-09 05:53:43'),
(25, 17, '/uploads/events/1783576423594-686774582.png', 0, '2026-07-09 05:53:43'),
(26, 17, '/uploads/events/1783576423600-896543946.png', 0, '2026-07-09 05:53:43'),
(27, 17, '/uploads/events/1783576423601-477857493.png', 0, '2026-07-09 05:53:43'),
(28, 17, '/uploads/events/1783576423616-883363902.png', 0, '2026-07-09 05:53:43'),
(29, 14, '/uploads/events/1783666474511-25480286.png', 1, '2026-07-10 06:54:34'),
(30, 14, '/uploads/events/1783666474531-651233792.png', 0, '2026-07-10 06:54:34'),
(31, 13, '/uploads/events/1783666494689-172194665.png', 1, '2026-07-10 06:54:54'),
(32, 13, '/uploads/events/1783666494692-107895084.png', 0, '2026-07-10 06:54:54'),
(33, 11, '/uploads/events/1783666516769-857963791.png', 1, '2026-07-10 06:55:16'),
(34, 11, '/uploads/events/1783666516770-384326653.png', 0, '2026-07-10 06:55:16'),
(35, 12, '/uploads/events/1783666538293-392672165.jpg', 1, '2026-07-10 06:55:38'),
(36, 12, '/uploads/events/1783666538294-752668831.png', 0, '2026-07-10 06:55:38'),
(37, 10, '/uploads/events/1783666564495-476146682.png', 1, '2026-07-10 06:56:04'),
(38, 10, '/uploads/events/1783666564497-320864072.png', 0, '2026-07-10 06:56:04'),
(40, 18, '/uploads/events/1785480815610-733305500.jpg', 0, '2026-07-31 06:53:35'),
(41, 18, '/uploads/events/1785480815645-276232895.jpg', 0, '2026-07-31 06:53:35'),
(42, 18, '/uploads/events/1785480815660-932108292.jpg', 0, '2026-07-31 06:53:35'),
(48, 18, '/uploads/events/1787042849515-646332909.jpg', 0, '2026-08-18 08:47:29'),
(50, 18, '/uploads/events/1787043281817-73179635.jpg', 1, '2026-08-18 08:54:41'),
(51, 20, '/uploads/events/1787070509819-645114442.jpg', 1, '2026-08-18 16:28:29'),
(52, 20, '/uploads/events/1787070509853-291068231.jpg', 0, '2026-08-18 16:28:29'),
(53, 20, '/uploads/events/1787070509859-539961385.jpg', 0, '2026-08-18 16:28:29'),
(54, 20, '/uploads/events/1787070509869-203912372.jpg', 0, '2026-08-18 16:28:29'),
(55, 20, '/uploads/events/1787070509879-265554546.jpg', 0, '2026-08-18 16:28:29');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `event_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `event_id`, `title`, `body`, `sent_at`) VALUES
(1, 17, 'แจ้งเตือนกิจกรรมล่วงหน้า!', 'อีก 3 วันจะถึงกิจกรรม: เราเป็นอะไรกันพี่น้องหรอ', '2026-07-22 07:48:47'),
(2, 16, 'แจ้งเตือนกิจกรรมล่วงหน้า!', 'อีก 2 วันจะถึงกิจกรรม: เราเป็นอะไรกัน', '2026-07-23 07:00:00'),
(3, 15, 'แจ้งเตือนกิจกรรมล่วงหน้า!', 'อีก 2 วันจะถึงกิจกรรม: เต้นแอโรบิค', '2026-07-23 16:49:40'),
(4, 14, 'แจ้งเตือนกิจกรรมล่วงหน้า!', 'อีก 3 วันจะถึงกิจกรรม: กิจกรรมต้อนรับนิสิตใหม่ KU86', '2026-07-23 16:58:26'),
(5, 18, 'แจ้งเตือนกิจกรรมล่วงหน้า!', 'อีก 2 วันจะถึงกิจกรรม: การเต้นบราซิล', '2026-07-31 06:53:37'),
(7, 20, 'แจ้งเตือนกิจกรรมล่วงหน้า!', 'อีก 1 วันจะถึงกิจกรรม: รักกพี่เวฟฟฟ', '2026-08-18 16:28:32');

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
(1, 1, 10, '2026-05-22 06:10:40'),
(5, 2, 17, '2026-07-10 10:26:29'),
(6, 2, 14, '2026-07-23 06:50:29');

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
(1, 'superadmin', '$2b$10$j9zyKXbTwPIjOmia6vOXk.Il0Q1qk3NIEqSyiBfabIBbaSmFFHZp2', 'ผู้ดูแลระบบสูงสุด', NULL, NULL, 'superadmin@kuse.com', 'super_admin', 1, '2026-05-15 03:10:55'),
(10, 'civil_course', '$2b$10$ah0Cp6kG6N9P6JpQKeF0Ze.oaKBY7TZb7odRKC5.lLhhHzKpp1gIq', 'แอดมินหลักสูตรวิศวกรรมโยธา', 11, NULL, 'civil_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(11, 'ee_course', '$2b$10$iWj2MLPvSpZ.3FxIvz1ACu8PdxGLqJLCxAm9p65sskpXyLVT/5jZO', 'แอดมินหลักสูตรวิศวกรรมไฟฟ้า', 12, NULL, 'ee_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(12, 'me_course', '$2b$10$FedvGuMpskJcRM/S8oEgZ.SqtN3u7j31pZ55A.vTw6jl7UHKr/F7S', 'แอดมินหลักสูตรวิศวกรรมเครื่องกล', 13, NULL, 'me_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(13, 'ie_course', '$2b$10$AP5k.kpgGF9NN.oFyjZ1L.c1NsFTh53OzVFOWuBExklqaTEgru4S6', 'แอดมินหลักสูตรวิศวกรรมอุตสาหการ', 14, NULL, 'ie_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(14, 'cpe_course', '$2b$10$Cksp3FaBikFImDVsApWOrubJo6zy4tmXb377YRdr1eE9/sH1sihWW', 'แอดมินหลักสูตรวิศวกรรมคอมพิวเตอร์', 15, NULL, 'cpe_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(15, 'env_course', '$2b$10$BWX4YuEXvfa35WtNdRBFROTTXOHQPsxpSdInSTZUut9/APy9tst1C', 'แอดมินหลักสูตรวิศวกรรมสิ่งแวดล้อม', 16, NULL, 'env_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(16, 'csc_course', '$2b$10$RydJieir1DEt2iyxHO8i3ub/tUItOavMKHsYiRp25Rn3quQsOuoxu', 'แอดมินหลักสูตรวิทยาการคอมพิวเตอร์', 17, NULL, 'csc_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(17, 'chem_course', '$2b$10$.DmCir.BsYVUZK1v.gx2rejAdtcLVo5f/tLSTf4vhDP8TrBgOWCf6', 'แอดมินหลักสูตรเคมีประยุกต์', 18, NULL, 'chem_c@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(18, 'me_dept', '$2b$10$5YvwKCQ77do.qVWsHamnMeT/c3WhPGq7GijE/FYW2lWUBA2ToIpYe', 'แอดมินภาควิชาวิศวกรรมเครื่องกล', 21, NULL, 'me_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(19, 'ee_dept', '$2b$10$5MrPEGUQx5J7.JJ5k8/SkeXXP8P1rBI9r0HON6GOmdOIEniwErFG2', 'แอดมินภาควิชาวิศวกรรมไฟฟ้า', 22, NULL, 'ee_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(20, 'civil_dept', '$2b$10$jeNk5oWQsVbo/BTpXpr5VOkkDXCLIJ5oBKglNtlpyu55tjNpQGJey', 'แอดมินภาควิชาวิศวกรรมโยธา', 23, NULL, 'civil_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(21, 'cpe_dept', '$2b$10$LUbqIgz8G9TKgfzQ/EFHW.7.HBQ4Difcc9JRYF0Gm2YWolVuU7QXC', 'แอดมินภาควิชาวิทยาการคอมพิวเตอร์', 24, NULL, 'cpe_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(22, 'science_dept', '$2b$10$w7xpjx9K9zbuRsXc1TT.3O2XENtRT2441SjCKYCm6gfKz.orKcuaC', 'แอดมินภาควิชาวิทยาศาสตร์ทั่วไป', 25, NULL, 'sci_d@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(23, 'strategy_sec', '$2b$10$SlvZvJ8y29MSNY56m2QZk..yGMrR0ommohpEqvVhNfP3gwKTHvkYy', 'แอดมินฝ่ายยุทธศาสตร์', 31, NULL, 'strat@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(24, 'admission_sec', '$2b$10$ZNPSsfcsSfsgh6v9FpnkG.uQXWMCTgRM1vtWNPIbCGX7cw/uWZXqK', 'แอดมินฝ่ายรับเข้าศึกษา', 32, NULL, 'adminssion@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(25, 'student_affairs_sec', '$2b$10$37MgyUEF.MaaakQouw31N.JcDtAlaEOaM3JY2KZCGn8wAdotc5Oju', 'แอดมินฝ่ายกิจการนิสิต', 33, NULL, 'student@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(26, 'research_sec', '$2b$10$TksZLXKsSwanF.TCWHbQC.9yWHBJ0snKf7Mlke373bXSdIGMd4oO6', 'แอดมินฝ่ายวิจัยและบริการวิชาการ', 34, NULL, 'research@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(27, 'digital_sec', '$2b$10$mXGHO25FWG01uVLCkY8lleK43n7YZs901aFB6/XJATJaC6hcQF3LK', 'แอดมินฝ่ายดิจิทัลและสื่อสารองค์กร', 35, NULL, 'digital@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(28, 'inter_sec', '$2b$10$XyUB7MnS0NZVfFE5ah8BHeh5LqaymZS7L4TBzXYQwx2FyqJc2F7ja', 'แอดมินฝ่ายวิเทศสัมพันธ์', 36, NULL, 'inter@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(29, 'academic_sec', '$2b$10$EqgzF85IMwFZjJmdvshLW.ER2tr9ysYV1g74k7w0QZj1xwUFRaBvS', 'แอดมินฝ่ายวิชาการ', 37, NULL, 'academic@kuse.com', 'admin', 1, '2026-05-15 03:34:24'),
(30, 'smo_club', '$2b$10$YsHDEFXqfF7R.HgvPkZdYe2QoAgFqpdecjOxdNpIRwoh5DLDTR9J.', 'แอดมินสโมสรนิสิตคณะวิทยาศาสตร์และวิศวกรรมศาสตร์', 41, NULL, 'smo@kuse.com', 'admin', 1, '2026-05-15 03:34:24');

-- --------------------------------------------------------

--
-- Structure for view `department_link_closure`
--
DROP TABLE IF EXISTS `department_link_closure`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `department_link_closure`  AS SELECT `departments`.`dept_id` AS `dept_id`, `departments`.`dept_id` AS `linked_dept_id` FROM `departments`union select `department_links`.`dept_id` AS `dept_id`,`department_links`.`related_dept_id` AS `linked_dept_id` from `department_links` union select `department_links`.`related_dept_id` AS `dept_id`,`department_links`.`dept_id` AS `linked_dept_id` from `department_links`  ;

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
-- Indexes for table `department_links`
--
ALTER TABLE `department_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_department_link` (`dept_id`,`related_dept_id`),
  ADD KEY `related_dept_id` (`related_dept_id`);

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
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notifications_event` (`event_id`);

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
  MODIFY `app_user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `dept_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `department_links`
--
ALTER TABLE `department_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `event_images`
--
ALTER TABLE `event_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `saved_events`
--
ALTER TABLE `saved_events`
  MODIFY `save_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_categories` FOREIGN KEY (`cat_id`) REFERENCES `categories` (`cat_id`);

--
-- Constraints for table `department_links`
--
ALTER TABLE `department_links`
  ADD CONSTRAINT `department_links_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `department_links_ibfk_2` FOREIGN KEY (`related_dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE CASCADE;

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
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

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
