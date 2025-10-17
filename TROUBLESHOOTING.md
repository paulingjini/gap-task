# Guida alla Risoluzione dei Problemi

## 🐛 Problemi Comuni

### 1. Errore: "Failed to load component"

**Causa:** Browser blocca richieste fetch su protocollo file://

**Soluzione:**
```bash
# Usa un server web locale
python -m http.server 8000
# oppure
npx http-server -p 8000
```

### 2. Errore: "X is not defined"

**Causa:** Script caricati nell'ordine sbagliato

**Soluzione:**
Verifica che l'ordine degli script in `index.html` sia esattamente:
1. loader.js
2. config.js
3. database.js
4. utils.js
5. tasks.js
6. subtasks.js
7. projects.js
8. history.js
9. timers.js
10. rendering.js
11. modals.js
12. views.js
13. app.js
14. init.js

### 3. IndexedDB non funziona

**Causa:** 
- Modalità privata del browser
- Limiti di storage superati
- Permessi bloccati

**Soluzione:**
```javascript
// Verifica supporto IndexedDB
if (!window.indexedDB) {
    alert("Il tuo browser non supporta IndexedDB");
}

// Pulisci database
indexedDB.deleteDatabase('TaskManagementDB');
location.reload();
```

### 4. I componenti non si caricano

**Causa:** Percorsi file errati o CORS

**Soluzione:**
```javascript
// Debug in console
ComponentLoader.loadAll().then(success => {
    console.log('Components loaded:', success);
});

// Verifica percorsi
fetch('components/header.html').then(r => console.log('Header:', r.ok));
```

### 5. Dark mode non funziona

**Causa:** localStorage bloccato o classe non applicata

**Soluzione:**
```javascript
// Test manuale
document.documentElement.classList.add('dark');

// Verifica localStorage
console.log(localStorage.getItem('darkMode'));
```

### 6. Timer non si aggiorna

**Causa:** Interval non avviato o task ID errato

**Soluzione:**
```javascript
// Debug timer
console.log('Timer interval:', TimersManager.timerInterval);
console.log('Active ID:', TimersManager.activeSubtaskId);

// Reset timer
if (TimersManager.timerInterval) {
    clearInterval(TimersManager.timerInterval);
    TimersManager.timerInterval = null;
}
```

### 7. Filtri non funzionano

**Causa:** Input ID non trovati o event listener mancanti

**Soluzione:**
```javascript
// Verifica filtri
document.getElementById('search-input');
document.getElementById('filter-status');

// Test filtro
TasksManager.filterTasks('test', {});
```

## 🔧 Comandi di Debug Utili

Apri la console del browser (F12) e prova:
```javascript
// 1. Verifica stato applicazione
console.log('App:', App);
console.log('Tasks:', TasksManager.tasks);
console.log('Projects:', ProjectsManager.projects);

// 2. Verifica database
DatabaseManager.db;
DatabaseManager.getAll('tasks').then(console.log);

// 3. Test componenti
ComponentLoader.isReady();

// 4. Forza reload dati
App.loadAllData().then(() => App.renderTasks());

// 5. Esporta dati
const backup = {
    tasks: TasksManager.tasks,
    projects: ProjectsManager.projects,
    subtasks: Object.values(SubtasksManager.subtasksMap).flat()
};
console.log(JSON.stringify(backup, null, 2));

// 6. Test self-check
App.runInternalTests();

// 7. Reset completo
indexedDB.deleteDatabase('TaskManagementDB');
localStorage.clear();
location.reload();
```

## 📊 Performance Issues

### App lenta con molti task

**Soluzione:**
```javascript
// Aumenta paginazione
App.saveConfig('tasksPerPage', 10);

// Disabilita animazioni
document.documentElement.style.setProperty('--animation-duration', '0s');
```

### Memoria elevata

**Soluzione:**
```javascript
// Pulisci vecchie voci storico
HistoryManager.historyLog = HistoryManager.historyLog.slice(-100);
DatabaseManager.getAll('historyLog').then(logs => {
    logs.slice(0, -100).forEach(log => {
        DatabaseManager.delete('historyLog', log.id);
    });
});
```

## 🆘 Ultimo Resort

Se nulla funziona:
```javascript
// Reset totale e ricarica dati demo
(async () => {
    // 1. Elimina database
    indexedDB.deleteDatabase('TaskManagementDB');
    
    // 2. Pulisci localStorage
    localStorage.clear();
    
    // 3. Ricarica pagina
    alert('Database resettato. La pagina verrà ricaricata.');
    location.reload();
})();
```

## 📞 Supporto

Se il problema persiste:

1. Apri la console (F12)
2. Esegui `App.runInternalTests()`
3. Copia l'output
4. Verifica versione browser
5. Controlla log errori completo