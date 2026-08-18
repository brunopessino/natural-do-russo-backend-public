// Cria (ou atualiza a senha de) um usuário administrador.
// Uso: node scripts/criar-admin.js usuario senha
//
// Exemplo: node scripts/criar-admin.js dono "minhasenha123"

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const [, , usuario, senha] = process.argv;
  if (!usuario || !senha) {
    console.log('Uso: node scripts/criar-admin.js <usuario> <senha>');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.log('Use uma senha com pelo menos 8 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 12);
  await pool.query(
    'INSERT INTO admins (usuario, senha_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE senha_hash = VALUES(senha_hash)',
    [usuario, hash]
  );
  console.log(`Usuário "${usuario}" pronto para uso no painel.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
