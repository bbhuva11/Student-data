<?php
$servername = 'localhost';
$username = 'root';
$password = '';
$dbname = 'firstdatabase';

function getDbConnection() {
    global $servername, $username, $password, $dbname;

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]));
    }
    $conn->set_charset('utf8mb4');

    $conn->query("CREATE TABLE IF NOT EXISTS student_data_management (
        rollno INT(30) NOT NULL,
        name VARCHAR(30) NOT NULL,
        standard INT(12) NOT NULL,
        email VARCHAR(50) NOT NULL,
        phone VARCHAR(10) NOT NULL,
        PRIMARY KEY (rollno)
    )");

    // Ensure status column exists
    $statusCheck = $conn->query("SHOW COLUMNS FROM student_data_management LIKE 'status'");
    if ($statusCheck && $statusCheck->num_rows === 0) {
        $conn->query("ALTER TABLE student_data_management ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'");
    }

    return $conn;
}
?>