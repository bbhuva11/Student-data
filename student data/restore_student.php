<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Method not allowed']));
}

$action = $_POST['action'] ?? 'restore';
$rollno = trim($_POST['rollno'] ?? '');

if (empty($rollno)) {
    http_response_code(400);
    exit(json_encode(['status' => 'error', 'message' => 'Roll number required.']));
}

$conn = getDbConnection();

if ($action === 'restore') {
    $stmt = $conn->prepare("UPDATE student_data_management SET status = 'active' WHERE rollno = ?");
    $stmt->bind_param("s", $rollno);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Student record restored successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to restore student.']);
    }
    $stmt->close();
} elseif ($action === 'permanent_delete') {
    // Delete target profile image from disk space before database row deletion
    $selectStmt = $conn->prepare("SELECT image_path FROM student_data_management WHERE rollno = ?");
    $selectStmt->bind_param("s", $rollno);
    $selectStmt->execute();
    $res = $selectStmt->get_result();
    
    if ($row = $res->fetch_assoc()) {
        if (!empty($row['image_path']) && file_exists($row['image_path'])) {
            unlink($row['image_path']);
        }
    }
    $selectStmt->close();
    $stmt = $conn->prepare("DELETE FROM student_data_management WHERE rollno = ?");
    $stmt->bind_param("s", $rollno);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Student permanently deleted.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete record permanently.']);
    }
    $stmt->close();
}

$conn->close();
?>