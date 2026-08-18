# Natural do Russo — Backend

Backend da aplicação de pedidos da Natural do Russo, desenvolvido em Node.js com Express e MySQL/MariaDB.

O projeto fornece a API para:

- catálogo de produtos e categorias;
- autenticação do painel administrativo;
- gerenciamento de produtos, categorias, frete e configurações da loja;
- pedidos e acompanhamento de status;
- integração de pagamentos com Mercado Pago;
- webhook para confirmação de pagamentos;
- configuração de PIX;
- upload de imagens de produtos e da loja;
- notificações automáticas ao proprietário via WhatsApp/CallMeBot;
- resumo de pedidos e faturamento para o dashboard administrativo.

## Tecnologias

- Node.js 18+
- Express
- MySQL / MariaDB
- mysql2
- bcryptjs
- JSON Web Token (JWT)
- Multer
- dotenv
- Mercado Pago
- CallMeBot

## Banco de dados

Crie um banco MySQL ou MariaDB e execute o arquivo `schema.sql`:

```bash
mysql -u SEU_USUARIO -p SEU_BANCO < schema.sql
```

O schema cria as tabelas de administradores, categorias, produtos, frete, configurações, pedidos e itens dos pedidos, além de alguns dados iniciais de exemplo.

## Instalação

```bash
npm install
```

Crie o `.env` a partir do `.env.example` e preencha os valores reais.

No Windows/PowerShell, você também pode copiar `.env.example` para `.env` pelo próprio Explorer ou pelo terminal.

**Nunca publique o `.env` no GitHub.**

## Variáveis de ambiente

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

PUBLIC_URL=https://sua-api.onrender.com
SITE_URL=https://seusite.com

MP_ACCESS_TOKEN=

OWNER_WHATSAPP=5521999999999
CALLMEBOT_API_KEY=

NODE_ENV=production
```

- `DB_*`: credenciais de conexão com o MySQL/MariaDB.
- `JWT_SECRET`: segredo usado para assinar os tokens JWT do painel.
- `PUBLIC_URL`: URL pública da API.
- `SITE_URL`: URL do site utilizada nos retornos do Mercado Pago.
- `MP_ACCESS_TOKEN`: credencial privada do Mercado Pago, usada somente pelo backend.
- `OWNER_WHATSAPP` e `CALLMEBOT_API_KEY`: configuração opcional para notificações ao proprietário.

## Criar o administrador

```bash
npm run criar-admin -- seu_usuario sua_senha_forte
```

A senha é armazenada usando bcrypt e não em texto puro.

O script também pode atualizar a senha de um administrador existente.

## Executar localmente

```bash
npm start
```

Por padrão, o backend utiliza a porta `3000`.

Teste:

```text
GET /api/health
```

Resposta esperada:

```json
{
  "ok": true
}
```

## Autenticação

O login administrativo é realizado através de:

```text
POST /api/auth/login
```

Após o login, o frontend utiliza:

```http
Authorization: Bearer SEU_TOKEN
```

As rotas administrativas utilizam JWT e o token possui validade de 8 horas.

O sistema utiliza JWT; não existe uma sessão administrativa armazenada no banco de dados.

## Produtos e imagens

Os produtos possuem suporte a:

- nome;
- descrição;
- preço;
- categoria;
- imagem;
- disponibilidade;
- estoque;
- ordem de exibição.

O upload de imagens de produtos utiliza:

```text
uploads/produtos/
```

O diretório é criado automaticamente pelo backend.

Formatos aceitos:

- JPEG;
- JPG;
- PNG;
- WebP.

Limite de imagem de produto: 5 MB.

As imagens/logo da loja utilizam:

```text
uploads/loja/
```

Limite da logo: 3 MB.

Os diretórios `uploads` não precisam existir no repositório, pois são criados em runtime.

Em hospedagens com armazenamento efêmero, os arquivos enviados podem ser perdidos após determinados redeploys ou reinicializações. Para produção, recomenda-se armazenamento persistente ou um serviço de objetos como S3/R2.

## PIX

O backend possui suporte à configuração dos dados de PIX da loja.

O administrador pode configurar:

- chave PIX;
- nome do recebedor;
- cidade do recebedor.

Esses dados são armazenados na tabela `configuracoes` e disponibilizados pela API.

A apresentação do PIX e a geração/apresentação do QR Code PIX são responsabilidades do frontend. O backend apresentado neste repositório não possui uma biblioteca ou endpoint próprio para geração do QR Code PIX.

## WhatsApp

O frontend pode oferecer ao cliente a opção de enviar o pedido diretamente para o WhatsApp da loja.

Essa interação é responsabilidade do frontend.

Separadamente, o backend possui integração opcional com CallMeBot para notificar o proprietário quando um pedido é confirmado como pago.

## Mercado Pago

O backend possui integração com o Mercado Pago.

O fluxo é:

```text
Cliente
   ↓
Site
   ↓
Backend
   ↓
Mercado Pago
   ↓
Pagamento
   ↓
Webhook
   ↓
Consulta do pagamento
   ↓
Atualização do pedido
```

A preferência é criada através de:

```text
POST /api/payments/create-preference
```

O webhook é:

```text
POST /api/payments/webhook
```

O backend consulta o pagamento no Mercado Pago e atualiza o status do pedido.

Os principais status tratados são:

- `aguardando_pagamento`
- `pago`
- `cancelado`

Pagamentos pendentes ou em processamento permanecem como `aguardando_pagamento`.

## Pedidos

Os pedidos armazenam dados do cliente, endereço, itens, valores, forma de pagamento, status e identificador do pagamento quando aplicável.

Os status disponíveis são:

```text
aguardando_pagamento
pago
em_preparo
pronto
saiu_para_entrega
entregue
cancelado
```

O painel administrativo pode acompanhar e atualizar os pedidos.

## Preços, frete e estoque

O banco de dados possui os preços oficiais dos produtos e os valores de frete por bairro.

Para uma operação de produção segura, o backend deve ser a fonte de verdade para:

- preço;
- quantidade;
- disponibilidade;
- estoque;
- frete;
- subtotal;
- total.

O frontend não deve ser considerado uma fonte confiável para valores financeiros.

O fluxo recomendado é:

```text
Produto + quantidade enviados pelo cliente
                 ↓
        Backend consulta o banco
                 ↓
       Valida produto/disponibilidade
                 ↓
          Obtém preço oficial
                 ↓
          Calcula o subtotal
                 ↓
        Calcula o frete oficial
                 ↓
          Calcula o total
                 ↓
         Registra o pedido
                 ↓
      Cria o pagamento usando
       os valores confiáveis
```

Essa validação é especialmente importante antes de utilizar os valores para criar uma preferência no Mercado Pago.

## CORS

A API utiliza CORS para permitir a comunicação entre frontend e backend.

Para produção, recomenda-se restringir as origens autorizadas aos domínios oficiais do site e do painel administrativo, em vez de permitir qualquer origem.

## Dashboard

O backend fornece um resumo para o painel administrativo com:

- pedidos do dia;
- faturamento do dia;
- pedidos aguardando pagamento;
- pedidos em preparo;
- pedidos entregues no dia.

## Publicação

O backend pode ser hospedado em serviços compatíveis com Node.js.

Exemplo:

```text
Build command:
npm install

Start command:
npm start
```

Configure as variáveis de ambiente diretamente na plataforma de hospedagem.

Não publique:

```text
.env
node_modules/
uploads/
```

O banco de produção deve ser configurado separadamente e o `schema.sql` executado nele antes da utilização da aplicação.

## Conexão com o site e o painel

O frontend deve apontar para a URL pública da API, por exemplo:

```js
const API_URL = "https://sua-api.onrender.com";
```

O site e o painel administrativo podem ser hospedados separadamente do backend.

## Segurança

Este repositório não deve conter:

- senhas;
- tokens do Mercado Pago;
- `JWT_SECRET` real;
- chaves do CallMeBot;
- credenciais do banco;
- arquivo `.env`;
- dados privados de produção.

Recomendações para produção:

- utilizar HTTPS;
- utilizar um `JWT_SECRET` forte e aleatório;
- restringir o CORS aos domínios conhecidos;
- nunca expor `MP_ACCESS_TOKEN` no frontend;
- validar preços e totais no backend;
- validar disponibilidade e estoque no backend;
- utilizar armazenamento persistente para imagens;
- manter credenciais somente nas variáveis de ambiente.

## API principal

### Público

```text
GET  /api/health
GET  /api/produtos
GET  /api/categorias
GET  /api/frete
GET  /api/config
POST /api/pedidos
GET  /api/pedidos/:id/status
POST /api/payments/create-preference
POST /api/payments/webhook
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Administrativo

As operações administrativas exigem:

```http
Authorization: Bearer SEU_TOKEN
```

Incluem gerenciamento de:

```text
Produtos
Categorias
Frete
Configurações
Pedidos
Relatórios
```

## Status do projeto

Este repositório contém a API/backend do Natural do Russo.

O frontend do site e o painel administrativo podem ser mantidos em repositórios separados.

O backend é responsável pela persistência dos dados, autenticação administrativa, API de produtos e pedidos, configuração da loja, integração de pagamentos, webhook e notificações descritas neste documento.
