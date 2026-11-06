# EstudioGenius 📚

Tu asistente de estudio con IA powered by Groq.

## 🚀 Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

Configura `GROQ_API_KEY` con una API key de Groq y `GROQ_MODEL` con un modelo habilitado. La clave de Groq no debe llevar el prefijo `VITE_`: se usa únicamente en el servidor. El modelo predeterminado es `openai/gpt-oss-20b`. La función también usa `VITE_FIREBASE_API_KEY` y `VITE_FIREBASE_PROJECT_ID` para validar la sesión, así que no hace falta duplicarlas con otros nombres.

En Netlify, agrega `GROQ_API_KEY` y `GROQ_MODEL` en **Site configuration > Environment variables**. Asegúrate de que `GROQ_API_KEY` esté disponible para Functions/Runtime y vuelve a desplegar tras modificar variables.

### 3. Configurar credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Ve a Project Settings > General > Your apps
4. Copia las credenciales de la Web App a las variables `VITE_FIREBASE_*` de `.env.local`

### 4. Configurar reglas de seguridad en Firestore

En Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

Vite emula localmente la función `/api/groq`. Usa `.env.local` para las variables locales; la API key privada nunca se incluye en el JavaScript del navegador.

Los recordatorios del navegador se activan desde Ajustes y se muestran mientras la aplicación está abierta. La aplicación web todavía no envía notificaciones push cuando está cerrada.

## 🔒 Seguridad

- ⚠️ No subas `.env.local` ni compartas API keys.
- ✅ Las solicitudes a Groq pasan por una función que valida el token de Firebase; `GROQ_API_KEY` se mantiene en el servidor.
- ✅ Las opiniones y notas importadas se guardan bajo la cuenta autenticada del usuario en Firestore.
- ✅ `.env.local` está en `.gitignore`; `.env.example` contiene solo valores de ejemplo.
- Si una clave Groq real estuvo en `VITE_GROQ_API_KEY`, revócala y crea una nueva: cualquier visitante podría extraerla del JavaScript publicado.

## 📦 Scripts disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Preview de la build de producción

## 🛠️ Stack Tecnológico

- React 19 + TypeScript
- Vite
- Firebase (Auth + Firestore)
- Groq API
- Tailwind CSS (via CDN)
- Lucide React (iconos)

## ✨ Funcionalidades

- 📝 Crear y editar notas de estudio
- 🤖 Generar resúmenes con IA
- 📊 Crear quizzes automáticos
- 🧭 Ruta diaria adaptada a repasos pendientes y temas por reforzar
- 🚦 Nivel de dominio basado en respuestas registradas
- 📝 Simulacros de examen cronometrados con resultados por tema
- 💡 Explicaciones con analogías, ejemplos, pasos o preguntas guía
- 🔔 Recordatorios de repaso activables desde Ajustes
- 🎯 Modo enfocado con Pomodoro
- 🔥 Racha flexible de estudio
- 🧭 Ruta de estudio diaria personalizada con tus apuntes
- 🚦 Semáforo de dominio por tema y seguimiento de racha flexible
- 📝 Simulacro de examen cronometrado con análisis de resultados
- 💡 Explicaciones con analogías, ejemplos, pasos o preguntas guía
- 🌙 Modo oscuro
- 💾 Sincronización en la nube
- 📤 Exportar/Importar notas

## 📄 Licencia

© 2026 EstudioGenius. Todos los derechos reservados.
Desarrollado por JuanBv.
