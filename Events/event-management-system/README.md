# Event Management System (SPA)

A simple **Single Page Application (SPA)** built with **Vanilla JavaScript + Vite** and a mock REST API using **json-server**.

## Features
- SPA navigation (hash routing, no page reload)
- Dynamic routes (e.g. `#/events/:id`)
- Auth with roles: `admin` and `visitor`
- Protected routes + session persistence (Local Storage)
- Events CRUD (admin)
- Event registration with capacity validation (visitor)
- Fetch API with `try/catch` error handling
- json-server as a simulated database

## Tech
- Vite (frontend dev server)
- json-server (mock API)
- Local Storage (session)

## Setup
Install:
```bash
npm install
Run API:

bash
Copiar código
npm run api
API: http://localhost:3002

Run app:

bash
Copiar código
npm run dev
App: http://localhost:5173

Demo accounts
Admin

Email: admin@ems.com

Password: Admin123!

Visitor

Email: visitor@ems.com

Password: Visitor123!

Main routes
#/login

#/register

#/events

#/events/:id

#/admin/events/new

#/admin/events/:id/edit

#/logout

## Cómo clonar y ejecutar este proyecto desde GitHub

Sigue estos pasos para ejecutar el proyecto exactamente igual a como fue desarrollado.

### 1) Clonar el repositorio

Abre una terminal y ejecuta:

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd event-management-system
2) Instalar dependencias
bash
Copiar código
npm install
3) Iniciar la API simulada (json-server)
bash
Copiar código
npm run api
La API se ejecutará en:

arduino
Copiar código
http://localhost:3002
Puedes verificar que funciona abriendo:

http://localhost:3002/users

http://localhost:3002/events

4) Iniciar el frontend (Vite)
Abre una nueva terminal en la misma carpeta del proyecto y ejecuta:

bash
Copiar código
npm run dev
La aplicación se ejecutará en:

arduino
Copiar código
http://localhost:5173
5) Usar las cuentas de prueba
Administrador

admin@ems.com / Admin123!

Visitante

visitor@ems.com / Visitor123!

Notas importantes
La API debe estar ejecutándose antes de usar la aplicación.

No cambies el puerto (3002), ya que está configurado dentro del código.

Si algo falla, detén ambas terminales (Ctrl + C) y vuelve a iniciar los comandos.