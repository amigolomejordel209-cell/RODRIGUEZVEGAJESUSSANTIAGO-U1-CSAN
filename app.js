import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// IMPORTAMOS FIRESTORE (El Middleware del Servidor)
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const db = getFirestore(app); // Inicializamos la base de datos

// Forzar que la sesión se destruya al cerrar la pestaña/navegador
setPersistence(auth, browserSessionPersistence);

// Elementos DOM
const loginContainer = document.getElementById('login-container');
const portfolioContainer = document.getElementById('portfolio-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

// ==========================================
// 0. ANTI-CLICKJACKING (Frame Busting)
// ==========================================
if (window.top !== window.self) {
    window.top.location = window.self.location;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
// ... (resto de tu código app.js igualito)
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
// 4. MANEJO DE AUTENTICACIÓN Y MIDDLEWARE FIRESTORE
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Ocultar pantalla de Login y mostrar estado de carga
        loginContainer.classList.add('hidden');
        portfolioContainer.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="pulse-dot" style="display:inline-block; margin-right:10px;"></span>Descargando datos seguros desde el servidor...</div>';
        portfolioContainer.classList.remove('hidden');

        try {
            // PETICIÓN AL MIDDLEWARE: Solicitar el documento a la base de datos
            const docRef = doc(db, "portafolio", "secreto");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // EL MIDDLEWARE APROBÓ LA LECTURA: Inyectar el HTML
                portfolioContainer.innerHTML = docSnap.data().html;
                
                // Asignar evento al botón de cierre de sesión dinámico
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        signOut(auth);
                    });
                }
                resetInactivityTimer();
            } else {
                portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Error 404: Datos no encontrados en el servidor.</div>';
            }
        } catch (error) {
            // EL MIDDLEWARE RECHAZÓ LA LECTURA
            console.error("Acceso bloqueado por Firebase Security Rules:", error);
            portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Error 403 Forbidden: Acceso denegado por el servidor.</div>';
        }
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
