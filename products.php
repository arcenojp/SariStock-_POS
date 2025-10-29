<?php
session_start();
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$database = new Database();
$db = $database->getConnection();

$action = $_POST['action'] ?? '';

try {
    switch($action) {
        case 'create':
            $productName = trim($_POST['Product_Name']);
            $categoryID = $_POST['Category_ID'];
            $price = $_POST['Price'];
            $stockQuantity = $_POST['Stock_Quantity'];
            $status = $_POST['Status'];

            if (empty($productName) || empty($categoryID) || empty($price)) {
                echo json_encode(['success' => false, 'message' => 'Product name, category, and price are required']);
                break;
            }

            $sql = "INSERT INTO product (Product_Name, Category_ID, Price, Stock_Quantity, Status) 
                    VALUES (:product_name, :category_id, :price, :stock_quantity, :status)";
            
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':product_name', $productName);
            $stmt->bindParam(':category_id', $categoryID);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':stock_quantity', $stockQuantity);
            $stmt->bindParam(':status', $status);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Product created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create product']);
            }
            break;

        case 'read':
            $productId = $_POST['Product_ID'] ?? null;
            $categoryId = $_POST['Category_ID'] ?? null;
            $status = $_POST['Status'] ?? null;
            $search = $_POST['search'] ?? '';

            if ($productId) {
                $sql = "SELECT p.*, c.Category_Name 
                        FROM product p 
                        LEFT JOIN category c ON p.Category_ID = c.Category_ID 
                        WHERE p.Product_ID = :product_id";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':product_id', $productId);
                $stmt->execute();
                $product = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($product) {
                    echo json_encode(['success' => true, 'data' => $product]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Product not found']);
                }
            } else {
                $sql = "SELECT p.*, c.Category_Name 
                        FROM product p 
                        LEFT JOIN category c ON p.Category_ID = c.Category_ID 
                        WHERE 1=1";
                $params = [];

                if (!empty($categoryId)) {
                    $sql .= " AND p.Category_ID = :category_id";
                    $params[':category_id'] = $categoryId;
                }

                if (!empty($status)) {
                    $sql .= " AND p.Status = :status";
                    $params[':status'] = $status;
                }

                if (!empty($search)) {
                    $sql .= " AND (p.Product_Name LIKE :search OR p. LIKE :search)";
                    $searchTerm = "%$search%";
                    $params[':search'] = $searchTerm;
                }

                $sql .= " ORDER BY p.Product_Name";

                $stmt = $db->prepare($sql);
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->execute();
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $products]);
            }
            break;

        case 'update':
            $productId = $_POST['Product_ID'];
            $productName = trim($_POST['Product_Name']);
            $categoryID = $_POST['Category_ID'];
            $price = $_POST['Price'];
            $stockQuantity = $_POST['Stock_Quantity'];
            $status = $_POST['Status'];

            if (empty($productName) || empty($categoryID) || empty($price)) {
                echo json_encode(['success' => false, 'message' => 'Product name, category, and price are required']);
                break;
            }

            $sql = "UPDATE product 
                    SET Product_Name = :product_name, Category_ID = :category_id, Price = :price, 
                        Stock_Quantity = :stock_quantity,  Status = :status 
                    WHERE Product_ID = :product_id";
            
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':product_name', $productName);
            $stmt->bindParam(':category_id', $categoryID);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':stock_quantity', $stockQuantity);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':product_id', $productId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Product updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update product']);
            }
            break;

        case 'delete':
            $productId = $_POST['Product_ID'];

            $sql = "DELETE FROM product WHERE Product_ID = :product_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':product_id', $productId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
