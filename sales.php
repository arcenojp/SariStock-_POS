<?php
session_start();
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

$action = $_POST['action'] ?? '';

try {
    switch ($action) {

        // -----------------------------
        // CREATE SALE
        // -----------------------------
        case 'create':
            $customerId = $_POST['Customer_ID'] ?? null;
            $cashierId = $_POST['Cashier_ID'] ?? ($_SESSION['employee_id'] ?? $_SESSION['user_id'] ?? 0);
            $totalAmount = $_POST['TotalAmount'] ?? null;
            $paymentMethod = $_POST['Payment_Method'] ?? null;
            $items = isset($_POST['items']) ? json_decode($_POST['items'], true) : [];

            if ($totalAmount === null || $paymentMethod === null || empty($items)) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Missing required data (cashier, total, payment method, or items).'
                ]);
                exit;
            }

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

                // Insert sale items
                $itemSql = "INSERT INTO sales_detail (Sale_ID, Product_ID, Quantity, Price, SubTotal)
                            VALUES (:sale_id, :product_id, :quantity, :price, :subtotal)";
                $itemStmt = $db->prepare($itemSql);

                // Update stock
                $updateSql = "UPDATE product 
                              SET Stock_Quantity = Stock_Quantity - :quantity 
                              WHERE Product_ID = :product_id";
                $updateStmt = $db->prepare($updateSql);

                foreach ($items as $item) {
                    $itemStmt->execute([
                        ':sale_id' => $saleId,
                        ':product_id' => $item['Product_ID'],
                        ':quantity' => $item['Quantity'],
                        ':price' => $item['Price'],
                        ':subtotal' => $item['SubTotal']
                    ]);

                    $updateStmt->execute([
                        ':quantity' => $item['Quantity'],
                        ':product_id' => $item['Product_ID']
                    ]);
                }

                $db->commit();
                echo json_encode([
                    'success' => true,
                    'message' => 'Sale completed successfully.',
                    'Sale_ID' => $saleId
                ]);

            } catch (Exception $e) {
                $db->rollBack();
                echo json_encode([
                    'success' => false,
                    'message' => 'Transaction failed: ' . $e->getMessage()
                ]);
            }
            break;

        // -----------------------------
        // READ SALE(S)
        // -----------------------------
        case 'read':
            $saleId = $_POST['Sale_ID'] ?? null;
            $startDate = $_POST['start_date'] ?? null;
            $endDate = $_POST['end_date'] ?? null;
            $paymentMethod = $_POST['Payment_Method'] ?? null;
            $status = $_POST['Status'] ?? null;

            if ($saleId) {
                // Single sale with items
                $saleSql = "SELECT s.*, c.Name AS customer_name, e.Full_Name AS cashier_name
                            FROM sales s
                            LEFT JOIN customer c ON s.Customer_ID = c.Customer_ID
                            LEFT JOIN employee e ON s.Cashier_ID = e.Employee_ID
                            WHERE s.Sale_ID = :sale_id";
                $saleStmt = $db->prepare($saleSql);
                $saleStmt->bindParam(':sale_id', $saleId);
                $saleStmt->execute();
                $sale = $saleStmt->fetch(PDO::FETCH_ASSOC);

                if ($sale) {
                    $itemsSql = "SELECT sd.*, p.Product_Name
                                 FROM sales_detail sd
                                 JOIN product p ON sd.Product_ID = p.Product_ID
                                 WHERE sd.Sale_ID = :sale_id";
                    $itemsStmt = $db->prepare($itemsSql);
                    $itemsStmt->bindParam(':sale_id', $saleId);
                    $itemsStmt->execute();
                    $sale['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

                    echo json_encode(['success' => true, 'data' => $sale]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Sale not found']);
                }

            } else {
                // All sales with filters
                $sql = "SELECT s.*, c.Name AS customer_name, e.Full_Name AS cashier_name
                        FROM sales s
                        LEFT JOIN customer c ON s.Customer_ID = c.Customer_ID
                        LEFT JOIN employee e ON s.Cashier_ID = e.Employee_ID
                        WHERE 1=1";
                $params = [];

                if ($startDate) {
                    $sql .= " AND DATE(s.Sale_Date) >= :start_date";
                    $params[':start_date'] = $startDate;
                }
                if ($endDate) {
                    $sql .= " AND DATE(s.Sale_Date) <= :end_date";
                    $params[':end_date'] = $endDate;
                }
                if ($paymentMethod) {
                    $sql .= " AND s.Payment_Method = :payment_method";
                    $params[':payment_method'] = $paymentMethod;
                }
                if ($status) {
                    $sql .= " AND s.Status = :status";
                    $params[':status'] = $status;
                }

                $sql .= " ORDER BY s.Sale_Date DESC";
                $stmt = $db->prepare($sql);

                foreach ($params as $key => $val) {
                    $stmt->bindValue($key, $val);
                }

                $stmt->execute();
                $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'data' => $sales]);
            }
            break;

        // -----------------------------
        // UPDATE SALE STATUS
        // -----------------------------
        case 'update':
            $saleId = $_POST['Sale_ID'] ?? null;
            $status = $_POST['Status'] ?? null;

            if (!$saleId || !$status) {
                echo json_encode(['success' => false, 'message' => 'Missing Sale_ID or Status']);
                exit;
            }

            $sql = "UPDATE sales SET Status = :status WHERE Sale_ID = :sale_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':sale_id', $saleId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Sale status updated successfully.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update sale.']);
            }
            break;

        // -----------------------------
        // INVALID ACTION
        // -----------------------------
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
