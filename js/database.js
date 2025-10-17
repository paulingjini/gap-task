// Database Management Module
const DatabaseManager = {
    db: null,
    
    init: () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(AppConfig.DB_NAME, AppConfig.DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          DatabaseManager.db = request.result;
          resolve(DatabaseManager.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains('tasks')) {
            const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
            taskStore.createIndex('status', 'status', { unique: false });
            taskStore.createIndex('project', 'project', { unique: false });
            taskStore.createIndex('deadline', 'deadline', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('projects')) {
            db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
          }
          
          if (!db.objectStoreNames.contains('customFields')) {
            db.createObjectStore('customFields', { keyPath: 'id', autoIncrement: true });
          }
  
          if (!db.objectStoreNames.contains('fieldDomains')) {
            db.createObjectStore('fieldDomains', { keyPath: 'id', autoIncrement: true });
          }
  
          if (!db.objectStoreNames.contains('subtasks')) {
            const subtaskStore = db.createObjectStore('subtasks', { keyPath: 'id', autoIncrement: true }); 
            subtaskStore.createIndex('parentId', 'parentId', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('config')) {
            db.createObjectStore('config', { keyPath: 'key' });
          }
          
          if (!db.objectStoreNames.contains('historyLog')) {
            const historyStore = db.createObjectStore('historyLog', { keyPath: 'id', autoIncrement: true });
            historyStore.createIndex('itemId', 'itemId', { unique: false });
          }
        };
      });
    },
  
    add: async (storeName, data) => {
      return new Promise((resolve, reject) => {
        const transaction = DatabaseManager.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
  
    update: async (storeName, data) => {
      return new Promise((resolve, reject) => {
        const transaction = DatabaseManager.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
  
    get: async (storeName, id) => {
      return new Promise((resolve, reject) => {
          const transaction = DatabaseManager.db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(id);
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
    },
  
    delete: async (storeName, id) => {
      return new Promise((resolve, reject) => {
        const transaction = DatabaseManager.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    },
  
    getAll: async (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = DatabaseManager.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
  };