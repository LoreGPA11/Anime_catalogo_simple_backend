const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE LA CONEXIÓN (Render la llenará automáticamente)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// TABLA AUTOMÁTICA (Crea la tabla si no existe al iniciar)
pool.query(`
  CREATE TABLE IF NOT EXISTS animes (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    anio_inicio INT,
    anio_termino INT,
    volumenes INT,
    comentarios TEXT
  )
`).catch(err => console.error(err));

// --- RUTAS (Lo que Angular va a llamar) ---

// 1. Obtener lista
app.get('/animes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM animes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

// 2. Guardar nuevo
app.post('/animes', async (req, res) => {
  const { nombre, anioInicio, anioTermino, volumenes, comentarios } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO animes (nombre, anio_inicio, anio_termino, volumenes, comentarios) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, anioInicio, anioTermino, volumenes, comentarios]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send(err.message); }
});

// 3. Eliminar
app.delete('/animes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM animes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Eliminado' });
  } catch (err) { res.status(500).send(err.message); }
});

// 4. Editar
app.put('/animes/:id', async (req, res) => {
  const { nombre, anioInicio, anioTermino, volumenes, comentarios } = req.body;
  try {
    await pool.query(
      'UPDATE animes SET nombre=$1, anio_inicio=$2, anio_termino=$3, volumenes=$4, comentarios=$5 WHERE id=$6',
      [nombre, anioInicio, anioTermino, volumenes, comentarios, req.params.id]
    );
    res.json({ message: 'Actualizado' });
  } catch (err) { res.status(500).send(err.message); }
});

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend corriendo en puerto ${port}`));