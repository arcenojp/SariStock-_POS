<?php
session_start();
header('Content-Type: application/json');
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $database = new Database();
    $db = $database->getConnection();
    
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    
    // Input validation
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        exit;
    }
    
    try {
        $sql = "SELECT Employee_ID, username, password, Full_Name, Role, Status 
                FROM employee 
                WHERE username = :username AND Status = 'Active'";
        
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        if ($stmt->rowCount() == 1) {
            $employee = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // TEMPORARY FIX: Check both hashed and plain text passwords
            $passwordValid = false;
            
            // First try password_verify (for hashed passwords)
            if (password_verify($password, $employee['password'])) {
                $passwordValid = true;
            }
            // Then try direct comparison (for plain text passwords)
            else if ($password === $employee['password']) {
                $passwordValid = true;
                
                // Auto-upgrade to hashed password
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $updateSql = "UPDATE employee SET password = :hashedPassword WHERE Employee_ID = :employeeId";
                $updateStmt = $db->prepare($updateSql);
                $updateStmt->bindParam(':hashedPassword', $hashedPassword);
                $updateStmt->bindParam(':employeeId', $employee['Employee_ID']);
                $updateStmt->execute();
            }
            
            if ($passwordValid) {
                $_SESSION['employee_id'] = $employee['Employee_ID'];
                $_SESSION['username'] = $employee['username'];
                $_SESSION['full_name'] = $employee['Full_Name'];
                $_SESSION['role'] = $employee['Role'];
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Login successful',
                    'redirect' => 'dashboard.html'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>