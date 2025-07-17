// Configuración de la aplicación
const CONFIG = {
    API_BASE_URL: 'php/',
    ENDPOINTS: {
        GET_GAMES: 'get_juegos.php',
        VOTE: 'votar.php'
    }
};

// Estado de la aplicación
let appState = {
    games: [],
    loading: false,
    error: null
};

// Elementos del DOM
const elements = {
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    retryBtn: document.getElementById('retry-btn'),
    gamesGrid: document.getElementById('games-grid'),
    modal: document.getElementById('imageModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalImage: document.getElementById('modalImage'),
    modalTitle: document.getElementById('modalTitle'),
    modalDescription: document.getElementById('modalDescription'),
    modalDeveloper: document.getElementById('modalDeveloper'),
    modalGenre: document.getElementById('modalGenre'),
    modalDate: document.getElementById('modalDate'),
    closeModal: document.getElementById('closeModal')
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botón de reintentar
    elements.retryBtn.addEventListener('click', () => {
        loadGames();
    });

    // Cerrar modal
    elements.closeModal.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Inicializar aplicación
function initializeApp() {
    loadGames();
}

// Cargar juegos desde la API
async function loadGames() {
    try {
        showLoading();
        hideError();
        
        const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.GET_GAMES);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            appState.games = data.data;
            renderGames();
        } else {
            throw new Error(data.error || 'Error al cargar los juegos');
        }
        
    } catch (error) {
        console.error('Error loading games:', error);
        showError(error.message || 'Error al cargar los juegos');
    } finally {
        hideLoading();
    }
}

// Mostrar indicador de carga
function showLoading() {
    appState.loading = true;
    elements.loading.style.display = 'block';
    elements.gamesGrid.style.display = 'none';
}

// Ocultar indicador de carga
function hideLoading() {
    appState.loading = false;
    elements.loading.style.display = 'none';
    elements.gamesGrid.style.display = 'grid';
}

// Mostrar mensaje de error
function showError(message) {
    appState.error = message;
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.gamesGrid.style.display = 'none';
}

// Ocultar mensaje de error
function hideError() {
    appState.error = null;
    elements.errorMessage.style.display = 'none';
}

// Renderizar juegos en la grilla
function renderGames() {
    if (!appState.games.length) {
        elements.gamesGrid.innerHTML = '<p>No hay juegos disponibles</p>';
        return;
    }
    
    elements.gamesGrid.innerHTML = appState.games.map(game => createGameCard(game)).join('');
    
    // Añadir event listeners a los botones de votar
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', handleVote);
    });
    
    // Añadir event listeners a las imágenes para el modal
    document.querySelectorAll('.game-card__image').forEach(img => {
        img.addEventListener('click', handleImageClick);
    });
}

// Crear tarjeta de juego
function createGameCard(game) {
    const imageUrl = game.imagen_caratula ? `images/${game.imagen_caratula}` : 'images/placeholder.jpg';
    const formattedDate = formatDate(game.fecha_lanzamiento);
    
    return `
        <article class="game-card" data-game-id="${game.id}">
            <div class="game-card__image" data-game-id="${game.id}">
                <img src="${imageUrl}" alt="${game.nombre}" loading="lazy">
                <div class="game-card__overlay">
                    <span>Ver detalles</span>
                </div>
            </div>
            <div class="game-card__content">
                <h2 class="game-card__title">${game.nombre}</h2>
                <p class="game-card__description">${game.descripcion || 'Sin descripción disponible'}</p>
                <div class="game-card__details">
                    <span class="game-card__detail">🎮 ${game.desarrollador}</span>
                    <span class="game-card__detail">📂 ${game.genero}</span>
                    <span class="game-card__detail">📅 ${formattedDate}</span>
                </div>
                <div class="game-card__footer">
                    <div class="game-card__votes">
                        <span>🗳️ Votos:</span>
                        <span class="vote-count" id="votes-${game.id}">${game.votos}</span>
                    </div>
                    <button class="btn btn--primary vote-btn" data-game-id="${game.id}">
                        Votar
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Manejar clic en votar
async function handleVote(e) {
    const button = e.target;
    const gameId = button.dataset.gameId;
    
    // Deshabilitar botón temporalmente
    button.disabled = true;
    button.textContent = 'Votando...';
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.VOTE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id=${gameId}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Actualizar contador de votos
            const voteCountElement = document.getElementById(`votes-${gameId}`);
            if (voteCountElement) {
                voteCountElement.textContent = data.votos;
                
                // Animación de éxito
                voteCountElement.style.color = '#28a745';
                setTimeout(() => {
                    voteCountElement.style.color = '#ff6b35';
                }, 1000);
            }
            
            // Actualizar estado local
            const gameIndex = appState.games.findIndex(g => g.id == gameId);
            if (gameIndex !== -1) {
                appState.games[gameIndex].votos = data.votos;
            }
            
            // Cambiar botón a estado de éxito
            button.textContent = '✓ Votado';
            button.className = 'btn btn--success';
            
            // Reordenar juegos si es necesario
            setTimeout(() => {
                loadGames();
            }, 1500);
            
        } else {
            throw new Error(data.error || 'Error al votar');
        }
        
    } catch (error) {
        console.error('Error voting:', error);
        showNotification('Error al votar: ' + error.message, 'error');
        
        // Restaurar botón
        button.disabled = false;
        button.textContent = 'Votar';
        
    } finally {
        // Rehabilitar botón después de un tiempo
        setTimeout(() => {
            button.disabled = false;
            if (button.textContent === 'Votando...') {
                button.textContent = 'Votar';
            }
        }, 2000);
    }
}

// Manejar clic en imagen para abrir modal
function handleImageClick(e) {
    const gameId = e.currentTarget.dataset.gameId;
    const game = appState.games.find(g => g.id == gameId);
    
    if (game) {
        openModal(game);
    }
}

// Abrir modal con información del juego
function openModal(game) {
    const imageUrl = game.imagen_caratula ? `images/${game.imagen_caratula}` : 'images/placeholder.jpg';
    const formattedDate = formatDate(game.fecha_lanzamiento);
    
    elements.modalImage.src = imageUrl;
    elements.modalImage.alt = game.nombre;
    elements.modalTitle.textContent = game.nombre;
    elements.modalDescription.textContent = game.descripcion || 'Sin descripción disponible';
    elements.modalDeveloper.textContent = `Desarrollador: ${game.desarrollador}`;
    elements.modalGenre.textContent = `Género: ${game.genero}`;
    elements.modalDate.textContent = `Lanzamiento: ${formattedDate}`;
    
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('es-ES', options);
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    // Estilos inline para la notificación
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        backgroundColor: type === 'error' ? '#dc3545' : '#28a745',
        color: 'white',
        borderRadius: '6px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: '9999',
        fontSize: '0.9rem',
        maxWidth: '300px',
        animation: 'slideInRight 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Agregar animaciones CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Utilidades adicionales
const utils = {
    // Debounce para optimizar eventos
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle para optimizar eventos
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }
};

// Exportar funciones para testing (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadGames,
        handleVote,
        formatDate,
        utils
    };
}
