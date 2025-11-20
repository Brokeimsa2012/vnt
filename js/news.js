// Configuración general
const NEWSDATA_API_KEY = 'pub_db711019c91c4fc3b599f0868d42ed6c';
const MAX_ARTICLES = 6;

const CACHE_KEY = 'financial_news_cache';
const CACHE_EXPIRY = 3 * 60 * 60 * 1000; // 3 horas

// Utilidades de caché
const NewsCache = {
    getFromCache: function() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const { timestamp, data } = JSON.parse(raw);
            if (Date.now() - timestamp > CACHE_EXPIRY) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            console.log('✅ Usando caché de noticias');
            return data;
        } catch (error) {
            console.error('Error al leer caché:', error);
            return null;
        }
    },
    saveToCache: function(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
            console.log('💾 Noticias guardadas en caché');
        } catch (error) {
            console.error('Error al guardar caché:', error);
        }
    }
};

// Noticias locales como fallback
const fallbackNews = [
    {
        title: "Banco Central anuncia nuevas medidas para fortalecer el sector financiero dominicano",
        description: "El Banco Central de República Dominicana implementará nuevas regulaciones para mejorar la estabilidad del sistema financiero nacional.",
        source_name: "Banco Central RD",
        pubDate: new Date().toISOString(),
        link: "#"
    },
    {
        title: "Aumentan las inversiones extranjeras en el sector tecnológico dominicano",
        description: "Las inversiones en tecnología financiera crecen un 45% en el primer semestre del año, impulsadas por startups locales.",
        source_name: "Periódico Financiero",
        pubDate: new Date(Date.now() - 86400000).toISOString(),
        link: "#"
    },
    {
        title: "DGII lanza nuevo programa de incentivos fiscales para empresas del sector financiero",
        description: "La Dirección General de Impuestos Internos presenta un programa de beneficios tributarios para fortalecer la competitividad del mercado.",
        source_name: "DGII",
        pubDate: new Date(Date.now() - 172800000).toISOString(),
        link: "#"
    },
    {
        title: "Mercado de valores dominicano registra máximos históricos en transacciones",
        description: "La Bolsa de Valores de Santo Domingo alcanza nuevos récords de volumen de operaciones con participación de inversionistas internacionales.",
        source_name: "Bolsa de Santo Domingo",
        pubDate: new Date(Date.now() - 259200000).toISOString(),
        link: "#"
    },
    {
        title: "Cooperativas de crédito expanden servicios digitales en todo el país",
        description: "Las cooperativas de ahorro y crédito dominicanas invierten en plataformas digitales para mejorar la experiencia del cliente.",
        source_name: "CNCC",
        pubDate: new Date(Date.now() - 345600000).toISOString(),
        link: "#"
    },
    {
        title: "Inflación moderada impulsa confianza en mercados financieros dominicanos",
        description: "Analistas económicos proyectan crecimiento sostenido del PIB para el próximo trimestre gracias a la estabilidad de precios.",
        source_name: "Cámara de Comercio",
        pubDate: new Date(Date.now() - 432000000).toISOString(),
        link: "#"
    }
];

async function fetchAndDisplayNews() {
    const blogContainer = document.getElementById('blogContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (!blogContainer) {
        console.error('❌ No se encontró el contenedor #blogContainer');
        return;
    }

    try {
        // Mostrar spinner
        if (loadingSpinner) {
            loadingSpinner.classList.add('active');
        }

        // Intentar usar caché primero
        const cachedNews = NewsCache.getFromCache();
        if (cachedNews && cachedNews.length > 0) {
            displayNews(cachedNews);
            return;
        }

        console.log('🔍 Obteniendo noticias frescas de la API...');
        
        // Búsqueda enfocada en finanzas y negocios de República Dominicana
        const q = 'finanzas OR economía OR mercado OR inversión OR banco';
        const country = 'do'; // República Dominicana
        
        const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(q)}&country=${country}&language=es&category=business`;

        console.log('📡 Consultando API:', url);

        const response = await fetch(url);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`❌ ERROR ${response.status}: ${response.statusText}`);
            console.error(`🧾 Respuesta de la API:\n${errorBody}`);
            throw new Error(`Newsdata.io devolvió ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || !Array.isArray(data.results)) {
            console.warn('⚠️ Formato inesperado en respuesta:', data);
            throw new Error('Respuesta inesperada de Newsdata.io');
        }

        if (data.results.length === 0) {
            console.warn('⚠️ No se encontraron noticias, usando fallback');
            displayNews(fallbackNews);
            return;
        }

        console.log(`✅ ${data.results.length} noticias obtenidas de la API`);
        NewsCache.saveToCache(data.results);
        displayNews(data.results);

    } catch (error) {
        console.error('❗ Error en fetchAndDisplayNews:', error);
        
        // Intentar usar caché antigua
        const oldCache = localStorage.getItem(CACHE_KEY);
        if (oldCache) {
            try {
                console.log('♻️ Usando caché antigua como respaldo');
                const cacheItem = JSON.parse(oldCache);
                displayNews(cacheItem.data);
                return;
            } catch (e) {
                console.error('Error al parsear caché antigua:', e);
            }
        }
        
        // Último recurso: noticias locales
        console.log('📰 Usando noticias locales como fallback');
        displayNews(fallbackNews);
    }
}

function displayNews(articles) {
    const blogContainer = document.getElementById('blogContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Ocultar spinner
    if (loadingSpinner) {
        loadingSpinner.classList.remove('active');
    }

    if (!blogContainer) return;

    // Limitar a MAX_ARTICLES
    const articlesToShow = articles.slice(0, MAX_ARTICLES);

    // Generar HTML
    blogContainer.innerHTML = articlesToShow.map((article, index) => {
        const source = article.source_name || article.source_id || 'Fuente Desconocida';
        const date = formatDate(article.pubDate);
        const title = article.title || 'Sin título';
        const description = truncateText(article.description || 'Sin descripción', 150);
        const link = article.link || '#';
        const delay = 0.2 + (index * 0.2);

        return `
            <div class="col-lg-6 col-xl-4 wow fadeInUp" data-wow-delay="${delay}s">
                <div class="blog-item">
                    <div class="blog-content p-4">
                        <div class="blog-comment d-flex justify-content-between mb-3">
                            <div class="small"><span class="fa fa-user text-primary"></span> ${source}</div>
                            <div class="small"><span class="fa fa-calendar text-primary"></span> ${date}</div>
                        </div>
                        <a href="${link}" target="_blank" class="h4 d-inline-block mb-3">${title}</a>
                        <p class="mb-3">${description}</p>
                        <a href="${link}" target="_blank" class="btn p-0">Leer Más <i class="fa fa-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log(`✅ Mostrando ${articlesToShow.length} noticias en el blog`);
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return 'Fecha no disponible';
    }
}

function truncateText(text, maxLength = 150) {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Función para refrescar manualmente (opcional)
function manualRefresh() {
    localStorage.removeItem(CACHE_KEY);
    console.log('🔄 Caché limpiado, refrescando noticias...');
    fetchAndDisplayNews();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando carga de noticias financieras...');
    fetchAndDisplayNews();
});

// Exponer función de refresh al global scope (opcional)
window.refreshFinancialNews = manualRefresh;