# ChatLocal

Chat en tiempo real con salas, emojis, imágenes, audio, voz y más. **Funciona 100% en GitHub Pages** — sin servidor, impulsado por **Firebase**.

## ✨ Características

- 🔥 **Tiempo real** con Firestore (sin servidor Node.js)
- 🔐 **Login con Google** (como Discord)
- 💬 **Mensajes de texto** con formato y emojis
- 📎 **Subida de imágenes y archivos** (Firebase Storage)
- 🎤 **Mensajes de audio** grabados desde el navegador
- 📞 **Llamadas de voz** (WebRTC)
- ✏️ **Editar y eliminar mensajes** propios
- 😊 **Reacciones con emojis**
- 🚪 **Salas fijas y personalizadas**
- 👥 **Participantes en vivo**
- 🌙 **Modo oscuro / claro**
- 🔔 **Notificaciones de sonido**

## 🛠️ Tecnologías

- **Frontend:** HTML, CSS, JavaScript vanilla
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Voz:** WebRTC
- **Hosting:** GitHub Pages (estático)

## 🚀 Cómo usar

### Opción 1 — GitHub Pages (recomendado)
Solo visita: `https://joaquinsanhueza.github.io/chatLocal/`

### Opción 2 — Local
```bash
# Clonar
git clone https://github.com/joaquinsanhueza/chatLocal.git
cd chatLocal

# Abrir en navegador
start index.html
# O simplemente arrastra index.html al navegador
```

## 🔧 Configuración de Firebase

El proyecto ya está configurado con Firebase. Si quieres usar tu propio proyecto:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un proyecto o usa uno existente
3. Habilita:
   - **Authentication** → Sign-in method → Google
   - **Firestore Database** → Crear base de datos (reglas de prueba)
   - **Storage** → Configurar (reglas de prueba)
4. Copia la configuración Web y pégala en `public/firebase-config.js`

## 📁 Estructura del proyecto

```
chatLocal/
├── public/
│   ├── app.js              # App principal (Firebase)
│   ├── firebase-config.js  # Configuración de Firebase
│   ├── style.css           # Estilos CSS
│   └── notification.mp3    # Sonido de notificación
├── index.html              # Página principal
├── style.css               # CSS (GitHub Pages)
├── README.md
└── LICENSE
```

## 📄 Licencia

MIT