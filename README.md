# Tushkuna App 🍽️📱

Tushkuna App es una aplicación móvil desarrollada como proyecto del curso **Desarrollo de Aplicaciones Móviles 2**.

El objetivo de la aplicación es apoyar la gestión operativa de un restaurante, permitiendo a los mozos registrar pedidos, visualizar el menú y gestionar información básica desde un dispositivo móvil.

El proyecto está desarrollado utilizando **React Native con Expo** e integra **Firebase** para autenticación de usuarios y gestión de datos en tiempo real.

---

## Integrantes

- Liz Vergara
- Santiago Trebejo

Curso: **Desarrollo de Aplicaciones Móviles 2**  
Institución: **IDAT**

---

## Tecnologías utilizadas

- React Native
- Expo
- TypeScript
- Expo Router (navegación)
- Firebase Authentication
- Firebase Firestore
- AsyncStorage

---

## Dependencias principales

Las principales dependencias instaladas en el proyecto son:

```
firebase
expo-router
@react-native-async-storage/async-storage
react-native-safe-area-context
expo-status-bar
```

Para instalar todas las dependencias del proyecto:

```bash
npm install
```

---

## Ejecutar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar el servidor de desarrollo

```bash
npx expo start
```

### 3. Ejecutar la aplicación desde

- Expo Go (escaneando el QR)
- Emulador Android
- Simulador iOS
- Web (modo desarrollo)

---

## Estructura del proyecto

```
app/
 ├── (auth)
 │    ├── login.tsx
 │    └── register.tsx
 │
 ├── (tabs)
 │    ├── index.tsx
 │    ├── mozo/
 │    │   ├── index.tsx
 │    │   ├── pedido/
 │    │   │    └── [mesa].tsx
 │    │   └── ver/
 │    │        └── [mesa].tsx
 │    └── _layout.tsx
 │
config/
 └── firebaseConfig.ts

data/
 └── menu.json
```

---

## Funcionalidades implementadas

- Autenticación de usuarios mediante Firebase
- Visualización del menú de productos
- Registro de pedidos por mesa
- Consulta de pedidos registrados
- Navegación entre pantallas mediante Expo Router
- Sincronización de datos con Firebase

---

## Objetivo académico

El proyecto busca aplicar los conocimientos del curso **Desarrollo de Aplicaciones Móviles 2**, tales como:

- Desarrollo de interfaces móviles con React Native
- Implementación de navegación entre pantallas
- Integración con Firebase para autenticación y base de datos
- Gestión de datos en tiempo real en aplicaciones móviles

---

## Autoría

Proyecto desarrollado con fines educativos.
