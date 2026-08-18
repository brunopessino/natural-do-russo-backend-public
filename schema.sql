-- Schema do Natural do Russo — MySQL / MariaDB
-- Rode este arquivo uma vez no banco de dados antes de subir o backend.

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  ordem INT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  categoria_id INT NULL,
  imagem VARCHAR(255),
  disponivel TINYINT(1) DEFAULT 1,
  estoque INT NULL,
  ordem INT DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS frete_bairros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bairro VARCHAR(100) NOT NULL UNIQUE,
  valor DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS configuracoes (
  id INT PRIMARY KEY DEFAULT 1,
  nome_loja VARCHAR(120) DEFAULT 'Natural do Russo',
  logo VARCHAR(255),
  whatsapp VARCHAR(20) DEFAULT '',
  endereco VARCHAR(255) DEFAULT 'Rio de Janeiro, RJ',
  pix_key VARCHAR(140) DEFAULT '',
  pix_name VARCHAR(25) DEFAULT 'Natural do Russo',
  pix_city VARCHAR(15) DEFAULT 'Rio de Janeiro',
  frete_padrao DECIMAL(10,2) DEFAULT 12.00,
  mp_enabled TINYINT(1) DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
  id VARCHAR(40) PRIMARY KEY,
  cliente_nome VARCHAR(120),
  cliente_telefone VARCHAR(30),
  endereco VARCHAR(255),
  bairro VARCHAR(100),
  subtotal DECIMAL(10,2),
  frete DECIMAL(10,2),
  total DECIMAL(10,2),
  forma_pagamento ENUM('pix','cartao','whatsapp') DEFAULT 'whatsapp',
  payment_id VARCHAR(60),
  status ENUM('aguardando_pagamento','pago','em_preparo','pronto','saiu_para_entrega','entregue','cancelado') DEFAULT 'aguardando_pagamento',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id VARCHAR(40) NOT NULL,
  produto_id INT,
  nome VARCHAR(120),
  preco DECIMAL(10,2),
  quantidade INT,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dados iniciais
INSERT IGNORE INTO configuracoes (id) VALUES (1);

INSERT IGNORE INTO categorias (id, nome, ordem) VALUES
  (1, 'Sanduíches', 1),
  (2, 'Sucos e vitaminas', 2);

INSERT IGNORE INTO produtos (id, nome, descricao, preco, categoria_id, disponivel, ordem) VALUES
  (1, 'Natural de frango', 'Frango desfiado, mix de folhas e molho da casa no pão integral.', 22.00, 1, 1, 1),
  (2, 'Natural de atum', 'Atum, maçã verde e cenoura ralada — leve e crocante.', 20.00, 1, 1, 2),
  (3, 'Suco detox', 'Couve, limão, gengibre e maçã, espremido na hora.', 14.00, 2, 1, 3),
  (4, 'Vitamina de banana', 'Banana, aveia e mel — clássica e sem enrolação.', 15.00, 2, 1, 4);

INSERT IGNORE INTO frete_bairros (bairro, valor) VALUES
  ('Copacabana', 8.00), ('Botafogo', 6.00), ('Tijuca', 10.00);
