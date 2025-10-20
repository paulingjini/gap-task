// History Management Module
const HistoryManager = {
    historyLog: [],

    loadHistory: async () => {
      HistoryManager.historyLog = await DatabaseManager.getAll('historyLog');
    },

    logChange: async (storeName, newData) => {
      try {
          const entityType = storeName.slice(0, -1);
          // We fetch the existing data to compare against.
          const existingData = await DatabaseManager.get(storeName, newData.id);

          let changes = {};
          let changed = false;
          let isCreation = false;

          // A new item is detected if it wasn't in the DB before, OR if its
          // creation and update timestamps are identical (a reliable sign of
          // a fresh record in this app's logic).
          if (!existingData || (newData.createdAt && newData.updatedAt && newData.createdAt === newData.updatedAt)) {
              isCreation = true;
          }

          if (isCreation) {
              changes = {};
              const fieldsToLog = ['title', 'status', 'priority', 'assignee', 'deadline', 'project'];
              fieldsToLog.forEach(field => {
                  if (newData[field] !== undefined && newData[field] !== null && newData[field] !== '') {
                      changes[field] = { oldValue: null, newValue: newData[field] };
                  }
              });
              changed = true;
          } else {
              // Standard update logic: compare fields.
              const fieldsToCompare = ['title', 'status', 'priority', 'assignee', 'deadline', 'project', 'timeSpent'];
              fieldsToCompare.forEach(field => {
                  const oldValue = existingData[field];
                  const newValue = newData[field];

                  if (field === 'timeSpent' && oldValue !== newValue && Utils.parseTimeToSeconds(oldValue) !== Utils.parseTimeToSeconds(newValue)) {
                      changes[field] = { oldValue: oldValue, newValue: newValue };
                      changed = true;
                  } else if (field !== 'timeSpent' && oldValue !== newValue && (oldValue !== undefined || newValue !== undefined)) {
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
                  action: isCreation ? 'Creazione' : 'Aggiornamento'
              };
              await DatabaseManager.add('historyLog', logEntry);
              await HistoryManager.loadHistory();
              // Also re-render the history view if it's active.
              if (document.getElementById('view-history')?.classList.contains('active')) {
                  await ViewsManager.renderHistory();
              }
          }
      } catch (error) {
          console.error('Error logging change:', error);
      }
    }
  };