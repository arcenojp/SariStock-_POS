<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['employee_id'])) {
    echo json_encode([
        'success' => true,
        'user' => [
            'Employee_ID' => $_SESSION['employee_id'],
            'username' => $_SESSION['username'],
            'Full_Name' => $_SESSION['full_name'],
            'Role' => $_SESSION['role']
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
}
?>