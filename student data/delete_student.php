<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Method not allowed']));
}

$rollno = isset($_POST['rollno']) ? trim($_POST['rollno']) : '';

if (empty($rollno)) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Roll number parameter required.']));
}

$conn = getDbConnection();

// Soft delete: update status to inactive
$stmt = $conn->prepare("UPDATE student_data_management SET status = 'inactive' WHERE rollno = ?");
$stmt->bind_param("s", $rollno);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'danger', 
        'message' => 'Student moved to Recycle Bin.'
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to move student to Recycle Bin.']);
}

$stmt->close();
$conn->close();
?>