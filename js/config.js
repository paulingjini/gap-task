// Global Configuration
const AppConfig = {
    DB_NAME: 'TaskManagementDB',
    DB_VERSION: 4,
    
    DEFAULT_CONFIG: {
      groupBy: 'project',
      tasksPerPage: 15,
      fontFamily: 'Inter',
      fontSize: 'medium'
    },
    
    FIELD_DOMAINS: {
      Stati: ['Da Fare', 'In Corso', 'In Revisione', 'Fatto', 'Bloccato', 'In Attesa'],
      Priorità: ['Bassa', 'Media', 'Alta', 'Urgente'],
      Categorie: ['Sviluppo', 'Design', 'Marketing', 'Amministrazione', 'Supporto']
    },
    
    STATUS_COLORS: {
      'Da Fare': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'In Corso': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 status-in-progress',
      'In Revisione': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Fatto': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Bloccato': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'In Attesa': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    
    PRIORITY_COLORS: {
      'Bassa': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Media': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Alta': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Urgente': 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
    },
    
    PRIORITY_ORDER: {
      'Urgente': 4,
      'Alta': 3,
      'Media': 2,
      'Bassa': 1,
      '': 0
    },
    
    MAX_RECURSION_DEPTH: 3
  };