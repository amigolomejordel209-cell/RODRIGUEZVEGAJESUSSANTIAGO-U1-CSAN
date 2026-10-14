
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


if (window.top !== window.self) {
    window.top.location = window.self.location;
}


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


const loginContainer = document.getElementById('login-container');
const portfolioContainer = document.getElementById('portfolio-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

function isPasswordSecure(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongPasswordRegex.test(password);
}


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
    
    const cleanCiphertext = ciphertextBase64.replace(/['"\s]/g, '');
    const cleanIv = ivBase64.replace(/['"\s]/g, '');

    const ciphertext = new Uint8Array(atob(cleanCiphertext).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(cleanIv).split('').map(c => c.charCodeAt(0)));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, cryptoKey, ciphertext
    );

    return decoder.decode(decryptedBuffer);
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginContainer.classList.add('hidden');
        portfolioContainer.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="pulse-dot" style="display:inline-block; margin-right:10px;"></span>Descargando datos seguros de Google Cloud...</div>';
        portfolioContainer.classList.remove('hidden');

        try {
            const docRef = doc(db, "portafolio", "secreto");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const dbData = docSnap.data();
                
              
                portfolioContainer.innerHTML = `
                    <div class="glass-card" style="text-align:center; padding: 40px; max-width: 500px; margin: 0 auto;">
                        <h2 style="margin-bottom: 15px;">🔐 SISTEMA E2EE PROTEGIDO</h2>
                        <p style="margin-bottom: 20px; color: var(--text-muted);">Los datos han sido descargados pero están cifrados.<br>Ingresa la Llave Maestra Criptográfica para visualizarlos:</p>
                        
                        <input type="password" id="master-key-input" placeholder="••••••••••••" 
                               style="width: 100%; padding: 12px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #444; background: rgba(0,0,0,0.5); color: #fff; font-size: 16px; text-align: center; font-family: monospace;">
                        
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="btn-unlock" class="btn-primary" style="flex: 1;">Desbloquear</button>
                            <button id="btn-cancel" class="btn-danger" style="flex: 1;">Cancelar</button>
                        </div>
                    </div>
                `;

                const inputKey = document.getElementById('master-key-input');
                const btnUnlock = document.getElementById('btn-unlock');
                const btnCancel = document.getElementById('btn-cancel');

                inputKey.focus();

                const procesarLlave = async (claveMaestra) => {
                    if (!claveMaestra) {
                        portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Acceso cancelado: No se proporcionó la llave criptográfica.</div>';
                        signOut(auth);
                        return;
                    }

                    try {
                        portfolioContainer.innerHTML = '<div style="text-align:center; padding: 50px;"><span class="pulse-dot" style="display:inline-block; margin-right:10px;"></span>Descifrando con AES-256...</div>';
                        
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
                        portfolioContainer.innerHTML = '<div class="glass-card" style="text-align:center; padding: 20px; color: var(--accent-red);">Error: La llave criptográfica es incorrecta. Los datos permanecen bloqueados.</div>';
                        signOut(auth); 
                    }
                };

                btnUnlock.addEventListener('click', () => procesarLlave(inputKey.value));
                btnCancel.addEventListener('click', () => procesarLlave(null));
                inputKey.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') procesarLlave(inputKey.value);
                });

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
