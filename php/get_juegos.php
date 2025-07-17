<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

try {
    // Obtener todos los juegos ordenados por votos (descendente)
    $stmt = $pdo->query("SELECT * FROM juegos ORDER BY votos DESC");
    $juegos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $juegos,
        'total' => count($juegos)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener los juegos',
        'message' => $e->getMessage()
    ]);
    error_log("Error en get_juegos.php: " . $e->getMessage());
}
?>
