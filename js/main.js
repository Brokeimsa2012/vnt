(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);
    
    
    // Initiate the wowjs
    new WOW().init();
    

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 45) {
            $('.nav-bar').addClass('sticky-top shadow-sm').css('top', '0px');
        } else {
            $('.nav-bar').removeClass('sticky-top shadow-sm').css('top', '-100px');
        }
    });


    // Header carousel
    $(".header-carousel").owlCarousel({
        animateOut: 'fadeOut',
        items: 1,
        margin: 0,
        stagePadding: 0,
        autoplay: true,
        smartSpeed: 500,
        dots: true,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
    });



    // testimonial carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: false,
        loop: true,
        margin: 25,
        nav : true,
        navText : [
            '<i class="fa fa-arrow-right"></i>',
            '<i class="fa fa-arrow-left"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0:{
                items:1
            },
            576:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:2
            },
            1200:{
                items:2
            }
        }
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 5,
        time: 2000
    });


   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


})(jQuery);

let chatOpen = false;
const BACKEND_API_URL = 'https://app.vyt.do/api/chat'; // Cambiar a tu dominio backend
const CHAT_STORAGE_KEY = 'vyt_chat_history';

// Cargar conversación guardada al inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadChatHistory();
});

// Función para guardar el historial del chat en localStorage
function saveChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messages = [];
    chatMessages.querySelectorAll('.chat-message').forEach(msg => {
        const isUser = msg.classList.contains('user');
        const isWelcome = msg.classList.contains('welcome-message');
        const isTyping = msg.classList.contains('typing');
        
        // No guardar mensajes de bienvenida ni typing
        if (!isWelcome && !isTyping) {
            const text = msg.querySelector('p')?.textContent || '';
            messages.push({
                type: isUser ? 'user' : 'bot',
                text: text
            });
        }
    });
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

// Función para cargar el historial del chat desde localStorage
function loadChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!savedMessages) return;
    
    try {
        const messages = JSON.parse(savedMessages);
        
        // Limpiar mensajes existentes excepto el de bienvenida
        const welcomeMsg = chatMessages.querySelector('.welcome-message');
        chatMessages.innerHTML = '';
        if (welcomeMsg) {
            chatMessages.appendChild(welcomeMsg);
        }
        
        // Agregar mensajes guardados
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${msg.type}`;
            messageDiv.innerHTML = `<p>${msg.text}</p>`;
            chatMessages.appendChild(messageDiv);
        });
        
        // Auto-scroll al final
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Función para limpiar el historial del chat
function clearChatHistory() {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Mantener solo el mensaje de bienvenida
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    chatMessages.innerHTML = '';
    if (welcomeMsg) {
        chatMessages.appendChild(welcomeMsg);
    }
}

// Chat Functions
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    chatOpen = !chatOpen;
    chatWindow.style.display = chatOpen ? 'block' : 'none';
    
    // Auto-scroll cuando se abre el chat
    if (chatOpen) {
        setTimeout(() => {
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 100);
    }
}

// Función segura - Usa la API del backend (sin token)
async function sendQuickReply(message) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Agregar mensaje del usuario
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user';
    userMessage.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(userMessage);
    
    // Mostrar indicador de "escribiendo..."
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message bot typing';
    typingIndicator.innerHTML = `<p><i class="fas fa-circle"></i> Escribiendo...</p>`;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // 🔒 Llamar al backend seguro (sin exponer credenciales)
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message
            })
        });
        
        // Remover indicador de "escribiendo..."
        if (chatMessages.contains(typingIndicator)) {
            chatMessages.removeChild(typingIndicator);
        }
        
        if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
        }
        
        const data = await response.json();
        
        // Agregar respuesta de la IA
        const botResponse = document.createElement('div');
        botResponse.className = 'chat-message bot';
        const aiText = data.message || 'Lo siento, contacta al (849) 564-5911 para asistencia personalizada.';
        
        botResponse.innerHTML = `<p>${aiText}</p>`;
        chatMessages.appendChild(botResponse);
        
    } catch (error) {
        console.error('Error Chat:', error);
        
        if (chatMessages.contains(typingIndicator)) {
            chatMessages.removeChild(typingIndicator);
        }
        
        const errorResponse = document.createElement('div');
        errorResponse.className = 'chat-message bot';
        errorResponse.innerHTML = `
            <p>Disculpa, problemas técnicos. Contacta:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px;">
                <li>📞 (849) 564-5911</li>
                <li>📧 contacto@vyt.do</li>
                <li>📍 Los Prados, Santo Domingo</li>
            </ul>
        `;
        chatMessages.appendChild(errorResponse);
    }
    
    // Guardar el historial y scroll
    saveChatHistory();
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para enviar mensajes desde el input del chat
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        chatInput.value = '';
        await sendQuickReply(message);
    }
}

// Función para manejar Enter en el chat
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}