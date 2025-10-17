/**
 * Component Loader Module
 * Carica dinamicamente i componenti HTML dell'applicazione
 */
const ComponentLoader = {
    componentsLoaded: false,
    
    /**
     * Carica un singolo componente HTML
     * @param {string} path - Percorso del file HTML
     * @param {string} targetId - ID dell'elemento target
     * @param {boolean} append - Se true, aggiunge invece di sostituire
     */
    async loadComponent(path, targetId, append = false) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const target = document.getElementById(targetId);
        
        if (!target) {
          console.warn(`Target element #${targetId} not found for ${path}`);
          return false;
        }
        
        if (append) {
          target.innerHTML += html;
        } else {
          target.innerHTML = html;
        }
        
        console.log(`✓ Loaded: ${path}`);
        return true;
      } catch (error) {
        console.error(`✗ Error loading ${path}:`, error);
        return false;
      }
    },
  
    /**
     * Carica tutti i componenti dell'applicazione
     */
    async loadAll() {
      console.log('📦 Loading components...');
      const startTime = performance.now();
      
      try {
        // 1. Load Header
        await this.loadComponent('components/header.html', 'header-container');
        
        // 2. Load Views in parallel
        const viewsPromises = [
          this.loadComponent('components/views/tasks-view.html', 'view-tasks'),
          this.loadComponent('components/views/summary-view.html', 'view-summary'),
          this.loadComponent('components/views/projects-view.html', 'view-projects'),
          this.loadComponent('components/views/history-view.html', 'view-history')
        ];
        
        await Promise.all(viewsPromises);
        
        // 3. Load Modals
        const modalsContainer = document.getElementById('modals-container');
        if (modalsContainer) {
          const modalPaths = [
            'components/modals/details-modal.html',
            'components/modals/project-modal.html',
            'components/modals/config-modal.html'
          ];
          
          for (const path of modalPaths) {
            const response = await fetch(path);
            if (response.ok) {
              const html = await response.text();
              modalsContainer.innerHTML += html;
              console.log(`✓ Loaded: ${path}`);
            }
          }
        }
        
        const endTime = performance.now();
        const loadTime = (endTime - startTime).toFixed(2);
        
        console.log(`✅ All components loaded in ${loadTime}ms`);
        this.componentsLoaded = true;
        
        // Dispatch event per notificare che i componenti sono caricati
        document.dispatchEvent(new Event('componentsLoaded'));
        
        return true;
      } catch (error) {
        console.error('❌ Critical error loading components:', error);
        this.showLoadError(error);
        return false;
      }
    },
  
    /**
     * Mostra un messaggio di errore se i componenti non si caricano
     */
    showLoadError(error) {
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = `
          <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md">
              <div class="flex items-center mb-4">
                <span class="material-icons text-red-500 text-4xl mr-3">error</span>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Errore di Caricamento</h2>
              </div>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Impossibile caricare i componenti dell'applicazione.
              </p>
              <details class="mb-4">
                <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Dettagli tecnici</summary>
                <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">${error.message}</pre>
              </details>
              <div class="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 mb-4">
                <p class="text-sm text-blue-700 dark:text-blue-200">
                  <strong>Suggerimento:</strong> Assicurati di eseguire l'applicazione da un server web locale (non da file://).
                </p>
              </div>
              <button onclick="location.reload()" class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                Ricarica Pagina
              </button>
            </div>
          </div>
        `;
      }
    },
  
    /**
     * Verifica se i componenti sono stati caricati
     */
    isReady() {
      return this.componentsLoaded;
    }
  };
  
  // Auto-initialize quando il DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ComponentLoader.loadAll();
    });
  } else {
    ComponentLoader.loadAll();
  }