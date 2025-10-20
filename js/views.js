// Views Management Module
const ViewsManager = {

    showView: (viewName) => {
      const views = ['tasks', 'summary', 'projects', 'history'];
      views.forEach(view => {
        const el = document.getElementById(`view-${view}`);
        const btn = document.getElementById(`btn-${view}`);
        if (el) {
          if (view === viewName) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        }
        if (btn) {
          if (view === viewName) {
            btn.classList.add('bg-white', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            btn.classList.remove('text-gray-500', 'dark:text-gray-400');
          } else {
            btn.classList.remove('bg-white', 'dark:bg-gray-800', 'text-gray-900', 'dark:text-white', 'shadow-sm');
            btn.classList.add('text-gray-500', 'dark:text-gray-400');
          }
        }
      });

      if (viewName === 'summary') {
        ViewsManager.updateSummaryStats();
      } else if (viewName === 'projects') {
        ViewsManager.renderProjects();
      } else if (viewName === 'history') {
        ViewsManager.renderHistory();
      }
    },

    updateSummaryStats: () => {
      const completed = TasksManager.tasks.filter(t => t.status === 'Fatto').length;
      const inProgress = TasksManager.tasks.filter(t => t.status === 'In Corso').length;

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = TasksManager.tasks.filter(t => t.deadline && new Date(t.deadline) <= sevenDaysFromNow && new Date(t.deadline) >= now && t.status !== 'Fatto').length;
      const overdue = TasksManager.tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== 'Fatto').length;

      document.getElementById('stat-complete').textContent = completed;
      document.getElementById('stat-inprogress').textContent = inProgress;
      document.getElementById('stat-upcoming').textContent = upcoming;
      document.getElementById('stat-overdue').textContent = overdue;

      const priorityCounts = {
        'Urgente': TasksManager.tasks.filter(t => t.priority === 'Urgente' && t.status !== 'Fatto').length,
        'Alta': TasksManager.tasks.filter(t => t.priority === 'Alta' && t.status !== 'Fatto').length,
        'Media': TasksManager.tasks.filter(t => t.priority === 'Media' && t.status !== 'Fatto').length,
        'Bassa': TasksManager.tasks.filter(t => t.priority === 'Bassa' && t.status !== 'Fatto').length
      };

      const priorityChartEl = document.getElementById('priority-chart');
      if (priorityChartEl) {
        let chartHtml = '';
        Object.entries(priorityCounts).forEach(([priority, count]) => {
          const percentage = TasksManager.tasks.length > 0 ? (count / TasksManager.tasks.length) * 100 : 0;
          chartHtml += `
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium">${priority}</span>
                <span class="text-sm text-gray-500">${count}</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-indigo-600 h-2 rounded-full" style="width: ${percentage}%"></div>
              </div>
            </div>
          `;
        });
        priorityChartEl.innerHTML = chartHtml;
      }

      const assignees = {};
      TasksManager.tasks.forEach(task => {
        const assignee = task.assignee || 'Non assegnato';
        if (!assignees[assignee]) {
          assignees[assignee] = { total: 0, completed: 0 };
        }
        assignees[assignee].total++;
        if (task.status === 'Fatto') {
          assignees[assignee].completed++;
        }
      });

      const assigneeTableEl = document.getElementById('assignee-table');
      if (assigneeTableEl) {
        let tableHtml = '<table class="w-full text-sm"><thead><tr><th class="text-left py-2">Responsabile</th><th class="text-right py-2">Totale</th><th class="text-right py-2">Completate</th></tr></thead><tbody>';
        Object.entries(assignees).forEach(([assignee, stats]) => {
          tableHtml += `
            <tr class="border-t border-gray-200 dark:border-gray-700">
              <td class="py-2">${Utils.escapeHtml(assignee)}</td>
              <td class="text-right">${stats.total}</td>
              <td class="text-right">${stats.completed}</td>
            </tr>
          `;
        });
        tableHtml += '</tbody></table>';
        assigneeTableEl.innerHTML = tableHtml;
      }
    },

    updateDeadlines: () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = TasksManager.tasks.filter(t =>
        t.deadline &&
        new Date(t.deadline) <= sevenDaysFromNow &&
        new Date(t.deadline) >= now &&
        t.status !== 'Fatto'
      ).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

      const overdue = TasksManager.tasks.filter(t =>
        t.deadline &&
        new Date(t.deadline) < now &&
        t.status !== 'Fatto'
      ).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

      const upcomingEl = document.getElementById('upcoming-deadlines');
      const overdueEl = document.getElementById('overdue-tasks');

      if (upcomingEl) {
        if (upcoming.length === 0) {
          upcomingEl.innerHTML = '<li class="text-sm text-gray-500 dark:text-gray-400">Nessuna scadenza imminente</li>';
        } else {
          upcomingEl.innerHTML = upcoming.map(task => `
            <li class="border-l-4 border-yellow-500 pl-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded" onclick="ModalsManager.openDetailsModal(${task.id}, false)">
              <div class="font-medium">${Utils.escapeHtml(task.title)}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Scadenza: ${Utils.formatDate(task.deadline)}</div>
            </li>
          `).join('');
        }
      }

      if (overdueEl) {
        if (overdue.length === 0) {
          overdueEl.innerHTML = '<li class="text-sm text-gray-500 dark:text-gray-400">Nessuna attività scaduta</li>';
        } else {
          overdueEl.innerHTML = overdue.map(task => `
            <li class="border-l-4 border-red-500 pl-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded" onclick="ModalsManager.openDetailsModal(${task.id}, false)">
              <div class="font-medium">${Utils.escapeHtml(task.title)}</div>
              <div class="text-sm text-red-500">Scaduta il: ${Utils.formatDate(task.deadline)}</div>
            </li>
          `).join('');
        }
      }
    },

    renderProjects: () => {
      const container = document.getElementById('projects-container');

      if (ProjectsManager.projects.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-8">Nessun progetto disponibile. Crea il tuo primo progetto!</p>';
        return;
      }

      let html = '<table class="w-full text-sm"><thead class="text-xs text-gray-500 dark:text-gray-400 uppercase"><tr>';
      html += '<th class="py-2 px-3 text-left">Nome Progetto</th>';
      html += '<th class="py-2 px-3 text-left">Project Manager</th>';
      html += '<th class="py-2 px-3 text-left">Stato</th>';
      html += '<th class="py-2 px-3 text-left">Date</th>';
      html += '<th class="py-2 px-3 text-right">Azioni</th>';
      html += '</tr></thead><tbody>';

      ProjectsManager.projects.forEach(project => {
        const statusColors = {
          'Attivo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          'In Pausa': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          'Completato': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };

        const progress = ProjectsManager.getProjectProgress(project.name);
        const projectTasks = ProjectsManager.getProjectTasks(project.name);
        const taskCount = projectTasks.length;
        const completedCount = projectTasks.filter(t => t.status === 'Fatto').length;

        html += `<tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
          <td class="py-1 px-3">
            <div class="font-medium">${Utils.escapeHtml(project.name)}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">${taskCount} attività (${completedCount} completate)</div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div class="bg-indigo-500 h-1.5 rounded-full progress-bar" style="width: ${progress}%"></div>
            </div>
          </td>
          <td class="py-1 px-3">${Utils.escapeHtml(project.manager) || '-'}</td>
          <td class="py-1 px-3">
            <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || ''}">${project.status}</span>
          </td>
          <td class="py-1 px-3">
            <div class="text-xs">${project.startDate ? Utils.formatDate(project.startDate) : '-'} - ${project.endDate ? Utils.formatDate(project.endDate) : '-'}</div>
          </td>
          <td class="py-1 px-3 text-right">
            <button onclick="ModalsManager.openProjectModal(${project.id})" class="text-blue-500 hover:text-blue-700 mr-2">
              <span class="material-icons text-base">edit</span>
            </button>
            <button onclick="ProjectsManager.deleteProject(${project.id}); ViewsManager.renderProjects();" class="text-red-500 hover:text-red-700">
              <span class="material-icons text-base">delete</span>
            </button>
          </td>
        </tr>`;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    },

    renderHistory: async () => {
      const container = document.getElementById('history-container');

      if (HistoryManager.historyLog.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-8">Nessuna modifica registrata.</p>';
        return;
      }

      const logs = [...HistoryManager.historyLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      let html = '<div class="space-y-4">';
      logs.forEach(log => {
        const changesHtml = Object.entries(log.changes).map(([field, change]) => {
          if (change.oldValue !== undefined) {
            return `<li><strong>${field}:</strong> ${Utils.escapeHtml(change.oldValue || '-')} → ${Utils.escapeHtml(change.newValue || '-')}</li>`;
          } else {
            return `<li><strong>${field}:</strong> ${Utils.escapeHtml(change.newValue || '-')}</li>`;
          }
        }).join('');

        html += `
          <div class="history-item bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="font-semibold">${log.action}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400"> - ${log.itemType} #${log.itemId}</span>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">${Utils.formatDate(log.timestamp)}</span>
            </div>
            <div class="text-sm mb-2">${Utils.escapeHtml(log.itemTitle)}</div>
            <ul class="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">${changesHtml}</ul>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    }
  };