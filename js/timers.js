// Timers Management Module
const TimersManager = {
    timerInterval: null,
    timerStartTime: null,
    currentTaskTime: 0,
    
    subtaskTimerInterval: null,
    activeSubtaskId: null,
  
    toggleTimer: async (taskId) => {
        if (TimersManager.activeSubtaskId && !TimersManager.timerInterval) {
            await TimersManager.toggleSubtaskTimer();
        }
        
        if (!taskId) return;
  
        const task = await DatabaseManager.get('tasks', taskId);
        if (!task) return;
        
        const btn = document.getElementById(`timer-btn-${taskId}`);
        const timeDisplayEl = document.getElementById(`time-display-${taskId}`);
        
        if (TimersManager.timerInterval && TimersManager.activeSubtaskId === taskId) {
            clearInterval(TimersManager.timerInterval);
            TimersManager.timerInterval = null;
            TimersManager.activeSubtaskId = null;
  
            task.timeSpent = Utils.formatSeconds(TimersManager.currentTaskTime);
            await TasksManager.updateTask(task);
            
            if (btn) {
                btn.innerHTML = '<span class="material-icons text-base">play_arrow</span>';
                btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'timer-running');
                btn.classList.add('bg-green-500', 'hover:bg-green-600');
            }
            Utils.showNotification('Timer attività principale fermato', 'info');
        } else {
            if (TimersManager.timerInterval) {
               Utils.showNotification('Un altro timer principale è già in esecuzione.', 'warning');
               return;
            }
            
            TimersManager.currentTaskTime = Utils.parseTimeToSeconds(task.timeSpent || '00:00:00');
            TimersManager.timerStartTime = Date.now() - (TimersManager.currentTaskTime * 1000);
            TimersManager.activeSubtaskId = taskId;
  
            TimersManager.timerInterval = setInterval(() => {
                TimersManager.currentTaskTime = Math.floor((Date.now() - TimersManager.timerStartTime) / 1000);
                const formattedTime = Utils.formatSeconds(TimersManager.currentTaskTime);
                
                const tableCellDisplay = document.getElementById(`time-display-${taskId}`);
                if (tableCellDisplay) tableCellDisplay.textContent = formattedTime;
  
                if (timeDisplayEl) timeDisplayEl.value = formattedTime;
            }, 1000);
            
            if (btn) {
                btn.innerHTML = '<span class="material-icons text-base">pause</span>';
                btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                btn.classList.add('bg-red-500', 'hover:bg-red-600', 'timer-running');
            }
            Utils.showNotification('Timer attività principale avviato', 'success');
        }
    },
  
    toggleSubtaskTimer: async (subtaskId = null) => {
        const targetId = subtaskId || TimersManager.activeSubtaskId;
        if (!targetId) return;
  
        const subtask = await DatabaseManager.get('subtasks', targetId);
        if (!subtask) return;
  
        if (TimersManager.timerInterval) {
            Utils.showNotification('Ferma prima il timer del task principale.', 'warning');
            return;
        }
        
        const btn = document.getElementById(`timer-btn-${targetId}`);
        
        if (TimersManager.activeSubtaskId === targetId && TimersManager.subtaskTimerInterval) {
            clearInterval(TimersManager.subtaskTimerInterval);
            TimersManager.subtaskTimerInterval = null;
            TimersManager.activeSubtaskId = null;
  
            const finalTimeSeconds = Utils.parseTimeToSeconds(btn.dataset.currenttime);
  
            subtask.timeSpent = Utils.formatSeconds(finalTimeSeconds);
            await SubtasksManager.updateSubtask(subtask);
            
            if (btn) {
                btn.innerHTML = '<span class="material-icons text-base">play_arrow</span>';
                btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'timer-running');
                btn.classList.add('bg-green-500', 'hover:bg-green-600');
            }
            Utils.showNotification(`Timer sub-attività fermato: ${subtask.title}`, 'info');
  
        } else if (TimersManager.activeSubtaskId && TimersManager.activeSubtaskId !== targetId) {
            Utils.showNotification(`Ferma prima il timer sulla sub-attività #${TimersManager.activeSubtaskId}.`, 'warning');
            return;
        } else {
            const initialTimeSeconds = Utils.parseTimeToSeconds(subtask.timeSpent || '00:00:00');
            const startTime = Date.now() - (initialTimeSeconds * 1000);
            TimersManager.activeSubtaskId = targetId;
  
            TimersManager.subtaskTimerInterval = setInterval(() => {
                const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                const formattedTime = Utils.formatSeconds(elapsedSeconds);
                
                const rowTimerDisplay = document.getElementById(`time-display-${targetId}`);
                
                if (rowTimerDisplay) rowTimerDisplay.textContent = formattedTime;
                if (btn) btn.dataset.currenttime = elapsedSeconds;
  
            }, 1000);
  
            if (btn) {
                btn.innerHTML = '<span class="material-icons text-base">pause</span>';
                btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                btn.classList.add('bg-red-500', 'hover:bg-red-600', 'timer-running');
            }
            Utils.showNotification(`Timer sub-attività avviato: ${subtask.title}`, 'success');
        }
    }
  };