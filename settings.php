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
        case 'read':
            // Read all settings
            $settings = [
                'store' => $this->getStoreSettings(),
                'receipt' => $this->getReceiptSettings(),
                'tax' => $this->getTaxSettings()
            ];
            
            echo json_encode(['success' => true, 'data' => $settings]);
            break;

        case 'update':
            $type = $_POST['type'];
            $settings = json_decode($_POST['settings'], true);

            switch($type) {
                case 'store':
                    $this->saveStoreSettings($settings);
                    break;
                case 'receipt':
                    $this->saveReceiptSettings($settings);
                    break;
                case 'tax':
                    $this->saveTaxSettings($settings);
                    break;
                default:
                    echo json_encode(['success' => false, 'message' => 'Invalid settings type']);
                    return;
            }
            
            echo json_encode(['success' => true, 'message' => 'Settings updated successfully']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

// Helper methods for settings
function getStoreSettings() {
    // For now, return from session/localStorage
    // In production, you'd store these in a database table
    return [
        'storeName' => $_SESSION['store_name'] ?? 'SariStock POS',
        'storeAddress' => $_SESSION['store_address'] ?? '123 Main Street',
        'storePhone' => $_SESSION['store_phone'] ?? '+1 (555) 123-4567',
        'storeEmail' => $_SESSION['store_email'] ?? 'info@saristock.com',
        'currency' => $_SESSION['currency'] ?? 'USD'
    ];
}

function getReceiptSettings() {
    return [
        'receiptHeader' => $_SESSION['receipt_header'] ?? 'Thank you for shopping with us!',
        'receiptFooter' => $_SESSION['receipt_footer'] ?? 'Please come again!',
        'showTax' => $_SESSION['show_tax'] ?? true,
        'show' => $_SESSION['show_'] ?? true,
        'receiptWidth' => $_SESSION['receipt_width'] ?? 42
    ];
}

function getTaxSettings() {
    return [
        'taxRate' => $_SESSION['tax_rate'] ?? 10.0,
        'taxInclusive' => $_SESSION['tax_inclusive'] ?? true,
        'multipleTax' => $_SESSION['multiple_tax'] ?? false
    ];
}

function saveStoreSettings($settings) {
    $_SESSION['store_name'] = $settings['storeName'];
    $_SESSION['store_address'] = $settings['storeAddress'];
    $_SESSION['store_phone'] = $settings['storePhone'];
    $_SESSION['store_email'] = $settings['storeEmail'];
    $_SESSION['currency'] = $settings['currency'];
}

function saveReceiptSettings($settings) {
    $_SESSION['receipt_header'] = $settings['receiptHeader'];
    $_SESSION['receipt_footer'] = $settings['receiptFooter'];
    $_SESSION['show_tax'] = $settings['showTax'];
    $_SESSION['show_'] = $settings['show'];
    $_SESSION['receipt_width'] = $settings['receiptWidth'];
}

function saveTaxSettings($settings) {
    $_SESSION['tax_rate'] = $settings['taxRate'];
    $_SESSION['tax_inclusive'] = $settings['taxInclusive'];
    $_SESSION['multiple_tax'] = $settings['multipleTax'];
}
?>
