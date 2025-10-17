// History Management Module
const HistoryManager = {
    historyLog: [],
  
    loadHistory: async () => {
      HistoryManager.historyLog = await DatabaseManager.getAll('historyLog');
    },
  
    logChange: async (storeName, newData) => {
      try {
          const entityType = storeName.slice(0, -1);
          const existingData = await DatabaseManager.get(storeName, newData.id);
          
          let changes = {};
          let changed = false;
          
          if (!existingData) {
              changes = { status: { newValue: 'Creato' } };
              changed = true;
          } else {
              const fieldsToCompare = ['title', 'status', 'priority', 'assignee', 'deadline', 'project', 'timeSpent'];
              fieldsToCompare.forEach(field => {
                  const oldValue = existingData[field];
                  const newValue = newData[field];
                  
                  if (field === 'timeSpent' && oldValue !== newValue && Utils.parseTimeToSeconds(oldValue) !== Utils.parseTimeToSeconds(newValue)) {
                      changes[field] = { oldValue: oldValue, newValue: newValue };
                      changed = true;
                  } else if (field !== 'timeSpent' && oldValue !== newValue) {
                      changes[field] = { oldValue: oldValue, newValue: newValue };
                      changed = true;
                  }
              });
              
              if (entityType === 'subtask' && existingData.completed !== newData.completed) {
                  changes.completed = { oldValue: existingData.completed, newValue: newData.completed };
                  changed = true;
              }
          }
  
          if (changed) {
              const logEntry = {
                  itemId: newData.id,
                  itemTitle: newData.title,
                  itemType: entityType,
                  parentId: newData.parentId || null,
                  timestamp: new Date().toISOString(),
                  changes: changes,
                  action: existingData ? 'Aggiornamento' : 'Creazione'
              };
              await DatabaseManager.add('historyLog', logEntry);
              await HistoryManager.loadHistory();
          }
      } catch (error) {
          console.error('Error logging change:', error);
      }
    }
  };