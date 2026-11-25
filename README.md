# Grimorio Carmesí — Tienda de Mangas Black Clover

Tienda en rojo y negro para la venta de volúmenes y ediciones coleccionistas de **Black Clover**, con servidor Express, Drizzle ORM, PostgreSQL y autenticación con Google (Firebase Auth).

## Arquitectura

- **Frontend**: React 19 + Vite + Tailwind CSS v4 (paleta obsidiana `#09090B` y carmesí `#DC2626`).
- **Backend**: Express (`server.ts`) con cálculo de totales en el servidor, transacciones atómicas de inventario y verificación de tokens.
- **Base de datos**: PostgreSQL con Drizzle ORM (`src/db/schema.ts`), conectada mediante variables `SQL_*` y método de objeto en `pg.Pool`.

## Despliegue con GitHub + Render + Supabase

1. **Supabase (Base de datos PostgreSQL)**
   - Crea un proyecto en Supabase y abre **Project Settings → Database → Connection Pooling (Transaction / Session mode)**.
   - Copia los datos de conexión individuales:
     - `SQL_HOST`: host del pooler (ej. `aws-0-us-west-2.pooler.supabase.com`)
     - `SQL_PORT`: `6543` (o `5432`)
     - `SQL_DB_NAME`: `postgres`
     - `SQL_USER` / `SQL_ADMIN_USER`: usuario del pooler (ej. `postgres.<project-ref>`)
     - `SQL_PASSWORD` / `SQL_ADMIN_PASSWORD`: contraseña de la base de datos
     - `SQL_SSL`: `true`

2. **GitHub**
   - Sube este repositorio a tu cuenta de GitHub (`git init`, `git add .`, `git commit -m "Initial"`, `git push`).

3. **Render**
   - En Render, selecciona **New + → Blueprint** (usando `render.yaml`) o **Web Service** apuntando a tu repositorio de GitHub.
   - Configura **Build Command**: `npm install && npm run build`
   - Configura **Start Command**: `npm start`
   - Añade las variables de entorno `SQL_HOST`, `SQL_PORT`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`, `SQL_SSL=true` y `NODE_ENV=production`.
   - En el primer arranque o mediante `npm run db:push`, las tablas se crean en Supabase y el catálogo inicial de Black Clover se carga automáticamente al consultar `/api/mangas`.
