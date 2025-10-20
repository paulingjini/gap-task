// Rendering Module
const RenderingManager = {
  
    renderTaskRow: async (task) => {
      const subtasksTree = SubtasksManager.getSubtasksRecursive(task.id, 0, 3);
      const allNestedSubtasks = [];
      const flattenSubtasks = (list) => {
          list.forEach(s => {
              allNestedSubtasks.push(s);
              if (s.children) flattenSubtasks(s.children);
          });
      };
      flattenSubtasks(subtasksTree);
  
      const completedSubtasks = allNestedSubtasks.filter(s => s.completed).length;
      const totalSubtasks = allNestedSubtasks.length;
      const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
      
      let totalTimeSeconds = Utils.parseTimeToSeconds(task.timeSpent || '00:00:00');
      let isTimingSelf = TimersManager.activeSubtaskId === task.id && TimersManager.timerInterval;
      
      if (isTimingSelf) {
          totalTimeSeconds = TimersManager.currentTaskTime;
      }
  
      let isAnySubtaskTiming = false;
      for (const subtask of allNestedSubtasks) {
          let subTime = Utils.parseTimeToSeconds(subtask.timeSpent || '00:00:00');
          if(TimersManager.activeSubtaskId === subtask.id && TimersManager.subtaskTimerInterval) {
              subTime = TimersManager.currentTaskTime;
              isAnySubtaskTiming = true;
          }
          totalTimeSeconds += subTime;
      }
      const totalTimeFormatted = Utils.formatSeconds(totalTimeSeconds);
  
      const isRunning = isTimingSelf || isAnySubtaskTiming;
      const runningIndicator = isRunning ? `<div class="timer-indicator"></div>` : '';
      
      const descriptionHtml = task.description ? Utils.renderMarkdown(task.description) : '';
      const descriptionPreview = descriptionHtml ? 
          `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 prose dark:prose-invert" style="max-height: 1.25em; overflow: hidden;">${descriptionHtml}</div>` 
          : '';
      
      const rowStyle = isRunning ? `--hover-bg: ${task.status === 'In Corso' ? '#e0f2f7' : '#e6e6fa'};` : '';
  
      let html = `<tr class="task-row-content hover:bg-gray-50 dark:hover:bg-gray-700/50" style="${rowStyle}">
        <td class="py-1 pl-6 pr-2 text-center w-6 col-id-exp">
            <div class="flex items-center justify-center">
              ${runningIndicator}
              <button onclick="event.stopPropagation(); TasksManager.toggleExpansion(${task.id}); App.renderTasks();" title="${task.expanded ? 'Comprimi' : 'Espandi'} sub-attività" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${totalSubtasks === 0 ? 'opacity-0 cursor-default' : ''}" ${totalSubtasks === 0 ? 'disabled' : ''}>
                <span class="material-icons text-base">${task.expanded ? 'expand_less' : 'expand_more'}</span>
              </button>
            </div>
        </td>
        <td class="py-1 px-3 font-medium text-gray-900 dark:text-white task-title-cell" onclick="ModalsManager.openDetailsModal(${task.id}, false)" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${task.id}, 'title', '${Utils.escapeHtml(task.title || '')}', this, false)">
          <span class="text-xs text-gray-500 dark:text-gray-400 mr-2">#${task.id}</span>
          <span class="title-text">${Utils.escapeHtml(task.title || '-')}</span>
          ${descriptionPreview}
          ${totalSubtasks > 0 ? `<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div class="bg-green-500 h-1.5 rounded-full progress-bar" style="width: ${subtaskProgress}%"></div>
              </div>
              ${completedSubtasks}/${totalSubtasks} sub-attività
            </div>` : ''}
        </td>
        <td class="py-1 px-3 col-status" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${task.id}, 'status', '${task.status || ''}', this, false)">
          <span class="px-2 py-1 text-xs font-medium rounded-full ${AppConfig.STATUS_COLORS[task.status] || ''}">${task.status}</span>
        </td>
        <td class="py-1 px-3" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${task.id}, 'assignee', '${task.assignee || ''}', this, false)">
          ${Utils.escapeHtml(task.assignee || '-')}
          ${task.owners && task.owners.length > 1 ? `<div class="text-xs text-gray-500 dark:text-gray-400">+${task.owners.length - 1} co-owners</div>` : ''}
        </td>
        <td class="py-1 px-3 col-priority" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${task.id}, 'priority', '${task.priority || ''}', this, false)">
          ${task.priority ? `<span class="px-2 py-1 text-xs font-medium rounded-full ${AppConfig.PRIORITY_COLORS[task.priority] || ''}">${task.priority}</span>` : '-'}
        </td>
        <td class="py-1 px-3 col-deadline" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${task.id}, 'deadline', '${task.deadline || ''}', this, false)">
          ${task.deadline ? Utils.formatDate(task.deadline) : '-'}
        </td>
        <td class="py-1 px-3" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${task.id}, 'project', '${task.project || ''}', this, false)">
          ${Utils.escapeHtml(task.project || '-')}
        </td>
        <td class="py-1 px-3">
          ${(task.tags || []).slice(0, 2).map(tag => `<span class="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 mr-1 tag">${Utils.escapeHtml(tag)}</span>`).join('')}
          ${(task.tags || []).length > 2 ? `<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 mr-1 tag">+${(task.tags || []).length - 2}</span>` : ''}
          ${(task.tags || []).length === 0 ? '-' : ''}
        </td>
        <td class="py-1 px-3 text-gray-500 dark:text-gray-400 col-time">
          <span id="time-display-${task.id}">${totalTimeFormatted}</span>
          <button onclick="event.stopPropagation(); TimersManager.toggleTimer(${task.id}); App.renderTasks();" id="timer-btn-${task.id}" class="ml-1 text-base p-0 text-green-500 hover:text-green-700" title="${isRunning ? 'Ferma Timer' : 'Avvia Timer'}">
              <span class="material-icons text-base align-middle">${isRunning ? 'pause' : 'play_arrow'}</span>
          </button>
        </td>
        <td class="py-1 pr-6 pl-3 col-actions">
          <div class="flex items-center space-x-1">
            <button onclick="event.stopPropagation(); ModalsManager.openDetailsModal(${task.id}, false)" class="text-blue-500 hover:text-blue-700" title="Dettagli">
              <span class="material-icons text-base">visibility</span>
            </button>
            <button onclick="event.stopPropagation(); ModalsManager.openAddSubtaskPrompt(${task.id})" class="text-green-500 hover:text-green-700" title="Aggiungi Sub-attività">
              <span class="material-icons text-base">add_task</span>
            </button>
            <button onclick="event.stopPropagation(); TasksManager.deleteTask(${task.id})" class="text-red-500 hover:text-red-700" title="Elimina">
              <span class="material-icons text-base">delete</span>
            </button>
          </div>
        </td>
      </tr>
      ${task.expanded ? RenderingManager.renderSubtaskRowRecursive(subtasksTree, task.id) : ''}
      `;
  
      return html;
    },
  
    renderSubtaskRowRecursive: (subtasks, parentId, level = 1) => {
      if (subtasks.length === 0) return '';
  
      const indentClass = `subtask-indent-${Math.min(level, 3)}`;
      
      let html = '';
      subtasks.forEach(subtask => {
          const isTiming = TimersManager.activeSubtaskId === subtask.id && TimersManager.subtaskTimerInterval;
          const runningIndicator = isTiming ? `<div class="timer-indicator"></div>` : '';
          const subtaskTimeFormatted = isTiming ? Utils.formatSeconds(TimersManager.currentTaskTime) : subtask.timeSpent || '00:00:00';
          
          const descriptionHtml = subtask.description ? Utils.renderMarkdown(subtask.description) : '';
          const descriptionPreview = descriptionHtml ? 
              `<div class="text-xs text-gray-500 dark:text-gray-400 ml-2 line-clamp-1 prose dark:prose-invert" style="max-height: 1.25em; overflow: hidden;">${descriptionHtml}</div>` 
              : '';
              
          const statusClass = subtask.status === 'Fatto' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
          const priorityClass = subtask.priority ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600';
  
          html += `<tr class="subtask-row-content hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td class="py-1 pr-2 ${indentClass} col-id-exp">
              ${runningIndicator}
            </td>
            <td class="py-1 pr-6 pl-0" colspan="6">
              <div class="flex items-center space-x-2 w-full">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                       onchange="event.stopPropagation(); SubtasksManager.toggleSubtask(${subtask.id}); App.renderTasks();" 
                       class="h-4 w-4 rounded border-gray-300 text-indigo-600 dark:bg-gray-900">
                
                <div class="flex-grow flex items-center space-x-1 cursor-pointer" onclick="event.stopPropagation(); ModalsManager.openDetailsModal(${subtask.id}, true)" ondblclick="event.stopPropagation(); TasksManager.enableInlineEdit(${subtask.id}, 'title', '${Utils.escapeHtml(subtask.title || '')}', this, true)">
                    <span class="text-xs text-gray-500 dark:text-gray-400 mr-2">#${subtask.id}</span>
                    <div class="title-text ${subtask.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-50'}">${Utils.escapeHtml(subtask.title || '-')}</div>
                    ${descriptionPreview}
                </div>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full ${priorityClass} hidden sm:inline-block">${subtask.priority || 'Nessuna'}</span>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full ${statusClass} hidden sm:inline-block">${subtask.status || 'Da Fare'}</span>
              </div>
            </td>
            <td class="py-1 px-3 text-xs text-gray-500 dark:text-gray-400">
                ${Utils.escapeHtml(subtask.assignee || '-')}
            </td>
            <td class="py-1 px-3 text-xs text-gray-500 dark:text-gray-400 col-time">
              <span id="time-display-${subtask.id}">${subtaskTimeFormatted}</span>
              <button onclick="event.stopPropagation(); TimersManager.toggleSubtaskTimer(${subtask.id}); App.renderTasks();" id="timer-btn-${subtask.id}" data-currenttime="${Utils.parseTimeToSeconds(subtaskTimeFormatted)}" class="ml-1 text-base p-0 text-green-500 hover:text-green-700" title="${isTiming ? 'Ferma Timer' : 'Avvia Timer'}">
                  <span class="material-icons text-base align-middle">${isTiming ? 'pause' : 'play_arrow'}</span>
              </button>
            </td>
            <td class="py-1 pl-6 pr-6 col-actions">
              <button onclick="event.stopPropagation(); SubtasksManager.deleteSubtask(${subtask.id}); App.renderTasks();" class="text-red-500 hover:text-red-700">
                <span class="material-icons text-sm">delete</span>
              </button>
              <button onclick="event.stopPropagation(); ModalsManager.openDetailsModal(${subtask.id}, true)" class="text-blue-500 hover:text-blue-700" title="Modifica">
                  <span class="material-icons text-sm">edit</span>
              </button>
              <button onclick="event.stopPropagation(); ModalsManager.openAddSubtaskPrompt(${subtask.id})" class="text-green-500 hover:text-green-700" title="Aggiungi Sub-attività">
                  <span class="material-icons text-sm">add_task</span>
              </button>
            </td>
          </tr>`;
          
          if (subtask.children && subtask.children.length > 0 && subtask.expanded) {
              html += RenderingManager.renderSubtaskRowRecursive(subtask.children, subtask.id, level + 1);
          }
      });
      
      return `<tr class="subtask-parent-row">
          <td colspan="10" class="p-0">
              <table class="w-full text-sm">
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                      ${html}
                  </tbody>
              </table>
          </td>
      </tr>`;
    },
  
    renderFilterCell: (header) => {
        const inputClass = "w-full text-xs px-1 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500";
        
        const currentFilterValue = document.getElementById(`filter-${header.key}`)?.value || '';
  
        let filterInput = '';
  
        switch(header.filterType) {
            case 'text':
                filterInput = `<input type="text" id="filter-${header.key}" placeholder="Cerca..." onkeyup="App.renderTasks()" class="${inputClass}" value="${Utils.escapeHtml(currentFilterValue)}" />`;
                break;
            case 'date':
                filterInput = `<input type="date" id="filter-${header.key}" onchange="App.renderTasks()" class="${inputClass}" value="${Utils.escapeHtml(currentFilterValue)}" />`;
                break;
            case 'select':
                const options = header.options || [];
                const selectOptions = options.map(opt => `<option value="${Utils.escapeHtml(opt)}" ${opt.toLowerCase() === currentFilterValue.toLowerCase() ? 'selected' : ''}>${Utils.escapeHtml(opt)}</option>`).join('');
                filterInput = `
                    <select id="filter-${header.key}" onchange="App.renderTasks()" class="${inputClass}">
                        <option value="">Tutti</option>
                        ${selectOptions}
                    </select>`;
                break;
            default:
                if (header.key === 'tags') {
                    filterInput = `<input type="text" id="filter-${header.key}" placeholder="Cerca tag..." onkeyup="App.renderTasks()" class="${inputClass}" value="${Utils.escapeHtml(currentFilterValue)}" />`;
                } else {
                    filterInput = '';
                }
        }
  
        return `<th class="px-3 pt-1 pb-2">${filterInput}</th>`;
    }
  };