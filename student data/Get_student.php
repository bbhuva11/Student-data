<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit(json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]));
}

$rollno = trim($_GET['rollno'] ?? '');

if ($rollno === '') {
    http_response_code(422);
    exit(json_encode([
        'status' => 'error',
        'message' => 'Roll no is required.'
    ]));
}

$conn = getDbConnection();

$stmt = $conn->prepare('SELECT rollno, name, standard, email, phone FROM student_data_management WHERE rollno = ?');
$stmt->bind_param('s', $rollno);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if ($row) {
    echo json_encode([
        'status' => 'success',
        'data' => $row
    ]);
} else {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'No student found with that roll no.'
    ]);
}

$stmt->close();
$conn->close();
?>