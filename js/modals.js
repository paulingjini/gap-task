// Modals Management Module
const ModalsManager = {
  
    openDetailsModal: async (itemId = null, isSubtask = false) => {
      if (itemId === null) {
          ModalsManager.openNewTaskModal();
          return;
      }
      
      const storeName = isSubtask ? 'subtasks' : 'tasks';
      const item = await DatabaseManager.get(storeName, itemId);
      if (!item) return;
  
      const subtasks = SubtasksManager.getSubtasksRecursive(item.id);
      const allNestedSubtasks = [];
      const flattenSubtasks = (list) => {
          list.forEach(s => {
              allNestedSubtasks.push(s);
              if (s.children) flattenSubtasks(s.children);
          });
      };
      flattenSubtasks(subtasks);
      const completedSubtasks = allNestedSubtasks.filter(s => s.completed).length;
      const totalSubtasks = allNestedSubtasks.length;
  
      const modal = document.getElementById('details-modal');
      document.getElementById('details-modal-title').textContent = `${isSubtask ? 'Dettagli Sub-attività' : 'Dettagli Attività'} #${item.id} ${item.title}`;
      document.getElementById('details-item-id').value = item.id;
      document.getElementById('details-is-subtask').value = isSubtask ? 'true' : 'false';
      
      const projectContainer = document.getElementById('details-project-container');
      if (projectContainer) projectContainer.style.display = isSubtask ? 'none' : 'block';
      
      const setField = (id, value, displayFormatter = (v) => Utils.escapeHtml(v || '-'), displayOverride = null) => {
          const el = document.getElementById(id);
          if (el) {
              el.dataset.value = value || '';
              el.innerHTML = displayOverride || displayFormatter(value);
          }
      };
  
      setField('details-field-title', item.title);
      setField('details-field-status', item.status, null, `<span class="px-2 py-1 text-xs font-medium rounded-full ${AppConfig.STATUS_COLORS[item.status] || ''}">${item.status}</span>`);
      setField('details-field-priority', item.priority, null, item.priority ? `<span class="px-2 py-1 text-xs font-medium rounded-full ${AppConfig.PRIORITY_COLORS[item.priority] || 'bg-gray-100'}">${item.priority}</span>` : '-');
      setField('details-field-assignee', item.assignee);
      setField('details-field-deadline', item.deadline, Utils.formatDate);
      if (!isSubtask) setField('details-field-project', item.project);
      
      const tagsDisplay = (item.tags || []).map(tag => `<span class="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 mr-1 tag">${Utils.escapeHtml(tag)}</span>`).join('');
      setField('details-field-tags', (item.tags || []).join(', '), null, tagsDisplay || '-');
  
      document.getElementById('description-textarea').value = item.description || '';
      ModalsManager.liveMarkdownPreview(item.description);
  
      const ownersListEl = document.getElementById('owners-list');
      if (ownersListEl && !isSubtask) {
          ownersListEl.innerHTML = (item.owners || []).map(owner => 
              `<span class="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm flex items-center">
                ${Utils.escapeHtml(owner)}
                <button type="button" onclick="ModalsManager.removeTaskOwner(${item.id}, '${Utils.escapeHtml(owner)}')" class="ml-2 text-red-600 hover:text-red-800">×</button>
              </span>`
          ).join('');
          document.getElementById('details-owners-section').style.display = 'block';
      } else if (document.getElementById('details-owners-section')) {
          document.getElementById('details-owners-section').style.display = 'none';
      }
  
      const notesListEl = document.getElementById('notes-list');
      if (notesListEl) {
          if (item.notes && item.notes.length > 0) {
              notesListEl.innerHTML = item.notes.map(note => `
                  <div class="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border-l-4 border-indigo-500">
                      <div class="flex justify-between items-start mb-2">
                          <span class="text-xs text-gray-500 dark:text-gray-400">${Utils.formatDate(note.timestamp)} - ${Utils.escapeHtml(note.author || 'Utente')}</span>
                      </div>
                      <div class="text-sm prose dark:prose-invert max-w-none">${Utils.renderMarkdown(note.text)}</div>
                  </div>
              `).join('');
          } else {
              notesListEl.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Nessuna nota disponibile.</p>';
          }
      }
  
      const subtasksSectionEl = document.getElementById('details-subtasks-section');
      if (totalSubtasks > 0) {
          subtasksSectionEl.innerHTML = `<div class="border-t pt-4">
            <h3 class="font-semibold mb-3 flex items-center"><span class="material-icons text-base mr-2">checklist</span> Sub-attività Annidate (${completedSubtasks}/${totalSubtasks})</h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              ${allNestedSubtasks.map(st => `
                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <div class="flex items-center space-x-2">
                      <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="SubtasksManager.toggleSubtask(${st.id}); ModalsManager.openDetailsModal(${itemId}, ${isSubtask});" class="h-4 w-4">
                      <span class="${st.completed ? 'line-through text-gray-500' : ''}">#${st.id} ${Utils.escapeHtml(st.title)}</span>
                  </div>
                  <div class="flex items-center space-x-2 text-xs">
                      <span class="text-gray-500">T: ${st.timeSpent || '00:00:00'}</span>
                      <button type="button" onclick="event.stopPropagation(); ModalsManager.openDetailsModal(${st.id}, true)" class="text-blue-500 hover:text-blue-700" title="Modifica Dettagli">
                          <span class="material-icons text-base">edit</span>
                      </button>
                  </div>
                </div>
              `).join('')}
            </div>
             <button type="button" onclick="event.stopPropagation(); ModalsManager.openAddSubtaskPrompt(${item.id})" class="mt-4 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                  Aggiungi Sub-task
              </button>
          </div>`;
      } else {
          subtasksSectionEl.innerHTML = `<div class="border-t pt-4"><button type="button" onclick="event.stopPropagation(); ModalsManager.openAddSubtaskPrompt(${item.id})" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
              Aggiungi la prima Sub-attività
          </button></div>`;
      }
  
      modal.classList.add('active');
    },
  
    openNewTaskModal: () => {
      const modal = document.getElementById('details-modal');
      document.getElementById('details-modal-title').textContent = 'Nuova Attività';
      document.getElementById('details-item-id').value = '';
      document.getElementById('details-is-subtask').value = 'false';
      
      document.getElementById('details-field-title').textContent = 'Inserisci Titolo';
      document.getElementById('details-field-title').dataset.value = '';
      
      document.getElementById('description-textarea').value = '';
      ModalsManager.liveMarkdownPreview('');
      
      const clearFields = ['details-field-status', 'details-field-priority', 'details-field-assignee', 'details-field-deadline', 'details-field-project', 'details-field-tags'];
      clearFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.dataset.value = '';
          el.innerHTML = '-'; 
        }
      });
  
      if (App.config.groupBy === 'project' && ProjectsManager.projects.length > 0) {
        const defaultProject = ProjectsManager.projects[0].name;
        document.getElementById('details-field-project').dataset.value = defaultProject;
        document.getElementById('details-field-project').textContent = defaultProject;
      }
      
      document.getElementById('owners-list').innerHTML = '-';
      document.getElementById('notes-list').innerHTML = '-';
      document.getElementById('details-subtasks-section').innerHTML = '';
      
      modal.classList.add('active');
    },
  
    closeDetailsModal: () => {
      const modal = document.getElementById('details-modal');
      if (modal) modal.classList.remove('active');
    },
  
    saveDetails: async (event) => {
        event.preventDefault();
        
        const itemIdStr = document.getElementById('details-item-id').value;
        const isSubtask = document.getElementById('details-is-subtask').value === 'true';
        
        let item = null;
        let storeName;
        let isNewTask = itemIdStr === '';
  
        if (isNewTask) {
            storeName = 'tasks';
            item = { 
                createdAt: new Date().toISOString(),
                owners: [],
                notes: [],
                timeSpent: '00:00:00',
                status: 'Da Fare',
                completed: false,
                tags: []
            };
        } else {
            storeName = isSubtask ? 'subtasks' : 'tasks';
            item = await DatabaseManager.get(storeName, parseInt(itemIdStr));
        }
  
        if (!item) {
            Utils.showNotification('Errore: Impossibile trovare l\'elemento da salvare.', 'danger');
            return;
        }
        
        const titleEl = document.getElementById('details-field-title');
        const statusEl = document.getElementById('details-field-status');
        const priorityEl = document.getElementById('details-field-priority');
        const assigneeEl = document.getElementById('details-field-assignee');
        const deadlineEl = document.getElementById('details-field-deadline');
        const projectEl = document.getElementById('details-field-project');
        const tagsEl = document.getElementById('details-field-tags');
        const descriptionTextarea = document.getElementById('description-textarea');
        
        item.title = titleEl ? titleEl.textContent.trim() || 'Attività Senza Titolo' : item.title;
        item.status = statusEl ? statusEl.dataset.value || item.status : item.status;
        item.priority = priorityEl ? priorityEl.dataset.value || '' : item.priority || '';
        item.assignee = assigneeEl ? assigneeEl.dataset.value || '' : item.assignee || '';
        item.deadline = deadlineEl ? deadlineEl.dataset.value || '' : item.deadline || '';
        
        if (!isSubtask) {
            item.project = projectEl ? projectEl.dataset.value || '' : item.project || '';
        }
        
        item.tags = tagsEl ? (tagsEl.dataset.value || '').split(',').map(t => t.trim()).filter(t => t) : item.tags || [];
        
        const newDescription = descriptionTextarea ? descriptionTextarea.value : item.description;
        item.description = newDescription;
        
        item.completed = (item.status === 'Fatto');
        item.updatedAt = new Date().toISOString();
        
        const { tags: extractedTags, owners: extractedOwners } = Utils.extractTagsAndOwners(newDescription);
        
        const uniqueTags = new Set([...(item.tags || []), ...extractedTags]);
        item.tags = Array.from(uniqueTags);
        
        if (!isSubtask) {
            const existingOwners = item.owners || [];
            const uniqueOwners = new Set([...existingOwners, ...extractedOwners]);
            item.owners = Array.from(uniqueOwners);
        }
        
        try {
            if (isNewTask) {
                const newId = await TasksManager.createTask(item);
                Utils.showNotification(`Attività #${newId} creata!`, 'success');
            } else {
                if (isSubtask) {
                    await SubtasksManager.updateSubtask(item);
                } else {
                    await TasksManager.updateTask(item);
                }
                Utils.showNotification(`Dettagli ${isSubtask ? 'Sub-attività' : 'Attività'} #${item.id} aggiornati!`, 'success');
            }
            
            ModalsManager.closeDetailsModal();
            App.renderTasks();
            ViewsManager.updateSummaryStats();
        } catch (error) {
            console.error('Error saving details:', error);
            Utils.showNotification('Errore nel salvataggio dei dettagli', 'danger');
        }
    },
  
    liveMarkdownPreview: (text) => {
        const previewEl = document.getElementById('markdown-preview');
        if (previewEl) {
            previewEl.innerHTML = Utils.renderMarkdown(text);
            if (text.trim() === '') {
                previewEl.textContent = 'Anteprima descrizione vuota.';
            }
        }
    },
  
    addNoteFromInput: async (itemId, isSubtask) => {
      const input = document.getElementById('new-note-input');
      if (!input || !input.value.trim()) return;
      
      const storeName = isSubtask ? 'subtasks' : 'tasks';
      let item = await DatabaseManager.get(storeName, itemId);
  
      if (item) {
          const noteText = input.value.trim();
          
          if (!item.notes) item.notes = [];
          
          item.notes.push({
              id: Date.now(),
              text: noteText,
              timestamp: new Date().toISOString(),
              author: 'Utente'
          });
          
          const { tags: extractedTags, owners: extractedOwners } = Utils.extractTagsAndOwners(noteText);
          
          const uniqueTags = new Set([...(item.tags || []), ...extractedTags]);
          item.tags = Array.from(uniqueTags);
          
          if (!isSubtask) {
              const existingOwners = item.owners || [];
              const uniqueOwners = new Set([...existingOwners, ...extractedOwners]);
              item.owners = Array.from(uniqueOwners);
          }
  
          item.updatedAt = new Date().toISOString();
          await DatabaseManager.update(storeName, item);
          
          Utils.showNotification('Nota e Tags/Owners aggiunti!', 'success');
          input.value = '';
          ModalsManager.openDetailsModal(itemId, isSubtask);
      }
    },
  
    removeTaskOwner: async (taskId, owner) => {
      const task = await DatabaseManager.get('tasks', taskId);
      if (task && task.owners) {
        task.owners = task.owners.filter(o => o !== owner);
        await TasksManager.updateTask(task);
        Utils.showNotification('Owner rimosso', 'success');
        ModalsManager.openDetailsModal(taskId, false);
      }
    },
  
    addOwnerPrompt: async (taskId) => {
      const owner = prompt('Inserisci il nome del nuovo owner:');
      if (owner && owner.trim()) {
        const task = await DatabaseManager.get('tasks', taskId);
        if (task) {
          if (!task.owners) task.owners = [];
          if (!task.owners.includes(owner.trim())) {
            task.owners.push(owner.trim());
            await TasksManager.updateTask(task);
            ModalsManager.openDetailsModal(taskId, false);
            Utils.showNotification('Owner aggiunto', 'success');
          }
        }
      }
    },
  
    openAddSubtaskPrompt: (parentId) => {
      const title = prompt('Inserisci il titolo della sub-attività:');
      if (title && title.trim()) {
        SubtasksManager.addSubtask(parentId, { title: title.trim() }).then(() => {
          App.renderTasks();
        });
      }
    },
  
    // Project Modal
    openProjectModal: async (projectId = null) => {
      const modal = document.getElementById('project-modal');
      const form = document.getElementById('project-form');
      
      form.reset();
      
      if (projectId) {
        const project = await DatabaseManager.get('projects', projectId);
        if (project) {
          document.getElementById('project-id').value = project.id;
          document.getElementById('project-name').value = project.name;
          document.getElementById('project-description').value = project.description || '';
          document.getElementById('project-manager').value = project.manager || '';
          document.getElementById('project-start').value = project.startDate || '';
          document.getElementById('project-end').value = project.endDate || '';
          document.getElementById('project-status').value = project.status || 'Attivo';
        }
      }
      
      modal.classList.add('active');
    },
  
    closeProjectModal: () => {
      document.getElementById('project-modal').classList.remove('active');
    },
  
    saveProject: async (event) => {
      event.preventDefault();
      
      const projectId = document.getElementById('project-id').value;
      const projectData = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        manager: document.getElementById('project-manager').value,
        startDate: document.getElementById('project-start').value,
        endDate: document.getElementById('project-end').value,
        status: document.getElementById('project-status').value
      };
      
      try {
        if (projectId) {
          projectData.id = parseInt(projectId);
          await ProjectsManager.updateProject(projectData);
        } else {
          await ProjectsManager.createProject(projectData);
        }
        
        ModalsManager.closeProjectModal();
        ViewsManager.renderProjects();
      } catch (error) {
        console.error('Error saving project:', error);
        Utils.showNotification('Errore nel salvataggio del progetto', 'danger');
      }
    },
  
    // Config Modal
    openFieldConfig: () => {
      const modal = document.getElementById('field-config-modal');
      ModalsManager.renderColumnConfig();
      ModalsManager.renderCustomFieldsConfig();
      ModalsManager.renderFieldDomainsConfig();
      modal.classList.add('active');
    },
  
    closeFieldConfig: () => {
      document.getElementById('field-config-modal').classList.remove('active');
    },
  
    renderColumnConfig: () => {
      const container = document.getElementById('columns-config');
      const columns = [
        { name: 'Titolo', key: 'title', visible: true, locked: true },
        { name: 'Stato', key: 'status', visible: true, locked: true },
        { name: 'Responsabile', key: 'assignee', visible: true },
        { name: 'Priorità', key: 'priority', visible: true },
        { name: 'Scadenza', key: 'deadline', visible: true },
        { name: 'Progetto', key: 'project', visible: true },
        { name: 'Tag', key: 'tags', visible: true },
        { name: 'Tempo', key: 'time', visible: true }
      ];
      
      let html = '';
      columns.forEach(col => {
        html += `<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <span class="material-icons text-gray-500 dark:text-gray-400 cursor-move text-base">drag_indicator</span>
            <span class="font-medium">${col.name}</span>
            ${col.locked ? '<span class="text-xs text-gray-500 dark:text-gray-400">(obbligatorio)</span>' : ''}
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" ${col.visible ? 'checked' : ''} ${col.locked ? 'disabled' : ''} class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>`;
      });
      
      container.innerHTML = html;
    },
  
    renderCustomFieldsConfig: () => {
      const container = document.getElementById('custom-fields-config');
      container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Funzionalità campi personalizzati in sviluppo.</p>';
    },
  
    renderFieldDomainsConfig: () => {
      const container = document.getElementById('field-domains-container');
      container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Funzionalità domini dropdown in sviluppo.</p>';
    }
  };