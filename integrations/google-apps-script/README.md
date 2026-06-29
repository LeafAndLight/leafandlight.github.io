# Google Apps Script integration

This folder contains the backend script for the free contact and hiring pipeline:

GitHub Pages -> Google Apps Script Web App -> Google Sheets -> Gmail

## Files

- `Code.gs`: paste this into the Apps Script project attached to the hiring spreadsheet.
- `README.md`: quick reference for the integration.

## Script Properties

Configure these manually in Apps Script:

- `SPREADSHEET_ID`
- `SPREADSHEET_URL`
- `CAREERS_EMAIL` = `leafandlightcareers@gmail.com`
- `GENERAL_EMAIL` = `leafandlightcontac@gmail.com`

No private IDs, tokens or credentials should be committed to this public repository.

## Frontend endpoint

After deploying the Apps Script as a Web App, copy the `/exec` URL and place it in `assets/js/contact-pipeline.js`:

```js
const CONTACT_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

The frontend sends JSON as `text/plain;charset=utf-8` to avoid a CORS preflight from GitHub Pages. It only clears the form after a readable `{ ok: true }` response from the Web App.