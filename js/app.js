// Main Application Module
const App = {
    config: { ...AppConfig.DEFAULT_CONFIG },
  
    initialize: async () => {
      try {
        await DatabaseManager.init();
        
        const configs = await DatabaseManager.getAll('config');
        configs.forEach(conf => {
            App.config[conf.key] = conf.value;
        });
        
        await App.loadAllData();
        App.applyConfig();
        App.setupEventListeners();
        App.renderTasks();
        ViewsManager.updateSummaryStats();
        ViewsManager.updateDeadlines();
        
        if (localStorage.getItem('darkMode') === 'true') {
          document.documentElement.classList.add('dark');
        }
        
        console.log('✅ App inizializzata con successo!');
        App.runInternalTests();
        
      } catch (error) {
        console.error('❌ Errore di inizializzazione:', error);
        Utils.showNotification('Errore di inizializzazione', 'danger');
      }
    },
  
    loadAllData: async () => {
      await TasksManager.loadTasks();
      await SubtasksManager.loadSubtasks();
      await ProjectsManager.loadProjects();
      await HistoryManager.loadHistory();
      
      const domains = await DatabaseManager.getAll('fieldDomains');
      if (domains.length === 0) {
        for (const [name, values] of Object.entries(AppConfig.FIELD_DOMAINS)) {
          await DatabaseManager.add('fieldDomains', { name, values });
        }
      }
    },
  
    applyConfig: () => {
        const { fontFamily, fontSize, groupBy } = App.config;
        
        const fontMap = {
            'Inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'Roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
            'Source Code Pro': '"Source Code Pro", Consolas, monospace',
            'Inconsolata': 'Inconsolata, Consolas, monospace',
        };
        document.body.style.setProperty('--app-font-family', fontMap[fontFamily] || fontMap['Inter']);
  
        const sizeMap = {
            'small': '0.875rem',
            'medium': '1rem',
            'large': '1.125rem'
        };
        document.body.style.setProperty('--app-font-size-base', sizeMap[fontSize] || sizeMap['medium']);
        document.body.style.setProperty('--app-font-size-table', fontSize === 'small' ? '0.75rem' : '0.875rem');
  
        if (groupBy) {
            TasksManager.currentGroupBy = groupBy;
            const labelEl = document.getElementById('current-group-label');
            if (labelEl) labelEl.textContent = TasksManager.getGroupByLabel();
        }
        
        const fontSelect = document.getElementById('config-font-family');
        if (fontSelect) fontSelect.value = fontFamily || 'Inter';
        
        const sizeSelect = document.getElementById('config-font-size');
        if (sizeSelect) sizeSelect.value = fontSize || 'medium';
    },
  
    saveConfig: async (key, value) => {
        App.config[key] = value;
        await DatabaseManager.update('config', { key, value });
        App.applyConfig();
        Utils.showNotification(`Configurazione ${key} salvata`, 'info');
    },
  
    setupEventListeners: () => {
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('group-menu');
        const btn = e.target.closest('button');
        if (menu && !menu.contains(e.target) && (!btn || !btn.onclick || btn.onclick.toString().indexOf('toggleGroupMenu') === -1)) {
          menu.classList.add('hidden');
        }
      });
  
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
          e.preventDefault();
          ModalsManager.openNewTaskModal();
        }
        
        if (e.key === 'Escape') {
          ModalsManager.closeDetailsModal();
          ModalsManager.closeProjectModal();
          ModalsManager.closeFieldConfig();
          TasksManager.cancelInlineEdit();
        }
      });
  
      window.addEventListener('beforeunload', (e) => {
        if (TimersManager.timerInterval || TimersManager.activeSubtaskId) {
          e.preventDefault();
          e.returnValue = '';
          return 'Hai un timer attivo. Sei sicuro di voler uscire?';
        }
      });
    },
  
    renderTasks: async () => {
      const container = document.getElementById('tasks-container');
      const searchInput = document.getElementById('search-input')?.value.toLowerCase() || '';
      
      const filterInputs = {
          title: document.getElementById('filter-title')?.value.toLowerCase(),
          status: document.getElementById('filter-status')?.value.toLowerCase(),
          assignee: document.getElementById('filter-assignee')?.value.toLowerCase(),
          priority: document.getElementById('filter-priority')?.value.toLowerCase(),
          deadline: document.getElementById('filter-deadline')?.value,
          project: document.getElementById('filter-project')?.value.toLowerCase(),
          tags: document.getElementById('filter-tags')?.value.toLowerCase(),
      };
  
      const filteredTasks = TasksManager.filterTasks(searchInput, filterInputs);
      
      const tasksPerPage = App.config.tasksPerPage;
      const totalTasks = filteredTasks.length;
      const totalPages = Math.ceil(totalTasks / tasksPerPage);
      
      if (TasksManager.currentPage > totalPages && totalPages > 0) {
          TasksManager.currentPage = totalPages;
      } else if (totalPages === 0) {
          TasksManager.currentPage = 1;
      }
      
      const startIndex = (TasksManager.currentPage - 1) * tasksPerPage;
      const paginatedTasks = filteredTasks.slice(startIndex, startIndex + tasksPerPage);
      
      const groupedTasks = TasksManager.groupTasks(paginatedTasks);
      
      let sortedGroupKeys = Object.keys(groupedTasks);
      if (TasksManager.currentGroupBy === 'priority') {
          sortedGroupKeys.sort((a, b) => AppConfig.PRIORITY_ORDER[b] - AppConfig.PRIORITY_ORDER[a]);
      } else {
          sortedGroupKeys.sort((a, b) => a.localeCompare(b));
      }
  
      if (paginatedTasks.length > 0) {
          let contentHtml = '';
          
          for (const groupKey of sortedGroupKeys) {
              const tasksInGroup = TasksManager.sortTasks(groupedTasks[groupKey]);
              
              contentHtml += `<div class="mb-6">
 <h3 class="text-lg font-semibold mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">${groupKey} (${tasksInGroup.length})</h3>
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        ${(await Promise.all(tasksInGroup.map(async task => RenderingManager.renderTaskRow(task)))).join('')}
                    </tbody>
                </table>
            </div>`;
        }

        container.innerHTML = contentHtml;
    } else {
        const isFilterActive = searchInput || Object.values(filterInputs).some(f => f);

        if (isFilterActive) {
             const emptyStateHtml = `
                <div class="empty-state pt-16 pb-8">
                    <span class="material-icons">search_off</span>
                    <p>Nessuna attività corrisponde ai criteri di filtro/ricerca. Prova a modificare i filtri.</p>
                </div>`;
            container.innerHTML = emptyStateHtml;
        } else {
            container.innerHTML = '<div class="empty-state"><span class="material-icons">task_alt</span><p>Nessuna attività trovata. Prova a creare una nuova attività.</p></div>';
        }
    }

    App.updatePaginationControls(TasksManager.currentPage, totalPages, totalTasks);
  },

  updatePaginationControls: (currentPage, totalPages, totalTasks) => {
    const infoEl = document.getElementById('pagination-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    if (infoEl) infoEl.textContent = `Pagina ${currentPage} di ${totalPages} (${totalTasks} attività totali)`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  },

  changePage: (direction) => {
    TasksManager.currentPage += direction;
    App.renderTasks();
  },

  clearColumnFilters: () => {
    const filterIds = ['filter-title', 'filter-status', 'filter-assignee', 'filter-priority', 'filter-deadline', 'filter-project', 'filter-tags'];
    filterIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    App.renderTasks();
    Utils.showNotification('Filtri azzerati', 'info');
  },

  toggleGroupMenu: () => {
    const menu = document.getElementById('group-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  setGroupBy: (groupBy) => {
    TasksManager.currentGroupBy = groupBy;
    App.saveConfig('groupBy', groupBy);
    const labelEl = document.getElementById('current-group-label');
    if (labelEl) labelEl.textContent = TasksManager.getGroupByLabel();
    const menu = document.getElementById('group-menu');
    if (menu) menu.classList.add('hidden');
    App.renderTasks();
    Utils.showNotification(`Raggruppamento: ${TasksManager.getGroupByLabel()}`, 'info');
  },

  toggleDarkMode: () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  },

  runInternalTests: () => {
      const results = {};

      results.ProjectManagement = { status: 'OK', message: 'Project loading/rendering seems functional.' };
      try {
          if (ProjectsManager.projects.length > 0) {
            const tempProject = ProjectsManager.projects[0].name;
            const tasksInProject = TasksManager.tasks.filter(t => t.project === tempProject).length;
            if (tasksInProject === 0 && TasksManager.tasks.length > 0) {
                 results.ProjectManagement.message = 'Warning: Projects loaded, but no tasks linked. Check data integrity.';
            }
          }
      } catch (e) {
          results.ProjectManagement = { status: 'FAIL', message: `Project test error: ${e.message}` };
      }
      
      results.SubtaskRecursion = { status: 'OK', message: `Max recursion depth set to ${AppConfig.MAX_RECURSION_DEPTH}` };
      try {
          const testSubtasks = SubtasksManager.getSubtasksRecursive(TasksManager.tasks[0]?.id || -1, 0, 4);
          if (testSubtasks.length > 0 && testSubtasks[0].children && testSubtasks[0].children.length > 0) {
              results.SubtaskRecursion.message += ', Nested structure detected and handled.';
          }
      } catch (e) {
          results.SubtaskRecursion = { status: 'FAIL', message: `Recursion test FAIL (Possible recursion cycle detected)` };
      }

      results.TimerInteraction = { status: 'OK', message: 'Timer logic methods are available.' };
      if (!TimersManager.toggleTimer || !TimersManager.toggleSubtaskTimer) {
          results.TimerInteraction = { status: 'FAIL', message: 'Timer functions missing!' };
      }

      const testText = "Task for #[Frontend] review with @[John Doe]";
      const extraction = Utils.extractTagsAndOwners(testText);
      if (extraction.tags.includes('Frontend') && extraction.owners.includes('John Doe')) {
          results.AutoTagging = { status: 'OK', message: `Extraction successful. Tags: ${extraction.tags.join(', ')}, Owners: ${extraction.owners.join(', ')}` };
      } else {
          results.AutoTagging = { status: 'FAIL', message: `Extraction failed. Got: Tags: ${extraction.tags.join(', ')}, Owners: ${extraction.owners.join(', ')}` };
      }

      results.EmptyFilter = { status: App.clearColumnFilters ? 'OK' : 'FAIL', message: App.clearColumnFilters ? 'Filter clear function defined.' : 'Filter clear function missing.' };

      console.groupCollapsed('%c🛠️ Internal Self-Test Results', 'font-size: 14px; color: #4F46E5');
      let allPassed = true;
      for (const [key, result] of Object.entries(results)) {
          const color = result.status === 'OK' ? '#10B981' : (result.status === 'WARN' ? '#F59E0B' : '#EF4444');
          console.log(`%c[${result.status}] ${key}: %c${result.message}`, `color: ${color}; font-weight: bold;`, 'color: #6B7280; font-weight: normal;');
          if (result.status !== 'OK') allPassed = false;
      }
      console.groupEnd();
      
      if (!allPassed) {
          Utils.showNotification('ATTENZIONE: Il self-test ha rilevato errori. Controlla la console.', 'danger');
      }
  },

  createDemoData: async () => {
    const projects = [
      { name: 'Website Redesign', manager: 'Mario Rossi', status: 'Attivo', startDate: '2025-01-01', endDate: '2025-06-30' },
      { name: 'Mobile App', manager: 'Laura Bianchi', status: 'In Pausa', startDate: '2025-02-01', endDate: '2025-12-31' }
    ];

    for (const project of projects) {
      await ProjectsManager.createProject(project);
    }

    const tasks = [
      { title: 'Design Homepage', status: 'In Corso', priority: 'Alta', assignee: 'Mario Rossi', project: 'Website Redesign', deadline: '2025-11-01', description: '## Obiettivo\nCreare mockup homepage con #[Frontend] per @[Cliente]', tags: ['Design'], owners: [], notes: [], timeSpent: '02:30:00' },
      { title: 'Setup Database', status: 'Fatto', priority: 'Urgente', assignee: 'Laura Bianchi', project: 'Mobile App', deadline: '2025-10-20', description: 'Configurare database PostgreSQL', tags: ['Backend'], owners: [], notes: [], timeSpent: '04:15:00' },
      { title: 'User Testing', status: 'Da Fare', priority: 'Media', assignee: 'Giuseppe Verdi', project: 'Website Redesign', deadline: '2025-11-30', description: 'Pianificare sessioni di #[Testing] con @[UX Team]', tags: ['Testing'], owners: [], notes: [], timeSpent: '00:00:00' },
      { title: 'API Integration', status: 'In Revisione', priority: 'Alta', assignee: 'Laura Bianchi', project: 'Mobile App', deadline: '2025-10-25', description: 'Integrare REST API per #[Backend]', tags: ['Development'], owners: [], notes: [], timeSpent: '06:45:00' }
    ];

    for (const task of tasks) {
      const taskId = await TasksManager.createTask(task);
      
      if (taskId === 1) {
        await SubtasksManager.addSubtask(taskId, { title: 'Create wireframes', status: 'Fatto', priority: 'Alta', assignee: 'Mario Rossi', timeSpent: '01:00:00' });
        await SubtasksManager.addSubtask(taskId, { title: 'Review with team', status: 'In Corso', priority: 'Media', assignee: 'Mario Rossi', timeSpent: '00:30:00' });
      }
    }

    await App.loadAllData();
    App.renderTasks();
    ViewsManager.renderProjects();
    ViewsManager.updateSummaryStats();
    ViewsManager.updateDeadlines();
    Utils.showNotification('Dati demo caricati con successo!', 'success');
  }
};