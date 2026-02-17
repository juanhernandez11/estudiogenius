# Estructura del Proyecto EstudioGenius

## 📁 Estructura de Archivos

```
estudiogenius/
├── components/          # Componentes React
│   ├── Button.tsx      # Botón reutilizable
│   ├── FocusMode.tsx   # Modo Pomodoro
│   ├── Login.tsx       # Pantalla de login
│   ├── Modal.tsx       # Modal reutilizable
│   ├── NavBar.tsx      # Barra de navegación
│   ├── NoteDetail.tsx  # Vista detalle de nota
│   ├── NoteEditor.tsx  # Editor de notas
│   ├── NoteList.tsx    # Lista de notas
│   ├── Notification.tsx # Sistema de notificaciones
│   └── Settings.tsx    # Configuración
│
├── services/           # Servicios externos
│   └── geminiService.ts # Integración con Gemini AI
│
├── img/                # Imágenes
│   └── Gemini_Generated_Image_s5ygros5ygros5yg.png
│
├── App.tsx             # Componente principal
├── firebase.ts         # Configuración Firebase
├── index.tsx           # Punto de entrada
├── types.ts            # Tipos TypeScript
├── vite.config.ts      # Configuración Vite
├── tsconfig.json       # Configuración TypeScript
├── package.json        # Dependencias
├── .env.example        # Template de variables
├── .env.local          # Variables de entorno (no en Git)
├── .gitignore          # Archivos ignorados
└── README.md           # Documentación
```

## 🔑 Archivos Clave

### App.tsx
- Componente principal
- Manejo de estado global
- Autenticación
- Sincronización con Firebase

### firebase.ts
- Configuración de Firebase
- Validación de variables de entorno
- Exporta auth, db, googleProvider

### geminiService.ts
- Integración con Gemini AI
- Funciones: summarizeNote, generateQuiz, explainConcept

### types.ts
- Interfaces TypeScript
- Note, ViewState, Notification, AppSettings

## 🔒 Archivos Sensibles (NO subir a Git)

- `.env.local` - Variables de entorno con API keys
- `node_modules/` - Dependencias
- `dist/` - Build de producción

## 📦 Dependencias Principales

- react: ^19.2.4
- firebase: ^12.9.0
- @google/genai: ^1.38.0
- lucide-react: ^0.563.0
- vite: ^6.2.0
- typescript: ~5.8.2

## 🚀 Comandos

```bash
npm install          # Instalar dependencias
npm run dev          # Desarrollo (puerto 3000)
npm run build        # Build producción
npm run preview      # Preview build
```

## 🔐 Variables de Entorno Requeridas

```
VITE_GEMINI_API_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 📊 Flujo de Datos

1. Usuario se autentica con Google (Login.tsx)
2. App.tsx carga notas desde Firestore
3. Usuario crea/edita notas (NoteEditor.tsx)
4. Notas se guardan en Firestore automáticamente
5. Usuario puede generar resúmenes/quizzes con Gemini AI
6. Notificaciones de repaso programadas

## 🎨 Estilos

- Tailwind CSS via CDN (index.html)
- Modo oscuro con clase 'dark'
- Diseño mobile-first (max-w-md)
