# Task Management App v2.8 - Guida all'Integrazione

## 📁 Struttura del Progetto
```
task-management-app/
│
├── index.html                          # File principale
├── styles.css                          # CSS personalizzato
│
├── components/
│   ├── header.html                    # Header dell'app
│   ├── modals/
│   │   ├── details-modal.html         # Modale dettagli/modifica
│   │   ├── project-modal.html         # Modale progetti
│   │   └── config-modal.html          # Modale configurazione
│   └── views/
│       ├── tasks-view.html            # Vista attività
│       ├── summary-view.html          # Vista riepilogo
│       ├── projects-view.html         # Vista progetti
│       └── history-view.html          # Vista storico
│
└── js/
    ├── config.js                      # Configurazione globale
    ├── database.js                    # Gestione IndexedDB
    ├── utils.js                       # Funzioni utility
    ├── tasks.js                       # Gestione task
    ├── subtasks.js                    # Gestione subtask
    ├── projects.js                    # Gestione progetti
    ├── timers.js                      # Gestione timer
    ├── rendering.js                   # Rendering UI
    ├── modals.js                      # Gestione modali
    ├── views.js                       # Gestione views
    ├── app.js                         # Applicazione principale
    └── init.js                        # Inizializzazione
```

## 🔧 Come Integrare i Componenti

### Opzione 1: Caricamento Dinamico con JavaScript (Consigliato)

Crea un file `js/loader.js`:
```javascript
// Component Loader Module
const ComponentLoader = {
  async loadComponent(path, targetId) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      const html = await response.text();
      document.getElementById(targetId).innerHTML = html;
    } catch (error) {
      console.error(`Error loading component from ${path}:`, error);
    }
  },

  async loadAll() {
    // Load header
    await this.loadComponent('components/header.html', 'header-container');
    
    // Load views
    await this.loadComponent('components/views/tasks-view.html', 'view-tasks');
    await this.loadComponent('components/views/summary-view.html', 'view-summary');
    await this.loadComponent('components/views/projects-view.html', 'view-projects');
    await this.loadComponent('components/views/history-view.html', 'view-history');
    
    // Load modals
    const modalsContainer = document.getElementById('modals-container');
    const modalPaths = [
      'components/modals/details-modal.html',
      'components/modals/project-modal.html',
      'components/modals/config-modal.html'
    ];
    
    for (const path of modalPaths) {
      const response = await fetch(path);
      const html = await response.text();
      modalsContainer.innerHTML += html;
    }
  }
};

// Load components before app initialization
window.addEventListener('DOMContentLoaded', async () => {
  await ComponentLoader.loadAll();
  // Then the init.js will initialize the app
});
```

Aggiungi nel `index.html` PRIMA di tutti gli altri script:
```html
<script src="js/loader.js"></script>
```

### Opzione 2: Inclusione Manuale nel HTML

Copia il contenuto di ogni file HTML component direttamente nell'`index.html` nelle sezioni appropriate:
```html
<!-- Nel index.html -->
<body>
  <!-- HEADER: Copia contenuto da components/header.html -->
  <header class="flex flex-col sm:flex-row...">
    <!-- contenuto header -->
  </header>

  <!-- VIEWS: Copia contenuto da components/views/*.html -->
  <main id="main-content">
    <!-- contenuto tasks-view -->
    <!-- contenuto summary-view -->
    <!-- contenuto projects-view -->
    <!-- contenuto history-view -->
  </main>

  <!-- MODALS: Copia contenuto da components/modals/*.html -->
  <!-- contenuto details-modal -->
  <!-- contenuto project-modal -->
  <!-- contenuto config-modal -->
</body>
```

### Opzione 3: Server-Side Include (PHP/Node.js)

**PHP:**
```php
<?php include 'components/header.html'; ?>
```

**Node.js con Express + EJS:**
```ejs
<%- include('components/header.html') %>
```

## 📋 Ordine di Caricamento degli Script

**IMPORTANTE:** Gli script devono essere caricati in questo ordine preciso:
```html
<!-- 1. Loader (se usi caricamento dinamico) -->
<script src="js/loader.js"></script>

<!-- 2. Config -->
<script src="js/config.js"></script>

<!-- 3. Database -->
<script src="js/database.js"></script>

<!-- 4. Utils -->
<script src="js/utils.js"></script>

<!-- 5. Moduli Core (ordine importante) -->
<script src="js/tasks.js"></script>
<script src="js/subtasks.js"></script>
<script src="js/projects.js"></script>
<script src="js/timers.js"></script>

<!-- 6. Rendering e UI -->
<script src="js/rendering.js"></script>
<script src="js/modals.js"></script>
<script src="js/views.js"></script>

<!-- 7. App principale -->
<script src="js/app.js"></script>

<!-- 8. Inizializzazione (ULTIMO) -->
<script src="js/init.js"></script>
```

## 🚀 Quick Start

1. **Copia tutti i file nella struttura indicata**

2. **Scegli il metodo di integrazione:**
   - Per sviluppo locale: usa Opzione 2 (manuale)
   - Per produzione con server: usa Opzione 1 (dinamico) o 3 (SSI)

3. **Avvia un server locale:**
```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   
   # PHP
   php -S localhost:8000
```

4. **Apri nel browser:**
```
   http://localhost:8000/index.html
```

## 🔍 Debug e Testing

### Console Commands

Apri la console del browser e prova:
```javascript
// Verifica caricamento moduli
console.log(App);
console.log(TasksManager);
console.log(DatabaseManager);

// Carica dati demo
App.createDemoData();

// Esegui test interni
App.runInternalTests();

// Verifica database
DatabaseManager.db;
```

### Problemi Comuni

**Errore: "Failed to load component"**
- Verifica che i percorsi dei file siano corretti
- Usa un server web locale (non file://)

**Errore: "X is not defined"**
- Controlla l'ordine di caricamento degli script
- Verifica che tutti i file JS siano caricati

**IndexedDB non funziona:**
- Alcuni browser bloccano IndexedDB in modalità privata
- Controlla le impostazioni del browser

## 📊 Funzionalità Principali

### Gestione Task
- Creazione, modifica, eliminazione
- Inline editing (doppio click)
- Timer integrati
- Sub-task annidati (max 3 livelli)

### Filtri e Ricerca
- Ricerca globale
- Filtri per colonna
- Raggruppamento dinamico
- Paginazione (15 task/pagina)

### Markdown Support
- Descrizioni con Markdown
- Note cronologiche con Markdown
- Anteprima live

### Auto-tagging
- Estrazione automatica tag: `#[Nome Tag]`
- Estrazione automatica owners: `@[Nome Owner]`

## 🎨 Personalizzazione

### Modificare i colori
Modifica `styles.css`:
```css
.bg-indigo-600 { background-color: #TUO_COLORE; }
```

### Modificare font
Modifica `js/config.js`:
```javascript
DEFAULT_CONFIG: {
  fontFamily: 'TUO_FONT',
  fontSize: 'medium'
}
```

### Aggiungere campi personalizzati
Estendi `js/config.js` e `js/tasks.js` con i tuoi campi.

## 📝 Note Importanti

1. **Backup Dati:** L'app usa IndexedDB locale. I dati NON sono sincronizzati sul cloud.
2. **Browser Support:** Chrome, Firefox, Safari, Edge (versioni recenti)
3. **Mobile:** Completamente responsive, testato su iOS e Android
4. **Sicurezza:** I dati restano nel browser, nessuna trasmissione esterna

## 🆘 Supporto

Per problemi o domande:
1. Controlla la console del browser per errori
2. Esegui `App.runInternalTests()` per diagnostica
3. Verifica che tutti i file siano presenti e caricati

## 📜 Licenza

Questo progetto è fornito "as-is" per uso personale e educativo.