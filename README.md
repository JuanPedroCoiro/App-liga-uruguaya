# ⚽ Fútbol Uruguayo App

Aplicación full stack para consultar información sobre el fútbol uruguayo. Permite explorar equipos, partidos, jugadores y estadísticas de las ligas locales.

---

## 🛠️ Tecnologías

**Backend**
- [Python](https://www.python.org/) + [FastAPI](https://fastapi.tiangolo.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [SQLAlchemy](https://www.sqlalchemy.org/) (ORM)

**Frontend**
- [React](https://react.dev/) + [Next.js](https://nextjs.org/)

---

## 📁 Estructura del proyecto

```
futbol-uruguayo/
├── backend/
│   ├── main.py
│   ├── models/
│   ├── routes/
│   └── database.py
├── frontend/
│   ├── pages/
│   ├── components/
│   └── public/
└── README.md
```

---

## 🚀 Instalación y uso

### Prerrequisitos

- Python 3.10+
- Node.js 18+
- PostgreSQL

---

### Backend

```bash
# Clonar el repositorio
git clone https://github.com/JuanPedroCoiro/futbol-uruguayo.git
cd futbol-uruguayo/backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editá .env con tus credenciales de PostgreSQL

# Iniciar el servidor
uvicorn main:app --reload
```

La API estará disponible en `http://localhost:8000`.  
Documentación interactiva en `http://localhost:8000/docs`.

---

### Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

### Base de datos

```bash
# Crear la base de datos en PostgreSQL
createdb futbol_uruguayo

# Correr las migraciones (si usás Alembic)
alembic upgrade head
```

---

## 🔑 Variables de entorno

Creá un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/futbol_uruguayo
SECRET_KEY=tu_clave_secreta
```

---

## 📬 Contacto

Desarrollado por [@JuanPedroCoiro](https://github.com/JuanPedroCoiro).
