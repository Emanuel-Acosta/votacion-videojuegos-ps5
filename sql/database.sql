-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS videojuegos_ps5 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE videojuegos_ps5;

-- Tabla juegos
CREATE TABLE IF NOT EXISTS juegos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    desarrollador VARCHAR(255),
    genero VARCHAR(100),
    fecha_lanzamiento DATE,
    imagen_caratula VARCHAR(255),
    votos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla votos (opcional)
CREATE TABLE IF NOT EXISTS votos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    juego_id INT NOT NULL,
    ip_address VARCHAR(45),
    fecha_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (juego_id) REFERENCES juegos(id) ON DELETE CASCADE,
    INDEX idx_juego_ip (juego_id, ip_address)
);

-- Insertar juegos
INSERT INTO juegos (nombre, descripcion, desarrollador, genero, fecha_lanzamiento, imagen_caratula, votos) VALUES
('The Last of Us Part II', 'Secuela del aclamado juego de supervivencia en un mundo post-apocalíptico', 'Naughty Dog', 'Acción/Aventura', '2020-06-19', 'tlou2.jpg', 0),
('God of War Ragnarök', 'Kratos y Atreus se enfrentan al final de los tiempos nórdicos', 'Santa Monica Studio', 'Acción/Aventura', '2022-11-09', 'god_of_war_ragnarok.jpg', 0),
('Spider-Man: Miles Morales', 'Miles Morales toma el manto de Spider-Man en Nueva York', 'Insomniac Games', 'Acción/Aventura', '2020-11-12', 'spiderman_miles_morales.jpg', 0),
('Horizon Forbidden West', 'Aloy explora nuevas tierras en un mundo post-apocalíptico', 'Guerrilla Games', 'RPG/Acción', '2022-02-18', 'horizon_forbidden_west.jpg', 0),
('Elden Ring', 'Un mundo abierto de fantasía oscura creado por FromSoftware', 'FromSoftware', 'RPG/Acción', '2022-02-25', 'elden_ring.jpg', 0),
('Returnal', 'Un thriller psicológico de ciencia ficción con elementos roguelike', 'Housemarque', 'Roguelike/Acción', '2021-04-30', 'returnal.jpg', 0),
('Ratchet & Clank: Rift Apart', 'Una aventura interdimensional con gráficos espectaculares', 'Insomniac Games', 'Plataformas/Acción', '2021-06-11', 'ratchet_clank_rift_apart.jpg', 0),
('Demon\'s Souls', 'Remake del clásico juego de rol de acción desafiante', 'Bluepoint Games', 'RPG/Acción', '2020-11-12', 'demons_souls.jpg', 0),
('Gran Turismo 7', 'La experiencia de conducción más realista en PlayStation', 'Polyphony Digital', 'Simulación/Carreras', '2022-03-04', 'gran_turismo_7.jpg', 0),
('Ghost of Tsushima Director\'s Cut', 'La versión definitiva del samurái en el Japón feudal', 'Sucker Punch Productions', 'Acción/Aventura', '2021-08-20', 'ghost_of_tsushima_dc.jpg', 0);

-- Índices para mejorar rendimiento
CREATE INDEX idx_votos ON juegos(votos DESC);
CREATE INDEX idx_nombre ON juegos(nombre);
CREATE INDEX idx_genero ON juegos(genero);

-- Vista para ranking de juegos
CREATE VIEW juegos_ranking AS
SELECT 
    id, nombre, descripcion, desarrollador, genero,
    fecha_lanzamiento, imagen_caratula, votos,
    RANK() OVER (ORDER BY votos DESC) as ranking
FROM juegos
ORDER BY votos DESC;

-- Procedimiento almacenado para votar
DELIMITER //
CREATE PROCEDURE VotarJuego(IN juego_id INT, IN ip_votante VARCHAR(45))
BEGIN
    DECLARE voto_existente INT DEFAULT 0;

    SELECT COUNT(*) INTO voto_existente 
    FROM votos 
    WHERE juego_id = juego_id AND ip_address = ip_votante;

    IF voto_existente = 0 THEN
        INSERT INTO votos (juego_id, ip_address) VALUES (juego_id, ip_votante);
        UPDATE juegos SET votos = votos + 1 WHERE id = juego_id;
        SELECT 'success' as resultado, 'Voto registrado correctamente' as mensaje;
    ELSE
        SELECT 'error' as resultado, 'Ya has votado por este juego' as mensaje;
    END IF;
END//
DELIMITER ;

-- Función para obtener ranking
DELIMITER //
CREATE FUNCTION ObtenerRanking(juego_id INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE ranking_juego INT;
    SELECT ranking INTO ranking_juego
    FROM juegos_ranking
    WHERE id = juego_id;
    RETURN ranking_juego;
END//
DELIMITER ;

-- Datos de prueba para los votos
UPDATE juegos SET votos = 150 WHERE nombre = 'God of War Ragnarök';
UPDATE juegos SET votos = 142 WHERE nombre = 'The Last of Us Part II';
UPDATE juegos SET votos = 138 WHERE nombre = 'Elden Ring';
UPDATE juegos SET votos = 125 WHERE nombre = 'Horizon Forbidden West';
UPDATE juegos SET votos = 118 WHERE nombre = 'Spider-Man: Miles Morales';
UPDATE juegos SET votos = 95 WHERE nombre = 'Ghost of Tsushima Director\'s Cut';
UPDATE juegos SET votos = 87 WHERE nombre = 'Ratchet & Clank: Rift Apart';
UPDATE juegos SET votos = 76 WHERE nombre = 'Returnal';
UPDATE juegos SET votos = 65 WHERE nombre = 'Demon\'s Souls';
UPDATE juegos SET votos = 54 WHERE nombre = 'Gran Turismo 7';

-- Consulta para ver el ranking actual
SELECT * FROM juegos_ranking;

-- Usuario web para la aplicación (opcional - descomenta si es necesario)
-- CREATE USER 'web_user'@'localhost' IDENTIFIED BY 'password_seguro';
-- GRANT SELECT, INSERT, UPDATE ON videojuegos_ps5.* TO 'web_user'@'localhost';
-- FLUSH PRIVILEGES;
