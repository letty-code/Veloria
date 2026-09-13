# Veloria PostgreSQL setup

## 1. Install PostgreSQL

Install PostgreSQL locally and make sure the PostgreSQL server is running.

## 2. Create the Veloria database

Open `psql` as the `postgres` user, or use pgAdmin's Query Tool, and run:

```sql
CREATE DATABASE veloria
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    TEMPLATE = template0;
```

The same command is also stored in `create_database.sql`.

If the database already exists, do not run the command again.

## 3. Configure `.env`

Open `Backend/.env` and replace:

`YOUR_POSTGRES_PASSWORD`

with the password of your local PostgreSQL `postgres` user.

Example:

```env
DATABASE_URL=postgresql+psycopg://postgres:MyPassword@localhost:5432/veloria
SESSION_COOKIE_SECURE=false
ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

Do not commit the real `.env` file to Git or share it publicly.

## 4. Install Python dependencies

From the `Backend` directory:

```bash
pip install -r requirements.txt
```

## 5. Start FastAPI

From the `Backend` directory:

```bash
uvicorn main:app --reload
```

On startup, SQLAlchemy creates the tables defined by the current models if they do not already exist, and the application seeds the product catalog.

## 6. Test PostgreSQL

Open:

`http://127.0.0.1:8000/database-test`

Expected response:

```json
{"message":"Successfully connected to PostgreSQL!"}
```

## Important

- The application currently expects the PostgreSQL database to be named `veloria`.
- Do not run `DROP DATABASE`, `DROP TABLE`, or destructive migrations on real data.
- The current project uses SQLAlchemy `create_all()` for initial local table creation. It is not a replacement for migrations in a production environment.
