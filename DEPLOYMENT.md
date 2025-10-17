# Guida al Deployment

## 🌐 Deploy su Static Hosting

### Netlify

1. Crea un account su [Netlify](https://netlify.com)
2. Drag & drop la cartella del progetto
3. Configurazione automatica!

**netlify.toml:**
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

1. Installa Vercel CLI: `npm i -g vercel`
2. Nella cartella del progetto: `vercel`
3. Segui le istruzioni

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### GitHub Pages

1. Crea repository su GitHub
2. Push del codice
3. Settings → Pages → Source: main branch
4. URL: `https://username.github.io/repo-name/`

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 🔧 Ottimizzazioni Pre-Deploy

### 1. Minifica JavaScript
```bash
npm install -g terser
terser js/*.js -o js/bundle.min.js
```

### 2. Minifica CSS
```bash
npm install -g csso-cli
csso styles.css -o styles.min.css
```

### 3. Combina HTML Components
Usa l'Opzione 2 (integrazione manuale) per ridurre le richieste HTTP.

## 📊 Performance Tips

1. **Cache Headers:** Configura il server per cache statica
2. **CDN:** Usa CDN per Tailwind e librerie esterne
3. **Lazy Loading:** Carica componenti on-demand
4. **Service Worker:** Per funzionalità offline (opzionale)

## 🔐 Sicurezza

1. **CSP Headers:** Configura Content Security Policy
2. **HTTPS:** Usa sempre HTTPS in produzione
3. **Backup:** Implementa export/import dati per backup utente

## ✅ Checklist Pre-Deploy

- [ ] Test su tutti i browser principali
- [ ] Test mobile responsive
- [ ] Verifica funzionalità IndexedDB
- [ ] Test performance con Lighthouse
- [ ] Verifica console errors
- [ ] Test caricamento dati demo
- [ ] Documenta per gli utenti