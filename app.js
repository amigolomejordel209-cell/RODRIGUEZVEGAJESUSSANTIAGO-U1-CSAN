import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ⚠️ REEMPLAZA CON TU CONFIGURACIÓN REAL DE FIREBASE
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

// Forzar que la sesión se destruya al cerrar la pestaña/navegador (Práctica de Seguridad)
setPersistence(auth, browserSessionPersistence);

// Elementos DOM
const loginContainer = document.getElementById('login-container');
const portfolioContainer = document.getElementById('portfolio-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');

// ==========================================
// 1. VALIDACIÓN DE SEGURIDAD DE CONTRASEÑA
// ==========================================

function isPasswordSecure(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongPasswordRegex.test(password);
}

// 2. Manejo del formulario de login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isPasswordSecure(password)) {
        // Texto actualizado que ya incluye el símbolo #
        errorMessage.textContent = "La contraseña debe tener mínimo 8 caracteres, mayúscula, número y un carácter especial (como #, $, !, @, etc.).";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            errorMessage.textContent = "";
        })
        .catch((error) => {
            console.error("Error de Firebase:", error.code, error.message);
            errorMessage.textContent = "Credenciales inválidas. Acceso denegado.";
        });
});
// ==========================================
// 2. TIMEOUT DE SESIÓN POR INACTIVIDAD (10 min)
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
// 3. MANEJO DE AUTENTICACIÓN SECURE
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginContainer.classList.add('hidden');
        portfolioContainer.classList.remove('hidden');
    } else {
        loginContainer.classList.remove('hidden');
        portfolioContainer.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isPasswordSecure(password)) {
        errorMessage.textContent = "La contraseña debe tener mínimo 8 caracteres, mayúscula, número y un carácter especial (@$!%*?&).";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            // Protección contra enumeración de usuarios: Mensaje uniforme siempre
            errorMessage.textContent = "Credenciales inválidas. Acceso denegado.";
            console.warn("Intento de acceso fallido:", error.code);
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// ==========================================
// 4. FUNCIONES CRIPTOGRÁFICAS REALES (Web Crypto API)
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
