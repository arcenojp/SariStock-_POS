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
            $username = trim($_POST['username']);
            $password = $_POST['password'];
            $fullName = trim($_POST['Full_Name']);
            $role = $_POST['Role'];
            $status = $_POST['Status'];

            // Validation
            if (empty($username) || empty($password) || empty($fullName) || empty($role)) {
                echo json_encode(['success' => false, 'message' => 'All fields are required']);
                break;
            }

            // Check if username exists
            $checkSql = "SELECT Employee_ID FROM employee WHERE username = :username";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->bindParam(':username', $username);
            $checkStmt->execute();

            if ($checkStmt->rowCount() > 0) {
                echo json_encode(['success' => false, 'message' => 'Username already exists']);
                break;
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            $sql = "INSERT INTO employee (username, password, Full_Name, Role, Status, created_at) 
                    VALUES (:username, :password, :full_name, :role, :status, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':full_name', $fullName);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':status', $status);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Employee created successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create employee']);
            }
            break;

        case 'read':
            $employeeId = $_POST['Employee_ID'] ?? null;
            $role = $_POST['Role'] ?? null;
            $status = $_POST['Status'] ?? null;
            $search = $_POST['search'] ?? '';

            if ($employeeId) {
                // Read single employee
                $sql = "SELECT Employee_ID, username, Full_Name, Role, Status, created_at 
                        FROM employee 
                        WHERE Employee_ID = :employee_id";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':employee_id', $employeeId);
                $stmt->execute();
                $employee = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($employee) {
                    echo json_encode(['success' => true, 'data' => $employee]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Employee not found']);
                }
            } else {
                // Read all employees with filters
                $sql = "SELECT Employee_ID, username, Full_Name, Role, Status, created_at 
                        FROM employee 
                        WHERE 1=1";
                $params = [];

                if (!empty($role)) {
                    $sql .= " AND Role = :role";
                    $params[':role'] = $role;
                }

                if (!empty($status)) {
                    $sql .= " AND Status = :status";
                    $params[':status'] = $status;
                }

                if (!empty($search)) {
                    $sql .= " AND (username LIKE :search OR Full_Name LIKE :search)";
                    $searchTerm = "%$search%";
                    $params[':search'] = $searchTerm;
                }

                $sql .= " ORDER BY created_at DESC";

                $stmt = $db->prepare($sql);
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->execute();
                $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'data' => $employees]);
            }
            break;

        case 'update':
            $employeeId = $_POST['Employee_ID'];
            $username = trim($_POST['username']);
            $fullName = trim($_POST['Full_Name']);
            $role = $_POST['Role'];
            $status = $_POST['Status'];
            $password = $_POST['password'] ?? '';

            if (empty($username) || empty($fullName) || empty($role)) {
                echo json_encode(['success' => false, 'message' => 'Required fields are missing']);
                break;
            }

            // Check if username exists (excluding current employee)
            $checkSql = "SELECT Employee_ID FROM employee WHERE username = :username AND Employee_ID != :employee_id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->bindParam(':username', $username);
            $checkStmt->bindParam(':employee_id', $employeeId);
            $checkStmt->execute();

            if ($checkStmt->rowCount() > 0) {
                echo json_encode(['success' => false, 'message' => 'Username already exists']);
                break;
            }

            if (!empty($password)) {
                // Update with new password
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $sql = "UPDATE employee 
                        SET username = :username, password = :password, Full_Name = :full_name, 
                            Role = :role, Status = :status 
                        WHERE Employee_ID = :employee_id";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(':password', $hashedPassword);
            } else {
                // Update without changing password
                $sql = "UPDATE employee 
                        SET username = :username, Full_Name = :full_name, Role = :role, Status = :status 
                        WHERE Employee_ID = :employee_id";
                $stmt = $db->prepare($sql);
            }

            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':full_name', $fullName);
            $stmt->bindParam(':role', $role);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':employee_id', $employeeId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Employee updated successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update employee']);
            }
            break;

        case 'delete':
            $employeeId = $_POST['Employee_ID'];

            // Prevent deleting own account
            if (isset($_SESSION['employee_id']) && $_SESSION['employee_id'] == $employeeId) {
                echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
                break;
            }

            // Check if employee has sales
            $checkSql = "SELECT COUNT(*) as sales_count FROM sales WHERE Cashier_ID = :employee_id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->bindParam(':employee_id', $employeeId);
            $checkStmt->execute();
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($result['sales_count'] > 0) {
                echo json_encode(['success' => false, 'message' => 'Cannot delete employee with sales records']);
                break;
            }

            $sql = "DELETE FROM employee WHERE Employee_ID = :employee_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':employee_id', $employeeId);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Employee deleted successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete employee']);
            }
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>