# EstudioGenius — Descripción para el Concurso

---

## 1. NOMBRE DEL PROYECTO
**EstudioGenius** — Asistente de Estudio con Inteligencia Artificial

---

## 2. DESCRIPCIÓN GENERAL (para formulario — máx. 300 palabras)

EstudioGenius es una aplicación web progresiva (PWA) que integra Inteligencia Artificial para transformar la manera en que los estudiantes mexicanos organizan y repasan sus apuntes. La app permite crear notas de estudio y, con un solo toque, generar resúmenes automáticos, quizzes de opción múltiple y explicaciones de conceptos difíciles usando modelos de lenguaje de última generación.

El proyecto nació de una problemática real: los estudiantes acumulan apuntes desorganizados y no cuentan con herramientas accesibles para estudiar de forma eficiente. EstudioGenius resuelve esto combinando tres pilares: organización inteligente, IA generativa y ciencia cognitiva (repaso espaciado basado en la Curva del Olvido de Ebbinghaus).

La aplicación es completamente gratuita, funciona desde cualquier navegador sin necesidad de instalación, está desarrollada en español y sincroniza los datos en la nube para que el estudiante acceda desde cualquier dispositivo. Incluye además un modo de concentración Pomodoro y un sistema de recordatorios de repaso programados.

Fue desarrollada con tecnologías modernas: React 19, TypeScript, Firebase y modelos de IA de código abierto (LLaMA 3.1), lo que garantiza su sostenibilidad y escalabilidad sin costos prohibitivos.

---

## 3. CRITERIOS DE EVALUACIÓN

### ✅ Desarrollo e implementación de soluciones innovadoras (0–40 pts)

**Qué se desarrolló:**
- Aplicación web progresiva (PWA) funcional y desplegable
- Sistema de autenticación con Google (Firebase Auth)
- Base de datos en la nube con sincronización en tiempo real (Firestore)
- Integración con IA generativa (LLaMA 3.1 vía Groq API) para:
  - Generación de resúmenes de apuntes
  - Creación automática de quizzes de opción múltiple con retroalimentación
  - Explicación contextual de conceptos
- Sistema de repaso espaciado con algoritmo de intervalos crecientes (1, 3, 7, 14, 30 días)
- Modo Pomodoro con temporizador y notificaciones
- Notificaciones push para recordatorios de repaso
- Exportación e importación de notas en formato JSON
- Modo oscuro y diseño responsive mobile-first

**Evidencia de funcionamiento:**
La aplicación está completamente operativa. Puede demostrarse en vivo durante la evaluación desde cualquier dispositivo con navegador web.

---

### ✅ Impacto y aplicabilidad de la innovación (0–25 pts)

**Sector impactado:** Educación

**Problema específico que resuelve:**
1. El 70% del contenido aprendido se olvida en 24 horas sin repaso (Curva del Olvido — Hermann Ebbinghaus, 1885). EstudioGenius combate esto con recordatorios científicamente programados.
2. Las herramientas de IA educativa existentes (Notion AI, Quizlet, etc.) son costosas o están en inglés, excluyendo a estudiantes de comunidades con menos recursos económicos.
3. Los estudiantes no tienen tiempo para crear resúmenes y materiales de estudio manualmente.

**Beneficios medibles:**
- Reducción del tiempo de preparación para exámenes
- Mejora en la retención de información a largo plazo
- Acceso gratuito a herramientas de IA educativa para estudiantes de todos los niveles socioeconómicos
- Disponible en español, diseñado para el contexto educativo mexicano

**Ámbito de aplicación:**
Estudiantes de secundaria, preparatoria y universidad en cualquier materia.

---

### ✅ Originalidad y aportación tecnológica (0–20 pts)

**Diferenciadores respecto a soluciones existentes:**

| Característica | EstudioGenius | Apps similares |
|---|---|---|
| Idioma | Español nativo | Principalmente inglés |
| Costo | 100% gratuito | Freemium o de pago |
| Repaso espaciado + IA | ✅ Integrado | Separados en distintas apps |
| Sin instalación (PWA) | ✅ | Requieren descarga |
| Datos en la nube | ✅ Firebase | Varía |
| Modo Pomodoro integrado | ✅ | Raramente integrado |

**Aportación tecnológica:**
- Integración de modelos de lenguaje de código abierto (LLaMA 3.1) en una app educativa en español
- Arquitectura serverless que elimina costos de infraestructura
- Algoritmo de repaso espaciado implementado desde cero con intervalos adaptativos

---

### ✅ Potencial de crecimiento y replicabilidad (0–15 pts)

**Escalabilidad técnica:**
- Firebase Firestore escala automáticamente a millones de usuarios sin cambios en el código
- La arquitectura PWA permite distribución sin tiendas de aplicaciones
- El modelo de IA puede cambiarse o actualizarse sin afectar la experiencia del usuario

**Replicabilidad:**
- El proyecto puede adaptarse a otros idiomas con cambios mínimos
- Puede integrarse con plataformas educativas existentes (Google Classroom, Moodle)
- El modelo es replicable en otros estados o países hispanohablantes
- Puede expandirse a modalidades como educación especial, adultos mayores o educación comunitaria

**Sostenibilidad:**
- Usa APIs gratuitas con planes generosos (Groq, Firebase free tier)
- Código abierto y mantenible por un equipo pequeño
- Sin dependencia de infraestructura costosa

---

## 4. STACK TECNOLÓGICO

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | Frontend de la aplicación |
| Vite | Herramienta de construcción |
| Firebase Auth | Autenticación de usuarios |
| Firebase Firestore | Base de datos en la nube |
| Groq API (LLaMA 3.1) | Motor de Inteligencia Artificial |
| Tailwind CSS | Diseño y estilos |
| PWA (Vite PWA Plugin) | Instalación sin tienda de apps |
| Lucide React | Iconografía |

---

## 5. DATOS DEL DESARROLLADOR

- **Nombre:** JuanBv
- **Estado:** Puebla, México
- **Año:** 2026
- **Categoría:** Innovación Tecnológica

---

## 6. FRASE PARA PRESENTACIÓN ORAL

> "EstudioGenius democratiza el acceso a la inteligencia artificial educativa para estudiantes mexicanos. No es solo una app de notas — es un compañero de estudio inteligente que aprende contigo, te recuerda lo que estás a punto de olvidar y te prepara para tus exámenes de forma científica y gratuita."

---

*© 2026 EstudioGenius. Todos los derechos reservados.*
