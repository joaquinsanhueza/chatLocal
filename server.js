/**
 * ChatLocal — Servidor Express para Railway
 * Sirve los archivos estáticos del frontend Firebase
 */
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname), {
  // Cache 1 hora para assets, no cachear HTML
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.match(/\.(css|js|mp3|png|jpg|webp|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// SPA fallback — cualquier ruta no encontrada vuelve a index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ChatLocal corriendo en http://0.0.0.0:${PORT}`);
});
