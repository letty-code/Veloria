-- Run this script as a PostgreSQL superuser (for example, postgres).
-- It creates the database used by Veloria.
-- If the database already exists, do not run CREATE DATABASE again.

CREATE DATABASE veloria
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    TEMPLATE = template0;
