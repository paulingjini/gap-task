# Prompt Dettagliato per la Creazione di un'Applicazione di Task Management

## 1. Obiettivo Generale

Creare un'applicazione di gestione attività (Task Management) completa, modulare e interamente funzionante offline. L'applicazione deve essere un singolo file HTML auto-contenuto, generato tramite uno script di build. Deve avere un'interfaccia moderna, intuitiva e reattiva (responsive).

## 2. Architettura e Tecnologie

-   **Frontend:** HTML5, CSS3, JavaScript (ES6+).
-   **Styling:** Utilizzare Tailwind CSS per un design moderno e utility-first. Caricare da CDN nella versione di sviluppo, ma inlinare nel file di build finale.
-   **Librerie Esterne:**
    -   **Chart.js:** Per la visualizzazione di grafici e statistiche nella dashboard. Caricare da CDN e mantenere tale nella build finale.
    -   **Marked.js:** Per il rendering del Markdown nelle descrizioni delle attività. Caricare da CDN.
-   **Database:** Utilizzare **IndexedDB** come database lato client per garantire il funzionamento offline. L'interazione con il database deve essere gestita tramite un modulo `database.js` che astrae le operazioni CRUD.
-   **Struttura del Codice:** L'applicazione deve essere altamente modulare. Ogni funzionalità principale (tasks, progetti, storico, viste, ecc.) deve avere il proprio file JavaScript dedicato per una migliore manutenibilità.
-   **Build System:** Creare uno script `build.js` (Node.js) che compila tutti i file (HTML, CSS, JS e componenti) in un unico file `TaskManager.Vxx.html`. La versione `xx` deve essere estratta dinamicamente dal `CHEANGELOG.md`.

## 3. Struttura dei File (Versione di Sviluppo)

```
/
|-- index.html              # Pagina principale
|-- styles.css              # Stili personalizzati
|-- build.js                # Script per generare il file offline
|-- CHEANGELOG.md           # Log delle versioni e modifiche
|-- README.md               # Documentazione
|-- tests/
|   |-- test.js             # Script per i test automatici
|-- test.html               # Pagina per eseguire i test
|-- js/
|   |-- app.js              # Controller principale
|   |-- config.js           # Configurazione globale
|   |-- database.js         # Gestione IndexedDB
|   |-- history.js          # Logica per lo storico
|   |-- init.js             # Script di inizializzazione
|   |-- loader.js           # Caricatore dinamico componenti
|   |-- modals.js           # Gestione modali
|   |-- projects.js         # Logica gestione progetti
|   |-- rendering.js        # Funzioni di rendering UI
|   |-- subtasks.js         # Logica gestione sub-task
|   |-- tasks.js            # Logica gestione task
|   |-- timers.js           # Gestione timer
|   |-- utils.js            # Funzioni di utilità
|   |-- views.js            # Gestione delle viste
|-- components/
|   |-- header.html
|   |-- views/
|   |   |-- tasks-view.html
|   |   |-- summary-view.html
|   |   |-- projects-view.html
|   |   |-- history-view.html
|   |-- modals/
|   |   |-- details-modal.html
|   |   |-- project-modal.html
|   |   |-- config-modal.html
```

## 4. Funzionalità Dettagliate

### 4.1. Vista Principale (Tasks)

-   **Visualizzazione Task:** Mostra una lista di attività raggruppate per progetto, priorità o stato.
-   **Paginazione:** Supporta la paginazione per gestire un gran numero di attività.
-   **Filtri e Ricerca:**
    -   Una barra di ricerca globale per filtrare le attività per titolo.
    -   Filtri per colonna (stato, responsabile, priorità, ecc.).
-   **Ordinamento:** Permette di ordinare le attività per titolo, data di scadenza o priorità.
-   **Editing Inline:** Consente di modificare rapidamente il titolo o altri campi direttamente dalla tabella.
-   **Azioni Rapide:** Pulsanti per avviare/fermare un timer, segnare un'attività come completata o eliminarla.

### 4.2. Gestione Task (CRUD)

-   **Creazione:** Un modale permette di creare una nuova attività con campi come: titolo, descrizione (supporto Markdown), progetto, stato, priorità, data di scadenza, responsabile, tag.
-   **Dettagli:** Un modale mostra tutti i dettagli di un'attività, inclusi sub-task, note e storico delle modifiche.
-   **Sub-task:** Supporta l'aggiunta, la modifica e l'eliminazione di sub-task annidati (almeno 3 livelli).
-   **Timer:** Un timer integrato per tracciare il tempo speso su ogni attività e sub-task.

### 4.3. Vista Riepilogo (Dashboard)

-   **Statistiche Chiave:** Box con numeri totali per attività completate, in corso, in scadenza e scadute.
-   **Grafici:**
    -   Un **grafico a ciambella (doughnut)** mostra la distribuzione delle attività per priorità.
    -   Un secondo **grafico a ciambella** mostra la distribuzione delle attività per stato.
-   **Distribuzione per Responsabile:** Una tabella che riassume il numero di attività totali e completate per ogni responsabile.

### 4.4. Vista Progetti

-   **Lista Progetti:** Mostra una tabella con tutti i progetti.
-   **Dettagli Progetto:** Per ogni progetto, visualizza nome, project manager, stato (Attivo, In Pausa, Completato) e una barra di avanzamento basata sulle attività completate.
-   **Ordinamento:** Permette di ordinare i progetti per nome, stato o percentuale di completamento.
-   **Gestione Progetti (CRUD):** Un modale per creare e modificare i progetti.

### 4.5. Vista Storico

-   **Log Attività:** Registra ogni modifica significativa (creazione, aggiornamento, eliminazione) a task, sub-task e progetti.
-   **Dettagli Log:** Per ogni voce di log, mostra cosa è stato cambiato, da chi (se implementato) e quando.
-   **Ricerca:** Una barra di ricerca per filtrare lo storico per parole chiave.

### 4.6. Funzionalità Aggiuntive

-   **Import/Export:** Pulsanti per esportare tutti i dati dell'applicazione in un file JSON e importarli nuovamente.
-   **Dark Mode:** Un interruttore per passare dal tema chiaro a quello scuro.
-   **Configurazione Campi:** Un modale per permettere all'utente di personalizzare i valori dei menu a discesa (es. stati, priorità, categorie).
-   **Dati Demo:** Una funzione (`App.createDemoData()`) per popolare l'applicazione con dati di esempio, utile per i nuovi utenti.

## 5. Test

-   **Test Automatici:** Creare un file `tests/test.js` che esegua test automatici per le funzionalità CRUD di task, progetti e sub-task.
-   **Pagina di Test:** Una pagina `test.html` dedicata per eseguire questi test e visualizzare i risultati nella console del browser.
-   **Test Interni:** Una funzione `App.runInternalTests()` che esegue un self-test di base all'avvio dell'app.

## 6. Requisiti Non Funzionali

-   **Performance:** L'applicazione deve essere veloce e reattiva, con un tempo di caricamento inferiore ai 3 secondi.
-   **Usabilità:** L'interfaccia deve essere intuitiva e facile da usare senza bisogno di istruzioni.
-   **Compatibilità Browser:** Deve funzionare correttamente sulle versioni recenti di Chrome, Firefox, Safari e Edge.
-   **Manutenibilità:** Il codice deve essere pulito, ben commentato e organizzato in moduli per facilitare future modifiche.