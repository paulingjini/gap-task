// Tasks Management Module
const TasksManager = {
    tasks: [],
    currentPage: 1,
    currentSortBy: 'createdAt',
    currentSortOrder: 'desc',
    currentGroupBy: 'project',
    editingCell: null,

    loadTasks: async () => {
      TasksManager.tasks = await DatabaseManager.getAll('tasks');
    },

    createTask: async (taskData) => {
      const task = {
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owners: taskData.owners || [],
        notes: taskData.notes || [],
        timeSpent: taskData.timeSpent || '00:00:00',
        status: taskData.status || 'Da Fare',
        completed: false,
        tags: taskData.tags || []
      };

      const id = await DatabaseManager.add('tasks', task);
      await HistoryManager.logChange('tasks', { ...task, id });
      await TasksManager.loadTasks();
      return id;
    },

    updateTask: async (taskData) => {
      taskData.updatedAt = new Date().toISOString();
      await HistoryManager.logChange('tasks', taskData);
      await DatabaseManager.update('tasks', taskData);
      await TasksManager.loadTasks();
    },

    deleteTask: async (taskId) => {
      if (!confirm('Sei sicuro di voler eliminare questa attività e tutte le sue sub-attività?')) {
        return;
      }

      const subtasksToDelete = [];
      const findNested = (id) => {
        const children = SubtasksManager.subtasksMap[id] || [];
        children.forEach(child => {
          subtasksToDelete.push(child.id);
          findNested(child.id);
        });
      };
      findNested(taskId);

      for (const id of subtasksToDelete) {
        await DatabaseManager.delete('subtasks', id);
      }

      await DatabaseManager.delete('tasks', taskId);
      await TasksManager.loadTasks();
      Utils.showNotification('Attività eliminata', 'success');
      App.renderTasks();
    },

    toggleExpansion: async (taskId) => {
      const task = await DatabaseManager.get('tasks', taskId);
      if (task) {
        task.expanded = !task.expanded;
        await DatabaseManager.update('tasks', task);
      }
    },

    filterTasks: (searchTerm, filters) => {
      let filtered = [...TasksManager.tasks];

      if (searchTerm) {
        filtered = filtered.filter(task =>
          (task.title && task.title.toLowerCase().includes(searchTerm)) ||
          (task.description && task.description.toLowerCase().includes(searchTerm)) ||
          (task.assignee && task.assignee.toLowerCase().includes(searchTerm)) ||
          (task.project && task.project.toLowerCase().includes(searchTerm)) ||
          (task.tags && task.tags.some(t => t.toLowerCase().includes(searchTerm))) ||
          (task.status && task.status.toLowerCase().includes(searchTerm)) ||
          (task.priority && task.priority.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.title) {
        filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(filters.title));
      }
      if (filters.status) {
        filtered = filtered.filter(t => (t.status || '').toLowerCase().includes(filters.status));
      }
      if (filters.assignee) {
        filtered = filtered.filter(t => (t.assignee || '').toLowerCase().includes(filters.assignee));
      }
      if (filters.priority) {
        filtered = filtered.filter(t => (t.priority || '').toLowerCase().includes(filters.priority));
      }
      if (filters.project) {
        filtered = filtered.filter(t => (t.project || '').toLowerCase().includes(filters.project));
      }
      if (filters.tags) {
        filtered = filtered.filter(t => (t.tags || []).some(tag => tag.toLowerCase().includes(filters.tags)));
      }
      if (filters.deadline) {
        filtered = filtered.filter(t => t.deadline && new Date(t.deadline) <= new Date(filters.deadline));
      }

      return filtered;
    },

    groupTasks: (tasks) => {
      const grouped = {};

      tasks.forEach(task => {
        let key;

        switch(TasksManager.currentGroupBy) {
          case 'project':
            key = task.project || 'Senza Progetto';
            break;
          case 'status':
            key = task.status || 'Senza Stato';
            break;
          case 'priority':
            key = task.priority || 'Senza Priorità';
            break;
          case 'assignee':
            key = task.assignee || 'Non Assegnato';
            break;
          case 'category':
            key = (task.tags && task.tags.length > 0) ? task.tags[0] : 'Senza Categoria';
            break;
          default:
            key = 'Tutte le Attività';
        }

        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(task);
      });

      return grouped;
    },

    sortTasks: (tasks) => {
      return tasks.sort((a, b) => {
        let valA = a[TasksManager.currentSortBy];
        let valB = b[TasksManager.currentSortBy];

        if (TasksManager.currentSortBy === 'priority') {
          valA = AppConfig.PRIORITY_ORDER[valA] || 0;
          valB = AppConfig.PRIORITY_ORDER[valB] || 0;
        }

        if (valA < valB) return TasksManager.currentSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return TasksManager.currentSortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },

    setSortBy: (field) => {
      if (TasksManager.currentSortBy === field) {
        TasksManager.currentSortOrder = TasksManager.currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        TasksManager.currentSortBy = field;
        TasksManager.currentSortOrder = 'desc';
      }
    },

    getGroupByLabel: () => {
      const labels = {
        'project': 'Progetto',
        'status': 'Stato',
        'priority': 'Priorità',
        'assignee': 'Responsabile',
        'category': 'Categoria',
        'none': 'Nessuno'
      };
      return labels[TasksManager.currentGroupBy] || 'Nessuno';
    },

    // Inline Editing
    enableInlineEdit: async (itemId, field, currentValue, element, isSubtask = false) => {
      if (TasksManager.editingCell) {
        TasksManager.cancelInlineEdit();
      }

      TasksManager.editingCell = { itemId, field, element, originalValue: currentValue, isSubtask };

      let inputHtml = '';

      switch(field) {
        case 'status':
          const statuses = AppConfig.FIELD_DOMAINS['Stati'];
          inputHtml = `<select class="inline-edit-input px-2 py-1 border rounded text-sm w-32">
            ${statuses.map(s => `<option value="${Utils.escapeHtml(s)}" ${s === currentValue ? 'selected' : ''}>${Utils.escapeHtml(s)}</option>`).join('')}
          </select>`;
          break;

        case 'priority':
          const priorities = AppConfig.FIELD_DOMAINS['Priorità'];
          inputHtml = `<select class="inline-edit-input px-2 py-1 border rounded text-sm w-24">
            <option value="">Nessuna</option>
            ${priorities.map(p => `<option value="${Utils.escapeHtml(p)}" ${p === currentValue ? 'selected' : ''}>${Utils.escapeHtml(p)}</option>`).join('')}
          </select>`;
          break;

        case 'deadline':
          inputHtml = `<input type="date" class="inline-edit-input px-2 py-1 border rounded text-sm w-32" value="${currentValue || ''}">`;
          break;

        case 'assignee':
        case 'project':
          inputHtml = `<input type="text" class="inline-edit-input px-2 py-1 border rounded text-sm" value="${currentValue || ''}" style="min-width: 150px;">`;
          break;
        case 'tags':
          inputHtml = `<input type="text" class="inline-edit-input px-2 py-1 border rounded text-sm" value="${currentValue ? currentValue.join(', ') : ''}" style="min-width: 150px;">`;
          break;
        case 'timeSpent':
          Utils.showNotification('Modifica tempo solo tramite Timer o Modale Dettagli.', 'warning');
          TasksManager.editingCell = null;
          return;
        case 'title':
          inputHtml = `<input type="text" class="inline-edit-input px-2 py-1 border rounded text-sm" value="${currentValue || ''}" style="min-width: 200px;">`;
          break;
      }

      const buttonHtml = `<div class="inline-flex items-center space-x-1 ml-1">
          <button type="button" onclick="TasksManager.saveInlineEdit()" class="text-green-600 hover:text-green-800"><span class="material-icons text-sm">check</span></button>
          <button type="button" onclick="TasksManager.cancelInlineEdit()" class="text-red-600 hover:text-red-800"><span class="material-icons text-sm">close</span></button>
      </div>`;

      element.innerHTML = inputHtml + buttonHtml;

      const input = element.querySelector('.inline-edit-input');
      input.focus();

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          TasksManager.saveInlineEdit();
        } else if (e.key === 'Escape') {
          TasksManager.cancelInlineEdit();
        }
      });
    },

    saveInlineEdit: async () => {
      if (!TasksManager.editingCell) return;

      const { itemId, field, isSubtask } = TasksManager.editingCell;
      const input = document.querySelector('.inline-edit-input');
      let newValue = input.value;

      const storeName = isSubtask ? 'subtasks' : 'tasks';
      const item = await DatabaseManager.get(storeName, itemId);

      if (item) {
          if (field === 'tags') {
              newValue = newValue.split(',').map(t => t.trim()).filter(t => t);
          } else if (field === 'status') {
              item.completed = (newValue === 'Fatto');
          }

          item[field] = newValue;
          item.updatedAt = new Date().toISOString();

          const { tags: newTags, owners: newOwners } = Utils.extractTagsAndOwners(newValue);
          if (field === 'title' || field === 'description') {
              const uniqueTags = new Set([...(item.tags || []), ...newTags]);
              item.tags = Array.from(uniqueTags);

              if (!isSubtask) {
                  const uniqueOwners = new Set([...(item.owners || []), ...newOwners]);
                  item.owners = Array.from(uniqueOwners);
              }
          }

          await DatabaseManager.update(storeName, item);
          await HistoryManager.logChange(storeName, item);
          await TasksManager.loadTasks();

          TasksManager.editingCell = null;
          Utils.showNotification('Aggiornato!', 'success');
          App.renderTasks();
      }
    },

    cancelInlineEdit: () => {
      if (!TasksManager.editingCell) return;
      Tasks.Manager.editingCell = null;
    }
};