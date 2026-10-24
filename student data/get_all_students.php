<?php
require_once 'config.php';

header('Content-Type: application/json');

error_reporting(0);
ini_set('display_errors', 0);

try {
    $conn = getDbConnection();

    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 5;
    $offset = ($page - 1) * $limit;

    $sortBy = $_GET['sort_by'] ?? 'rollno';
    $order = strtoupper($_GET['order'] ?? 'ASC');
    $search = trim($_GET['search'] ?? '');
    $viewType = $_GET['view_type'] ?? 'active'; // 'active' or 'recycle'

    $allowedSortColumns = ['rollno', 'name', 'standard', 'email', 'phone'];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'rollno';
    }

    if ($order !== 'ASC' && $order !== 'DESC') {
        $order = 'ASC';
    }

    $hasImageCol = false;
    $colCheck = $conn->query("SHOW COLUMNS FROM student_data_management LIKE 'image_path'");
    if ($colCheck && $colCheck->num_rows > 0) {
        $hasImageCol = true;
    }

    // Determine target status
    $statusFilter = ($viewType === 'recycle') ? "status = 'inactive'" : "(status = 'active' OR status IS NULL OR status = '')";

    // Build Search Query
    $whereClause = " WHERE {$statusFilter}";
    $params = [];
    $types = "";

    if (!empty($search)) {
        $whereClause .= " AND (rollno LIKE ? OR name LIKE ? OR standard LIKE ? OR email LIKE ? OR phone LIKE ?)";
        $searchTerm = "%" . $search . "%";
        $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm];
        $types = "sssss";
    }

    // Total Count Query
    $countSql = "SELECT COUNT(*) as total FROM student_data_management" . $whereClause;
    $stmtCount = $conn->prepare($countSql);
    if (!empty($search)) {
        $stmtCount->bind_param($types, ...$params);
    }
    $stmtCount->execute();
    $totalRecords = $stmtCount->get_result()->fetch_assoc()['total'];
    $totalPages = ceil($totalRecords / $limit);
    $stmtCount->close();

    // Fetch Data Query
    $dataSql = "SELECT * FROM student_data_management" . $whereClause . " ORDER BY {$sortBy} {$order} LIMIT ? OFFSET ?";
    
    $stmtData = $conn->prepare($dataSql);
    
    if (!empty($search)) {
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;
        $stmtData->bind_param($types, ...$params);
    } else {
        $stmtData->bind_param("ii", $limit, $offset);
    }

    $stmtData->execute();
    $result = $stmtData->get_result();

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = [
            'rollno' => $row['rollno'],
            'name' => $row['name'],
            'standard' => $row['standard'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'image_path' => $hasImageCol ? ($row['image_path'] ?? '') : ''
        ];
    }

    $stmtData->close();
    $conn->close();

    echo json_encode([
        'status' => 'success',
        'data' => $students,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_records' => (int)$totalRecords,
            'total_pages' => (int)$totalPages
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>