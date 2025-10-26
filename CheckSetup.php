<?php
session_start();
header('Content-Type: application/json');
require_once '../config.php';

class SetupChecker {
    private $db;
    
    public function __construct($database) {
        $this->db = $database->getConnection();
    }
    
    public function isSystemSetup() {
        try {
            $sql = "SELECT COUNT(*) as admin_count FROM employee WHERE Role = 'Admin' AND Status = 'Active'";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['admin_count'] > 0;
        } catch (PDOException $e) {
            return false;
        }
    }
}

// Check if system needs setup
$database = new Database();
$setupChecker = new SetupChecker($database);

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $needsSetup = !$setupChecker->isSystemSetup();
    echo json_encode(['needs_setup' => $needsSetup]);
} else {
    echo json_encode(['needs_setup' => false]);
}
?>