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
            $name = trim($_POST['Name']);
            $contact = trim($_POST['Contact_Number'] ?? '');
            $email = trim($_POST['Email'] ?? '');
            $address = trim($_POST['Address'] ?? '');

            if (empty($name)) {
                echo json_encode(['success' => false, 'message' => 'Customer name is required']);
                break;
            }

            $sql = "INSERT INTO customer (Name, Contact_Number, Email, Address) 
                    VALUES (:name, :contact, :email, :address)";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':contact', $contact);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':address', $address);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Customer created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create customer']);
            }
            break;

        case 'read':
            $customerId = $_POST['Customer_ID'] ?? null;
            $search = $_POST['search'] ?? '';

            if ($customerId) {
                // Read single customer
                $sql = "SELECT * FROM customer WHERE Customer_ID = :customer_id";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':customer_id', $customerId);
                $stmt->execute();
                $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($customer) {
                    echo json_encode(['success' => true, 'data' => $customer]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Customer not found']);
                }
            } else {
                // Read all customers
                $sql = "SELECT c.*, COUNT(s.Sale_ID) as total_orders 
                        FROM customer c 
                        LEFT JOIN sales s ON c.Customer_ID = s.Customer_ID 
                        GROUP BY c.Customer_ID";
                $params = [];

                if (!empty($search)) {
                    $sql .= " HAVING c.Name LIKE :search OR c.Email LIKE :search";
                    $searchTerm = "%$search%";
                    $params[':search'] = $searchTerm;
                }

                $sql .= " ORDER BY c.Name";

                $stmt = $db->prepare($sql);
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->execute();
                $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $customers]);
            }
            break;

        case 'update':
            $customerId = $_POST['Customer_ID'];
            $name = trim($_POST['Name']);
            $contact = trim($_POST['Contact_Number'] ?? '');
            $email = trim($_POST['Email'] ?? '');
            $address = trim($_POST['Address'] ?? '');

            if (empty($name)) {
                echo json_encode(['success' => false, 'message' => 'Customer name is required']);
                break;
            }

            $sql = "UPDATE customer 
                    SET Name = :name, Contact_Number = :contact, Email = :email, Address = :address 
                    WHERE Customer_ID = :customer_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':contact', $contact);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':address', $address);
            $stmt->bindParam(':customer_id', $customerId);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Customer updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update customer']);
            }
            break;

        case 'delete':
            $customerId = $_POST['Customer_ID'];

            // Check if customer has sales
            $checkSql = "SELECT COUNT(*) as sales_count FROM sales WHERE Customer_ID = :customer_id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->bindParam(':customer_id', $customerId);
            $checkStmt->execute();
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($result['sales_count'] > 0) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete customer with existing sales records']);
                break;
            }

            $sql = "DELETE FROM customer WHERE Customer_ID = :customer_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':customer_id', $customerId);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Customer deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete customer']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>