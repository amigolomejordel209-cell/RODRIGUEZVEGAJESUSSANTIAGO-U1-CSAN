// ==========================================
// 0. ANTI-CLICKJACKING (Frame Busting)
// ==========================================
if (window.top !== window.self) {
    window.top.location = window.self.location;
}

// 1. IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. CONFIGURACIÓN E INICIALIZACIÓN
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
const db = getFirestore(app); 

setPersistence(auth, browserSessionPersistence);

// 3. ELEMENTOS DOM
const loginContainer = document.getElementById('login-container');
const portfolioContainer = document.getElementById('portfolio-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

function isPasswordSecure(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongPasswordRegex.test(password);
}

// 4. MANEJO DE LOGIN
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!isPasswordSecure(password)) {
        errorMessage.textContent = "La contraseña debe tener mínimo 8 caracteres, mayúscula, número y un carácter especial.";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            errorMessage.textContent = "";
        })
        .catch((error) => {
            console.warn("Intento de acceso fallido:", error.code);
            errorMessage.textContent = "Credenciales inválidas. Acceso denegado.";
        });
});

let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (auth.currentUser) {
            alert("Sesión expirada por inactividad por razones de seguridad.");
            signOut(auth);
        }
    }, 10 * 60 * 1000);
}

window.onload = resetInactivityTimer;
document.onmousemove = resetInactivityTimer;
document.onkeypress = resetInactivityTimer;

// 5. FUNCIONES CRIPTOGRÁFICAS
export async function generateSHA256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function encryptAES256(plainText, secretKey) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await window.crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, encoder.encode(plainText));
    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

export async function decryptAES256(ciphertextBase64, ivBase64, secretKey) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyData = encoder.encode(secretKey.padEnd(32, '0').slice(0, 32)); 
    
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw', keyData, { name: 'AES-GCM' }, false, ['decrypt']
    );

    // LIMPIEZA AUTOMÁTICA: Evita el error "InvalidCharacterError" de atob
    const cleanCiphertext = ciphertextBase64.replace(/['"\s]/g, '');
    const cleanIv = ivBase64.replace(/['"\s]/g, '');

    const ciphertext = new Uint8Array(atob(cleanCiphertext).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(cleanIv).split('').map(c => c.charCodeAt(0)));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, cryptoKey, ciphertext
    );

    return decoder.decode(decryptedBuffer);
}

// 6. MIDDLEWARE FIRESTORE & RENDERIZADO
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginContainer.classList.add('hidden');
        portfolioContainer.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="pulse-dot" style="display:inline-block; margin-right:10px;"></span>Descargando y descifrando datos seguros...</div>';
        portfolioContainer.classList.remove('hidden');

        try {
            const docRef = doc(db, "portafolio", "secreto");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const dbData = docSnap.data();
                try {
                    const claveMaestra = "AdminCiber2026#"; 
                    
                    const htmlDescifrado = await decryptAES256(
                        dbData.ciphertext, 
                        dbData.iv,         
                        claveMaestra
                    );

                    portfolioContainer.innerHTML = htmlDescifrado;
                    
                    const logoutBtn = document.getElementById('logout-btn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', () => signOut(auth));
                    }
                    resetInactivityTimer();

                } catch (cryptoError) {
                    console.error("Error de descifrado:", cryptoError);
                    portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Error: La llave criptográfica es incorrecta o los datos están corruptos.</div>';
                }
            } else {
                portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Error 404: Datos no encontrados en el servidor.</div>';
            }
        } catch (error) {
            console.error("Acceso bloqueado por Firebase Security Rules:", error);
            portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Error 403 Forbidden: Acceso denegado por el servidor.</div>';
        }
    } else {
        portfolioContainer.innerHTML = '';
        portfolioContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        clearTimeout(inactivityTimer);
    }
});

// ==========================================
// 7. GENERADOR DE CÓDIGOS (Bórralo cuando termines)
// ==========================================
setTimeout(async () => {
    // HTML de prueba muy sencillo para validar
    const miPortafolioHTML = `<div class="glass-card" style="text-align:center; padding:50px;"><h2>¡Desencriptado con Éxito! 🛡️</h2><p>El Cifrado AES-256 está funcionando a la perfección.</p></div>`;
    
    const resultado = await encryptAES256(miPortafolioHTML, "AdminCiber2026#");
    
    console.warn("⬇️ COPIA ESTE CIPHERTEXT (sin comillas ni espacios):");
    console.log(resultado.ciphertext);
    console.warn("⬇️ COPIA ESTE IV (sin comillas ni espacios):");
    console.log(resultado.iv);
}, 2000);
