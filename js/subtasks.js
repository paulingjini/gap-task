// Subtasks Management Module
const SubtasksManager = {
    subtasksMap: {},
  
    loadSubtasks: async () => {
      const allSubtasks = await DatabaseManager.getAll('subtasks');
      SubtasksManager.subtasksMap = {};
      allSubtasks.forEach(s => {
          if (!SubtasksManager.subtasksMap[s.parentId]) {
              SubtasksManager.subtasksMap[s.parentId] = [];
          }
          SubtasksManager.subtasksMap[s.parentId].push(s);
      });
    },
  
    addSubtask: async (parentId, subtaskData) => {
      let rootTask = TasksManager.tasks.find(t => t.id === parentId);
  
      if (!rootTask) {
          const allSubtasks = await DatabaseManager.getAll('subtasks');
          let currentParent = allSubtasks.find(s => s.id === parentId);
          if (currentParent) {
              while (currentParent && !currentParent.isRootTask) {
                  currentParent = allSubtasks.find(s => s.id === currentParent.parentId);
                  if (currentParent && !currentParent.parentId) {
                      rootTask = TasksManager.tasks.find(t => t.id === currentParent.id);
                      break;
                  }
              }
          }
      }
  
      if (rootTask) {
          subtaskData.project = rootTask.project;
      }
      
      subtaskData.parentId = parentId;
      subtaskData.createdAt = new Date().toISOString();
      subtaskData.completed = false;
      subtaskData.status = subtaskData.status || 'Da Fare';
      subtaskData.priority = subtaskData.priority || ''; 
      subtaskData.assignee = subtaskData.assignee || '';
      subtaskData.deadline = subtaskData.deadline || '';
      subtaskData.timeSpent = subtaskData.timeSpent || '00:00:00';
      subtaskData.tags = subtaskData.tags || [];
  
      await DatabaseManager.add('subtasks', subtaskData);
      await SubtasksManager.loadSubtasks();
      Utils.showNotification('Sub-attività aggiunta!', 'success');
    },
  
    getSubtasksRecursive: (parentId, currentLevel = 0, maxLevel = AppConfig.MAX_RECURSION_DEPTH) => {
        if (currentLevel >= maxLevel) {
            console.warn(`Max recursion level (${maxLevel}) reached for parentId ${parentId}. Stopping.`);
            return [];
        }
  
        const children = SubtasksManager.subtasksMap[parentId] || [];
        
        return children.map(subtask => {
            return {
                ...subtask,
                children: SubtasksManager.getSubtasksRecursive(subtask.id, currentLevel + 1, maxLevel)
            };
        });
    },
  
    toggleSubtask: async (subtaskId) => {
      const subtask = await DatabaseManager.get('subtasks', subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        subtask.status = subtask.completed ? 'Fatto' : 'Da Fare';
        await DatabaseManager.update('subtasks', subtask);
        await HistoryManager.logChange('subtasks', subtask);
      }
    },
  
    deleteSubtask: async (subtaskId) => {
      if (!confirm('Eliminare questa sub-attività e tutti i suoi sub-task annidati?')) {
        return;
      }
  
      const subtasksToDelete = [subtaskId];
      
      const findNested = (id) => {
          const children = SubtasksManager.subtasksMap[id] || [];
          children.forEach(child => {
              subtasksToDelete.push(child.id);
              findNested(child.id);
          });
      };
      findNested(subtaskId);
  
      try {
          for (const id of subtasksToDelete) {
              await DatabaseManager.delete('subtasks', id);
          }
          await SubtasksManager.loadSubtasks();
          Utils.showNotification('Sub-attività/e eliminata/e', 'success');
      } catch (error) {
          console.error('Error deleting subtask tree:', error);
          Utils.showNotification('Errore nell\'eliminazione della gerarchia sub-attività', 'danger');
      }
    },
  
    updateSubtask: async (subtaskData) => {
      subtaskData.updatedAt = new Date().toISOString();
      await DatabaseManager.update('subtasks', subtaskData);
      await HistoryManager.logChange('subtasks', subtaskData);
      await SubtasksManager.loadSubtasks();
    }
  };