import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ⚠️ REEMPLAZA ESTO CON LA CONFIGURACIÓN DE TU PROYECTO DE FIREBASE
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementos del DOM
const loginContainer = document.getElementById('login-container');
const portfolioContainer = document.getElementById('portfolio-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');

// Escuchar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado: ocultar login, mostrar portafolio
        loginContainer.classList.add('hidden');
        portfolioContainer.classList.remove('hidden');
    } else {
        // Sin sesión: mostrar login, ocultar portafolio
        loginContainer.classList.remove('hidden');
        portfolioContainer.classList.add('hidden');
    }
});

// Evento de Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            // Práctica de seguridad: Mensaje genérico para evitar enumeración de usuarios
            errorMessage.textContent = "Credenciales incorrectas. Verifique su correo y contraseña.";
            console.error("Error de autenticación:", error.code);
        });
});

// Evento de Cerrar Sesión
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});