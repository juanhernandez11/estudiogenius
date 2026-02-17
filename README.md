# EstudioGenius 📚

Tu asistente de estudio con IA powered by Gemini.

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

Luego edita `.env.local` con tus credenciales:

#### Obtener API Key de Gemini:
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia y pega en `VITE_GEMINI_API_KEY`

#### Obtener credenciales de Firebase:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a Project Settings > General
4. En "Your apps", crea una Web App
5. Copia las credenciales y pégalas en `.env.local`

### 3. Configurar reglas de seguridad en Firestore

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

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

## 🔒 Seguridad

- ⚠️ **NUNCA** subas el archivo `.env.local` a Git
- ⚠️ **NUNCA** compartas tus API keys públicamente
- ✅ El archivo `.env.local` ya está en `.gitignore`
- ✅ Usa `.env.example` como referencia para otros desarrolladores

## 📦 Scripts disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Preview de la build de producción

## 🛠️ Stack Tecnológico

- React 19 + TypeScript
- Vite
- Firebase (Auth + Firestore)
- Google Gemini AI
- Tailwind CSS (via CDN)
- Lucide React (iconos)

## ✨ Funcionalidades

- 📝 Crear y editar notas de estudio
- 🤖 Generar resúmenes con IA
- 📊 Crear quizzes automáticos
- 🔔 Recordatorios de repaso
- 🎯 Modo enfocado con Pomodoro
- 🌙 Modo oscuro
- 💾 Sincronización en la nube
- 📤 Exportar/Importar notas

## 📄 Licencia

© 2026 EstudioGenius. Todos los derechos reservados.
Desarrollado por JuanBv.
