<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['status' => 'error', 'message' => 'Method not allowed']));
}

$conn = getDbConnection();

$mode          = $_POST['mode'] ?? 'insert';
$rollno        = trim($_POST['rollno'] ?? '');
$name          = trim($_POST['name'] ?? '');
$standard      = trim($_POST['standard'] ?? '');
$email         = trim($_POST['email'] ?? '');
$phone         = trim($_POST['phone'] ?? '');
$existingImage = trim($_POST['existing_image'] ?? '');

if (empty($rollno)) {
    exit(json_encode(['status' => 'error', 'message' => 'Roll No is required.']));
}

// Pre-check for existing Roll No on insert
if ($mode === 'insert') {
    $checkStmt = $conn->prepare("SELECT rollno FROM student_data_management WHERE rollno = ?");
    $checkStmt->bind_param("s", $rollno);
    $checkStmt->execute();
    $checkStmt->store_result();

    if ($checkStmt->num_rows > 0) {
        $checkStmt->close();
        $conn->close();
        exit(json_encode(['status' => 'error', 'message' => 'Roll No already exists.']));
    }
    $checkStmt->close();
}

$imagePath = $existingImage;

// Image upload processing with file replacement cleanup
if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath   = $_FILES['profile_image']['tmp_name'];
    $fileName      = $_FILES['profile_image']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (in_array($fileExtension, $allowedExtensions)) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $newFileName    = 'student_' . $rollno . '_' . time() . '.' . $fileExtension;
        $targetFilePath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $targetFilePath)) {
            if ($mode === 'update' && !empty($existingImage) && file_exists($existingImage)) {
                unlink($existingImage);
            }
            $imagePath = $targetFilePath;
        } else {
            exit(json_encode(['status' => 'error', 'message' => 'Failed to save uploaded image.']));
        }
    } else {
        exit(json_encode(['status' => 'error', 'message' => 'Invalid image type. Only JPG, PNG, WEBP allowed.']));
    }
}

// Database Insertion or Update
if ($mode === 'insert') {
    $stmt = $conn->prepare("INSERT INTO student_data_management (rollno, name, standard, email, phone, image_path) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $rollno, $name, $standard, $email, $phone, $imagePath);
} else {
    $stmt = $conn->prepare("UPDATE student_data_management SET name = ?, standard = ?, email = ?, phone = ?, image_path = ? WHERE rollno = ?");
    $stmt->bind_param("ssssss", $name, $standard, $email, $phone, $imagePath, $rollno);
}

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Record saved successfully!']);
} else {
    if ($conn->errno === 1062) {
        echo json_encode(['status' => 'error', 'message' => 'Roll No already exists.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database operation failed: ' . $stmt->error]);
    }
}

$stmt->close();
$conn->close();
?>