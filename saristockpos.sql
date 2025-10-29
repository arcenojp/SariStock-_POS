-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 29, 2025 at 06:41 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `saristockpos`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
CREATE TABLE IF NOT EXISTS `category` (
  `Category_ID` int NOT NULL AUTO_INCREMENT,
  `Category_Name` varchar(50) NOT NULL,
  PRIMARY KEY (`Category_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`Category_ID`, `Category_Name`) VALUES
(11, 'Electronics'),
(12, 'Bevereges'),
(13, 'Snacks'),
(14, 'Accessories');

-- --------------------------------------------------------

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
CREATE TABLE IF NOT EXISTS `customer` (
  `Customer_ID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Contact_Number` varchar(15) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Address` text NOT NULL,
  PRIMARY KEY (`Customer_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customer`
--

INSERT INTO `customer` (`Customer_ID`, `Name`, `Contact_Number`, `Email`, `Address`) VALUES
(2, 'TJ', '09486029868', 'Tj@gmail.com', 'Jaro Iloilo City'),
(3, 'Chris', '09386029868', 'Chris@gmail.com', 'Manduriao Iloilo City'),
(4, 'Kenth', '09786029868', 'Kenth@gmail.com', 'lapaz Iloilo City');

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
CREATE TABLE IF NOT EXISTS `employee` (
  `Employee_ID` int NOT NULL AUTO_INCREMENT,
  `username` varchar(25) NOT NULL,
  `password` varchar(255) NOT NULL,
  `Full_Name` varchar(100) NOT NULL,
  `Role` enum('Admin','Cashier') NOT NULL,
  `Status` enum('Active','Inactive') NOT NULL,
  PRIMARY KEY (`Employee_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`Employee_ID`, `username`, `password`, `Full_Name`, `Role`, `Status`) VALUES
(1, 'mae', 'mae11111', 'Maeden Pentoque', 'Cashier', 'Active'),
(2, 'alea', 'alea2222', 'alea Ann Forcado', 'Admin', 'Active'),
(3, 'jp', 'jp333333', 'Jp Arceno', 'Admin', 'Active'),
(4, '', '', '', 'Admin', '');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
CREATE TABLE IF NOT EXISTS `product` (
  `Product_ID` int NOT NULL AUTO_INCREMENT,
  `Product_Name` varchar(100) NOT NULL,
  `Category_ID` int NOT NULL,
  `Price` double NOT NULL,
  `Stock_Quantity` int NOT NULL,
  `Barcode` varchar(50) NOT NULL,
  `Status` enum('Active','Inactive') NOT NULL,
  PRIMARY KEY (`Product_ID`),
  KEY `Category_ID` (`Category_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`Product_ID`, `Product_Name`, `Category_ID`, `Price`, `Stock_Quantity`, `Barcode`, `Status`) VALUES
(41, 'Coca-cola 1l', 11, 45, 50, '4801981123456', ''),
(42, 'Lucky Me Pancit Canton', 12, 14, 200, '4801981123457', ''),
(43, 'Palmolive Shampoo 12ml', 13, 10, 120, '4801981523456', ''),
(44, 'Century Tuna 155g', 14, 35, 0, '4800981123456', '');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
CREATE TABLE IF NOT EXISTS `sales` (
  `Sale_ID` int NOT NULL AUTO_INCREMENT,
  `Sale_Date` datetime NOT NULL,
  `Customer_ID` int NOT NULL,
  `Cashier_ID` int NOT NULL,
  `TotalAmount` double NOT NULL,
  `Payment_Method` enum('Cash','Card','Gcash') NOT NULL,
  `Status` enum('Completed','Refunded') NOT NULL,
  PRIMARY KEY (`Sale_ID`),
  KEY `Customer_ID` (`Customer_ID`),
  KEY `Cashier_ID` (`Cashier_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`Sale_ID`, `Sale_Date`, `Customer_ID`, `Cashier_ID`, `TotalAmount`, `Payment_Method`, `Status`) VALUES
(2, '2025-12-01 00:00:00', 2, 1, 250, 'Cash', 'Completed'),
(3, '2025-12-01 00:00:00', 3, 1, 550, 'Cash', 'Completed'),
(4, '2025-12-01 00:00:00', 4, 1, 400, 'Gcash', 'Completed'),
(5, '2025-12-02 00:00:00', 2, 1, 50, 'Cash', 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `sales_detail`
--

DROP TABLE IF EXISTS `sales_detail`;
CREATE TABLE IF NOT EXISTS `sales_detail` (
  `Sales_Detail_ID` int NOT NULL AUTO_INCREMENT,
  `Sale_ID` int NOT NULL,
  `Product_ID` int NOT NULL,
  `Quantity` int NOT NULL,
  `Price` double NOT NULL,
  `SubTotal` double NOT NULL,
  PRIMARY KEY (`Sales_Detail_ID`),
  KEY `Sale_ID` (`Sale_ID`),
  KEY `Product_ID` (`Product_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sales_detail`
--

INSERT INTO `sales_detail` (`Sales_Detail_ID`, `Sale_ID`, `Product_ID`, `Quantity`, `Price`, `SubTotal`) VALUES
(1, 2, 44, 3, 50, 150),
(2, 3, 41, 1, 70, 70),
(3, 4, 42, 5, 10, 50),
(4, 2, 44, 10, 10, 100);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `product_ibfk_1` FOREIGN KEY (`Category_ID`) REFERENCES `category` (`Category_ID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`Customer_ID`) REFERENCES `customer` (`Customer_ID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`Cashier_ID`) REFERENCES `employee` (`Employee_ID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `sales_detail`
--
ALTER TABLE `sales_detail`
  ADD CONSTRAINT `sales_detail_ibfk_1` FOREIGN KEY (`Sale_ID`) REFERENCES `sales` (`Sale_ID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `sales_detail_ibfk_2` FOREIGN KEY (`Product_ID`) REFERENCES `product` (`Product_ID`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
