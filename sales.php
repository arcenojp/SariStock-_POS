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
            $customerId = $_POST['Customer_ID'] ?? null;
            $cashierId = $_SESSION['employee_id'];
            $totalAmount = $_POST['TotalAmount'];
            $paymentMethod = $_POST['Payment_Method'];
            $items = json_decode($_POST['items'], true);

            if (empty($cashierId) || empty($totalAmount) || empty($paymentMethod) || empty($items)) {
                echo json_encode(['success' => false, 'message' => 'Required data is missing']);
                break;
            }

            // Start transaction
            $db->beginTransaction();

            try {
                // Insert sale
                $sql = "INSERT INTO sales (Sale_Date, Customer_ID, Cashier_ID, TotalAmount, Payment_Method, Status) 
                        VALUES (NOW(), :customer_id, :cashier_id, :total_amount, :payment_method, 'Completed')";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':customer_id', $customerId);
                $stmt->bindParam(':cashier_id', $cashierId);
                $stmt->bindParam(':total_amount', $totalAmount);
                $stmt->bindParam(':payment_method', $paymentMethod);
                $stmt->execute();

                $saleId = $db->lastInsertId();

                // Insert sale items and update product stock
                foreach ($items as $item) {
                    // Insert sale item
                    $itemSql = "INSERT INTO sales_detail (Sale_ID, Product_ID, Quantity, Price, SubTotal) 
                                VALUES (:sale_id, :product_id, :quantity, :price, :subtotal)";
                    $itemStmt = $db->prepare($itemSql);
                    $itemStmt->bindParam(':sale_id', $saleId);
                    $itemStmt->bindParam(':product_id', $item['Product_ID']);
                    $itemStmt->bindParam(':quantity', $item['Quantity']);
                    $itemStmt->bindParam(':price', $item['Price']);
                    $itemStmt->bindParam(':subtotal', $item['SubTotal']);
                    $itemStmt->execute();

                    // Update product stock
                    $updateSql = "UPDATE product SET Stock_Quantity = Stock_Quantity - :quantity 
                                  WHERE Product_ID = :product_id";
                    $updateStmt = $db->prepare($updateSql);
                    $updateStmt->bindParam(':quantity', $item['Quantity']);
                    $updateStmt->bindParam(':product_id', $item['Product_ID']);
                    $updateStmt->execute();
                }

                $db->commit();
                echo json_encode(['success' => true, 'message' => 'Sale completed successfully', 'Sale_ID' => $saleId]);

            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;

        case 'read':
            $saleId = $_POST['Sale_ID'] ?? null;
            $startDate = $_POST['start_date'] ?? null;
            $endDate = $_POST['end_date'] ?? null;
            $paymentMethod = $_POST['Payment_Method'] ?? null;
            $status = $_POST['Status'] ?? null;

            if ($saleId) {
                // Read single sale with items
                $saleSql = "SELECT s.*, c.Name as customer_name, e.Full_Name as cashier_name 
                            FROM sales s 
                            LEFT JOIN customer c ON s.Customer_ID = c.Customer_ID 
                            LEFT JOIN employee e ON s.Cashier_ID = e.Employee_ID 
                            WHERE s.Sale_ID = :sale_id";
                $saleStmt = $db->prepare($saleSql);
                $saleStmt->bindParam(':sale_id', $saleId);
                $saleStmt->execute();
                $sale = $saleStmt->fetch(PDO::FETCH_ASSOC);

                if ($sale) {
                    // Get sale items
                    $itemsSql = "SELECT sd.*, p.Product_Name 
                                 FROM sales_detail sd 
                                 JOIN product p ON sd.Product_ID = p.Product_ID 
                                 WHERE sd.Sale_ID = :sale_id";
                    $itemsStmt = $db->prepare($itemsSql);
                    $itemsStmt->bindParam(':sale_id', $saleId);
                    $itemsStmt->execute();
                    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

                    $sale['items'] = $items;
                    echo json_encode(['success' => true, 'data' => [$sale]]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Sale not found']);
                }
            } else {
                // Read all sales with filters
                $sql = "SELECT s.*, c.Name as customer_name, e.Full_Name as cashier_name 
                        FROM sales s 
                        LEFT JOIN customer c ON s.Customer_ID = c.Customer_ID 
                        LEFT JOIN employee e ON s.Cashier_ID = e.Employee_ID 
                        WHERE 1=1";
                $params = [];

                if (!empty($startDate)) {
                    $sql .= " AND DATE(s.Sale_Date) >= :start_date";
                    $params[':start_date'] = $startDate;
                }

                if (!empty($endDate)) {
                    $sql .= " AND DATE(s.Sale_Date) <= :end_date";
                    $params[':end_date'] = $endDate;
                }

                if (!empty($paymentMethod)) {
                    $sql .= " AND s.Payment_Method = :payment_method";
                    $params[':payment_method'] = $paymentMethod;
                }

                if (!empty($status)) {
                    $sql .= " AND s.Status = :status";
                    $params[':status'] = $status;
                }

                $sql .= " ORDER BY s.Sale_Date DESC";

                $stmt = $db->prepare($sql);
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->execute();
                $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $sales]);
            }
            break;

        case 'update':
            // For refunds or status updates
            $saleId = $_POST['Sale_ID'];
            $status = $_POST['Status'];

            $sql = "UPDATE sales SET Status = :status WHERE Sale_ID = :sale_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':sale_id', $saleId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Sale updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update sale']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>