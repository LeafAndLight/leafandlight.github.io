# Setup do Hiring Pipeline da Leaf & Light

Este fluxo continua gratuito e seguro para um repositório público:

GitHub Pages -> Google Apps Script Web App -> Google Sheets -> Gmail

Nenhum Google Workspace, Firebase, servidor pago, banco pago, senha, token ou ID privado da planilha fica no frontend.

## 1. Criar a planilha

1. Entre com `leafandlightcareers@gmail.com`.
2. Crie uma planilha chamada `Leaf & Light — Hiring Database`.
3. Copie o Spreadsheet ID da URL da planilha.

## 2. Adicionar o Apps Script

1. Na planilha, abra `Extensions -> Apps Script`.
2. Cole o conteúdo de `integrations/google-apps-script/Code.gs` dentro de `Code.gs`.
3. Abra `Project Settings -> Script Properties`.
4. Adicione:
   - `SPREADSHEET_ID`: o ID da planilha.
   - `SPREADSHEET_URL`: a URL completa da planilha.
   - `CAREERS_EMAIL`: `leafandlightcareers@gmail.com`.
   - `GENERAL_EMAIL`: `leafandlightcontac@gmail.com`.

## 3. Preparar as abas

1. Execute `setupSpreadsheet()` no Apps Script.
2. Autorize as permissões solicitadas.
3. Confirme que a planilha criou as abas:
   - `Candidates`
   - `General Inquiries`

A função pode ser executada novamente com segurança. Ela não apaga dados existentes.

## 4. Publicar como Web App

1. Clique em `Deploy -> New deployment`.
2. Escolha o tipo `Web app`.
3. Em `Execute as`, selecione `Me`.
4. Em `Who has access`, selecione `Anyone`.
5. Publique e autorize.
6. Copie a URL `/exec` do Web App.

## 5. Conectar o frontend

Abra `assets/js/contact-pipeline.js` e substitua:

```js
const CONTACT_ENDPOINT = 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```

pela URL do seu Web App:

```js
const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Depois faça commit e push para atualizar o GitHub Pages.

## 6. Testar Hiring

1. Abra o site no GitHub Pages.
2. Selecione um card em `Services`.
3. Em `Contact`, mude `Type of inquiry` para `Hiring`.
4. Preencha os campos obrigatórios.
5. Envie o formulário.
6. Confirme se uma linha nova apareceu em `Candidates`.
7. Confirme se o e-mail chegou em `leafandlightcareers@gmail.com`.

## 7. Testar contato comum

1. Mude `Type of inquiry` para `Business`, `Partnership` ou `General`.
2. Preencha Name, Email, Subject e Message.
3. Envie o formulário.
4. Confirme se uma linha nova apareceu em `General Inquiries`.
5. Confirme se o e-mail chegou em `leafandlightcontac@gmail.com`.

## Observações e limitações

- O frontend usa `fetch()` com `Content-Type: text/plain;charset=utf-8` para funcionar no GitHub Pages sem servidor pago.
- O formulário só limpa os dados depois que o Apps Script retorna JSON legível com `{ "ok": true }`.
- Upload de arquivo não foi implementado. Resume / CV usa somente URL nesta primeira versão.
- O backend valida de novo, protege contra fórmulas no Google Sheets, usa honeypot, bloqueia envios rápidos e envia notificações por Gmail.
- Se você criar uma nova versão de deploy do Apps Script, atualize a URL em `assets/js/contact-pipeline.js` somente se a URL do Web App mudar.