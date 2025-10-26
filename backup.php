<?php
session_start();
header('Content-Type: application/json');
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$action = $_POST['action'] ?? '';

// Only allow admins to backup/restore
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(['success' => false, 'message' => 'Access denied. Admin only.']);
    exit;
}

try {
    switch($action) {
        case 'create':
            createBackup($db);
            break;
            
        case 'restore':
            restoreBackup($db);
            break;
            
        case 'list':
            listBackups();
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

function createBackup($db) {
    $backupDir = __DIR__ . '/../backups/';
    
    // Create backups directory if it doesn't exist
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d_H-i-s');
    $backupFile = $backupDir . "backup_{$timestamp}.sql";
    
    // Get all table names
    $tables = [];
    $result = $db->query("SHOW TABLES");
    while ($row = $result->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    $backupContent = "";
    
    foreach ($tables as $table) {
        // Add drop table statement
        $backupContent .= "DROP TABLE IF EXISTS `$table`;\n";
        
        // Get create table statement
        $createResult = $db->query("SHOW CREATE TABLE `$table`");
        $createRow = $createResult->fetch(PDO::FETCH_NUM);
        $backupContent .= $createRow[1] . ";\n\n";
        
        // Get table data
        $dataResult = $db->query("SELECT * FROM `$table`");
        while ($row = $dataResult->fetch(PDO::FETCH_ASSOC)) {
            $columns = implode('`, `', array_keys($row));
            $values = implode("', '", array_map(function($value) use ($db) {
                return $db->quote($value);
            }, $row));
            
            $backupContent .= "INSERT INTO `$table` (`$columns`) VALUES ($values);\n";
        }
        $backupContent .= "\n";
    }
    
    if (file_put_contents($backupFile, $backupContent)) {
        echo json_encode([
            'success' => true, 
            'message' => 'Backup created successfully',
            'filename' => "backup_{$timestamp}.sql"
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create backup file']);
    }
}

function restoreBackup($db) {
    $backupDir = __DIR__ . '/../backups/';
    $backupFile = $_POST['filename'] ?? '';
    
    if (empty($backupFile)) {
        echo json_encode(['success' => false, 'message' => 'No backup file specified']);
        return;
    }
    
    $filePath = $backupDir . $backupFile;
    
    if (!file_exists($filePath)) {
        echo json_encode(['success' => false, 'message' => 'Backup file not found']);
        return;
    }
    
    // Read backup file
    $sql = file_get_contents($filePath);
    
    if (!$sql) {
        echo json_encode(['success' => false, 'message' => 'Failed to read backup file']);
        return;
    }
    
    // Split SQL into individual statements
    $queries = explode(";\n", $sql);
    
    // Disable foreign key checks during restore
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    try {
        foreach ($queries as $query) {
            $query = trim($query);
            if (!empty($query)) {
                $db->exec($query);
            }
        }
        
        // Re-enable foreign key checks
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        echo json_encode(['success' => true, 'message' => 'Database restored successfully']);
    } catch (PDOException $e) {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
        throw $e;
    }
}

function listBackups() {
    $backupDir = __DIR__ . '/../backups/';
    $backups = [];
    
    if (is_dir($backupDir)) {
        $files = glob($backupDir . "backup_*.sql");
        
        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'created' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }
        
        // Sort by creation time (newest first)
        usort($backups, function($a, $b) {
            return strtotime($b['created']) - strtotime($a['created']);
        });
    }
    
    echo json_encode(['success' => true, 'data' => $backups]);
}
?>