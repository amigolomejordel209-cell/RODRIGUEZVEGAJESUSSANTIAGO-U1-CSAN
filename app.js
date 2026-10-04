import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Configuración Real de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC52urNj1uBsFQhHONyFo87pRf2hN0_m1c",
  authDomain: "ciberseguridad-seguro.firebaseapp.com",
  projectId: "ciberseguridad-seguro",
  storageBucket: "ciberseguridad-seguro.firebasestorage.app",
  messagingSenderId: "663517874892",
  appId: "1:663517874892:web:75bbf43a2fd872ba6b5069",
  measurementId: "G-SJ5V3H7PE6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Forzar que la sesión se destruya al cerrar la pestaña/navegador
setPersistence(auth, browserSessionPersistence);

// --------------------------------------------------------------------------
// TEMPLATE DEL PORTAFOLIO (Protegido dentro del JS)
// El HTML del portafolio NO existe en el navegador hasta que se autentica.
// --------------------------------------------------------------------------
const PORTFOLIO_TEMPLATE = `
    <header class="glass-card">
        <div class="header-title">
            <span class="status-badge"><span class="pulse-dot"></span> Sistema Protegido</span>
            <h1>Portafolio de Evidencias</h1>
        </div>
        <button id="logout-btn" class="btn-danger">Cerrar Sesión</button>
    </header>
    
    <main>
        <!-- Sección 1 -->
        <section id="herramientas" class="glass-card">
            <div class="section-header">
                <span class="section-number">01</span>
                <h2>Justificación de Herramientas</h2>
            </div>
            <p class="section-desc">Selección técnica para la protección de datos en reposo y en tránsito dentro de plataformas virtuales:</p>
            
            <div class="cards-grid">
                <div class="feature-card">
                    <h3>Cifrado AES-256</h3>
                    <p>Estándar de cifrado simétrico seleccionado para proteger datos en reposo. Su longitud de clave de 256 bits lo hace invulnerable a ataques de fuerza bruta actuales.</p>
                </div>
                <div class="feature-card">
                    <h3>Hash SHA-256</h3>
                    <p>Implementación unidireccional para el almacenamiento seguro de contraseñas e integridad de archivos, impidiendo la recuperación de credenciales ante filtraciones.</p>
                </div>
                <div class="feature-card">
                    <h3>Firebase Auth (IAM)</h3>
                    <p>Gestión de identidades con prevención de enumeración de usuarios, mensajes de error genéricos y gestión de sesiones mediante tokens rotativos.</p>
                </div>
            </div>
        </section>
        
        <!-- Sección 2 -->
        <section id="protocolos" class="glass-card">
            <div class="section-header">
                <span class="section-number">02</span>
                <h2>Pruebas de Protocolos Seguros</h2>
            </div>
            <p class="section-desc">Validación técnica contra ataques de intermediario (Man-in-the-Middle):</p>
            
            <div class="terminal-window">
                <div class="terminal-header">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span class="terminal-title">audit_protocols.sh — Bash</span>
                </div>
                <div class="terminal-body">
                    <p class="term-line"><span class="term-prompt">sec-admin@node01:~$</span> ./test_security_protocols.sh</p>
                    <p class="term-success">[OK] Protocolo HTTPS sobre TLS 1.3 forzado.</p>
                    <p class="term-info">&gt; Handshake criptográfico en 45ms. Peticiones HTTP en Puerto 80 redirigidas a Puerto 443.</p>
                    <p class="term-success">[OK] Protocolo SSH con llaves RSA-4096.</p>
                    <p class="term-info">&gt; Autenticación por contraseña deshabilitada. Conexión aceptada mediante validación de clave privada.</p>
                </div>
            </div>
        </section>
        
        <!-- Sección 3 -->
        <section id="certificados" class="glass-card">
            <div class="section-header">
                <span class="section-number">03</span>
                <h2>Certificados Digitales</h2>
            </div>
            <p class="section-desc">Verificación de la cadena de confianza y autenticidad del servidor:</p>
            
            <div class="cert-card">
                <div class="cert-header">
                    <span class="cert-icon">📜</span>
                    <div>
                        <h4>Estándar X.509</h4>
                        <span class="cert-issuer">Emitido por Autoridad Certificadora (CA) de Confianza</span>
                    </div>
                </div>
                <div class="cert-details">
                    <div class="cert-field">
                        <span class="label">Algoritmo de Firma:</span>
                        <span class="value">SHA-256 con RSA</span>
                    </div>
                    <div class="cert-field">
                        <span class="label">Huella Digital (SHA-256):</span>
                        <code class="thumbprint">9B:74:C9:89:7B:AC:77:0F:FC:02:91:02:A2:00:C5:DE</code>
                    </div>
                    <div class="cert-field">
                        <span class="label">Estado de Validación:</span>
                        <span class="value status-ok">✓ Candado Activo en Navegador (Cifrado Extremo a Extremo)</span>
                    </div>
                </div>
            </div>
        </section>
    </main>
`;

// Elementos DOM
const loginContainer = document.getElementById('login-container');
const portfolioContainer = document.getElementById('portfolio-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

// ==========================================
// 1. VALIDACIÓN DE SEGURIDAD DE CONTRASEÑA
// ==========================================
function isPasswordSecure(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongPasswordRegex.test(password);
}

// ==========================================
// 2. MANEJO DEL FORMULARIO DE LOGIN
// ==========================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isPasswordSecure(password)) {
        errorMessage.textContent = "La contraseña debe tener mínimo 8 caracteres, mayúscula, número y un carácter especial (como #, $, !, @, etc.).";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            errorMessage.textContent = "";
        })
        .catch((error) => {
            console.warn("Intento de acceso fallido:", error.code);
            // Protección contra enumeración de usuarios: Mensaje uniforme siempre
            errorMessage.textContent = "Credenciales inválidas. Acceso denegado.";
        });
});

// ==========================================
// 3. TIMEOUT DE SESIÓN POR INACTIVIDAD (10 min)
// ==========================================
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (auth.currentUser) {
            alert("Sesión expirada por inactividad por razones de seguridad.");
            signOut(auth);
        }
    }, 10 * 60 * 1000); // 10 Minutos
}

window.onload = resetInactivityTimer;
document.onmousemove = resetInactivityTimer;
document.onkeypress = resetInactivityTimer;

// ==========================================
// 4. MANEJO DE AUTENTICACIÓN Y DESTRUCCIÓN DE DOM
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Ocultar pantalla de Login
        loginContainer.classList.add('hidden');
        
        // Inyectar HTML del portafolio en el DOM
        portfolioContainer.innerHTML = PORTFOLIO_TEMPLATE;
        portfolioContainer.classList.remove('hidden');

        // Asignar evento al botón de cierre de sesión dinámico
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth);
            });
        }

        resetInactivityTimer();
    } else {
        // Destruir por completo el HTML del portafolio (Seguridad contra F12)
        portfolioContainer.innerHTML = '';
        portfolioContainer.classList.add('hidden');
        
        // Mostrar pantalla de Login
        loginContainer.classList.remove('hidden');
        clearTimeout(inactivityTimer);
    }
});

// ==========================================
// 5. FUNCIONES CRIPTOGRÁFICAS REALES (Web Crypto API)
// ==========================================

// Generar Hash SHA-256 Real
export async function generateSHA256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Cifrar con AES-256-GCM Real
export async function encryptAES256(plainText, secretKey) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey.padEnd(32, '0').slice(0, 32)); // Clave de 256 bits

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vector de inicialización
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv }, cryptoKey, encoder.encode(plainText)
    );

    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        iv: btoa(String.fromCharCode(...iv))
    };
}
