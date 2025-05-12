const sqlite3 = require('sqlite3').verbose();

// Cria ou conecta ao banco de dados
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Cria a tabela de usuários se ela não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);
});


module.exports = db;
