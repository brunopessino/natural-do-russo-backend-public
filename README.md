# Natural do Russo — Backend (versão profissional)

Sistema completo: MySQL/MariaDB, login com usuário e senha (bcrypt + sessão),
produtos com categoria/estoque/disponibilidade, upload de imagem em disco,
pedidos com pipeline de status, dashboard com números do dia, pagamento por
Pix e cartão (Mercado Pago) e notificação automática via WhatsApp.

## 1. Banco de dados

Crie um banco MySQL ou MariaDB (a maioria das hospedagens compartilhadas e
o Render/Railway oferecem isso pronto) e rode o arquivo `schema.sql` nele —
pelo phpMyAdmin (aba "Importar") ou por linha de comando:

```
mysql -u SEU_USUARIO -p SEU_BANCO < schema.sql
```

Isso cria as tabelas e já deixa 4 produtos e 3 bairros de exemplo cadastrados
(edite ou remova pelo painel depois).

## 2. Instalar e configurar

```
npm install
cp .env.example .env
```

Preencha o `.env` com os dados do seu banco e as demais variáveis (explicadas
abaixo). **Nunca** suba o arquivo `.env` pro GitHub — ele tem senhas.

## 3. Criar seu usuário do painel

```
npm run criar-admin -- seu_usuario sua_senha_forte
```

Isso grava a senha já protegida com bcrypt no banco — ninguém, nem quem tiver
acesso ao banco de dados, consegue ler sua senha em texto puro.

## 4. Rodar localmente pra testar

```
npm start
```

O backend sobe em `http://localhost:3000`. Teste com `curl http://localhost:3000/api/health`.

## 5. Publicar (Render.com, exemplo)

1. Suba este projeto (sem a pasta `node_modules` e sem o `.env`) num
   repositório do GitHub.
2. No Render: **New > Web Service**, conecte o repositório.
   - Build command: `npm install`
   - Start command: `npm start`
3. Crie o banco MySQL (Render não tem MySQL gerenciado gratuito — opções
   populares: PlanetScale, Railway, ou um MySQL de uma hospedagem
   compartilhada tipo Hostinger/HostGator, que geralmente já vem com
   phpMyAdmin).
4. Em **Environment**, preencha todas as variáveis do `.env.example` com os
   dados reais.
5. Depois de publicado, rode o comando de criar admin apontando pro banco de
   produção (pode ser da sua máquina local, já que o `.env` aponta pro banco
   remoto):
   ```
   npm run criar-admin -- seu_usuario sua_senha_forte
   ```

## 6. Conectar o site e o painel

No arquivo do site (`index.html`) e no painel (`admin.html`), troque a linha:
```js
const API_URL = "";
```
pela URL do backend publicado, ex: `https://natural-do-russo-api.onrender.com`.

## Sobre as imagens

Os uploads ficam em `/uploads/produtos` e `/uploads/loja`, servidos pelo
próprio backend em `SEU_BACKEND/uploads/produtos/arquivo.jpg`. No banco,
só o nome do arquivo é salvo — como deve ser.

**Atenção:** hospedagens com disco efêmero (ex: Render free tier sem disco
persistente configurado) podem apagar essas imagens em um redeploy. Ative um
disco persistente nas configurações do serviço, ou migre os uploads para um
serviço de armazenamento de arquivos (ex: Cloudflare R2, S3) quando o volume
de produtos crescer — posso te ajudar com essa migração depois.

## Notificação automática no WhatsApp (CallMeBot, gratuito)

1. Adicione +34 644 63 82 06 aos seus contatos do WhatsApp.
2. Envie: `I allow callmebot to send me messages`.
3. Você recebe uma API key — é o `CALLMEBOT_API_KEY` do `.env`.

## Segurança

- `MP_ACCESS_TOKEN` e `SESSION_SECRET` são secretos — só existem no backend.
- Use sempre credenciais de **produção** do Mercado Pago pra vender de verdade.
- A sessão do admin dura 8 horas e fica guardada no próprio banco (sobrevive
  a reinícios do servidor).
- Quando quiser adicionar um segundo administrador, rode o comando de criar
  admin de novo com outro usuário.
