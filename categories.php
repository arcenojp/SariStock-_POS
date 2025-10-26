<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$action = $_POST['action'] ?? '';

try {
    switch($action) {
        case 'create':
            $categoryName = trim($_POST['Category_Name']);

            if (empty($categoryName)) {
                echo json_encode(['success' => false, 'message' => 'Category name is required']);
                break;
            }

            $sql = "INSERT INTO categories (Category_Name) VALUES (:category_name)";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':category_name', $categoryName);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Category created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create category']);
            }
            break;

        case 'read':
            $categoryId = $_POST['Category_ID'] ?? null;

            if ($categoryId) {
                // Read single category
                $sql = "SELECT * FROM categories WHERE Category_ID = :category_id";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':category_id', $categoryId);
                $stmt->execute();
                $category = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($category) {
                    echo json_encode(['success' => true, 'data' => $category]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Category not found']);
                }
            } else {
                // Read all categories
                $sql = "SELECT c.*, COUNT(p.Product_ID) as product_count 
                        FROM categories c 
                        LEFT JOIN product p ON c.Category_ID = p.Category_ID 
                        GROUP BY c.Category_ID 
                        ORDER BY c.Category_Name";
                
                $stmt = $db->prepare($sql);
                $stmt->execute();
                $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $categories]);
            }
            break;

        case 'update':
            $categoryId = $_POST['Category_ID'];
            $categoryName = trim($_POST['Category_Name']);

            if (empty($categoryName)) {
                echo json_encode(['success' => false, 'message' => 'Category name is required']);
                break;
            }

            $sql = "UPDATE categories SET Category_Name = :category_name WHERE Category_ID = :category_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':category_name', $categoryName);
            $stmt->bindParam(':category_id', $categoryId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Category updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update category']);
            }
            break;

        case 'delete':
            $categoryId = $_POST['Category_ID'];

            // Check if category has products
            $checkSql = "SELECT COUNT(*) as product_count FROM product WHERE Category_ID = :category_id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->bindParam(':category_id', $categoryId);
            $checkStmt->execute();
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($result['product_count'] > 0) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete category with existing products']);
                break;
            }

            $sql = "DELETE FROM categories WHERE Category_ID = :category_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':category_id', $categoryId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete category']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>