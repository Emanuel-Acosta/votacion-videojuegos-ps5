<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Obtener el ID del juego
$id = $_POST['id'] ?? null;

// Validar el ID
if (!$id || !is_numeric($id)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'ID inválido'
    ]);
    exit;
}

try {
    // Verificar que el juego existe
    $stmt = $pdo->prepare("SELECT id FROM juegos WHERE id = ?");
    $stmt->execute([$id]);
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Juego no encontrado'
        ]);
        exit;
    }
    
    // Incrementar el voto
    $stmt = $pdo->prepare("UPDATE juegos SET votos = votos + 1 WHERE id = ?");
    $stmt->execute([$id]);
    
    // Obtener el nuevo número de votos
    $stmt = $pdo->prepare("SELECT votos FROM juegos WHERE id = ?");
    $stmt->execute([$id]);
    $votos = $stmt->fetchColumn();
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Voto registrado correctamente',
        'votos' => $votos,
        'juego_id' => $id
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al procesar el voto',
        'message' => $e->getMessage()
    ]);
    error_log("Error en votar.php: " . $e->getMessage());
}
?>
