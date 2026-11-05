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

Configura `VITE_GROQ_API_KEY` con una API key de Groq y `VITE_GROQ_MODEL` con un modelo disponible en tu cuenta. El valor de ejemplo es `llama-3.3-70b-versatile`; si Groq devuelve `model not found`, revisa los modelos habilitados en tu consola de Groq y actualiza esa variable.

En Netlify, agrega estas variables en **Site configuration > Environment variables** y vuelve a desplegar después de modificarlas.

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

## 🔒 Seguridad

- ⚠️ No subas `.env.local` ni compartas API keys.
- ⚠️ Las variables `VITE_*` se incluyen en el JavaScript del navegador; por lo tanto, una clave `VITE_GROQ_API_KEY` puede ser extraída por cualquier visitante. Para producción, usa una función backend/serverless como proxy y guarda la clave como variable privada sin prefijo `VITE_`.
- ✅ `.env.local` está en `.gitignore`; `.env.example` contiene solo valores de ejemplo.
- Si una clave Groq real ya se publicó en el cliente, rótala desde Groq Console.

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
- 🔔 Recordatorios de repaso
- 🎯 Modo enfocado con Pomodoro
- 🌙 Modo oscuro
- 💾 Sincronización en la nube
- 📤 Exportar/Importar notas

## 📄 Licencia

© 2026 EstudioGenius. Todos los derechos reservados.
Desarrollado por JuanBv.
