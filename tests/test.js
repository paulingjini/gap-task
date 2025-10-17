// Automated Test Suite
const TestRunner = {
    run: async () => {
        console.group('%c🚀 Esecuzione Test Automatici...', 'font-size: 16px; color: #1E40AF;');

        await TestRunner.testTaskManagement();
        await TestRunner.testProjectManagement();
        await TestRunner.testSubtaskManagement();
        await TestRunner.testImportExport();

        console.groupEnd();
    },

    testTaskManagement: async () => {
        console.group('🧪 Test Gestione Task');

        // Crea un nuovo task
        const newTask = {
            title: 'Test Task',
            status: 'Da Fare',
            priority: 'Media',
            assignee: 'Test User',
            project: 'Test Project',
            deadline: '2025-12-31',
            description: 'Test Description',
            tags: ['Test'],
            owners: [],
            notes: [],
            timeSpent: '00:00:00'
        };
        const taskId = await TasksManager.createTask(newTask);
        console.assert(taskId > 0, 'Creazione task fallita');

        // Leggi il task
        let task = await DatabaseManager.get('tasks', taskId);
        console.assert(task.title === 'Test Task', 'Lettura task fallita');

        // Aggiorna il task
        task.title = 'Test Task Updated';
        await TasksManager.updateTask(task);
        task = await DatabaseManager.get('tasks', taskId);
        console.assert(task.title === 'Test Task Updated', 'Aggiornamento task fallito');

        // Elimina il task
        await TasksManager.deleteTask(taskId);
        task = await DatabaseManager.get('tasks', taskId);
        console.assert(task === undefined, 'Eliminazione task fallita');

        console.groupEnd();
    },

    testProjectManagement: async () => {
        console.group('🧪 Test Gestione Progetti');

        // Crea un nuovo progetto
        const newProject = {
            name: 'Test Project',
            manager: 'Test Manager',
            status: 'Attivo',
            startDate: '2025-01-01',
            endDate: '2025-12-31'
        };
        const projectId = await ProjectsManager.createProject(newProject);
        console.assert(projectId > 0, 'Creazione progetto fallita');

        // Leggi il progetto
        let project = await DatabaseManager.get('projects', projectId);
        console.assert(project.name === 'Test Project', 'Lettura progetto fallita');

        // Aggiorna il progetto
        project.name = 'Test Project Updated';
        await ProjectsManager.updateProject(project);
        project = await DatabaseManager.get('projects', projectId);
        console.assert(project.name === 'Test Project Updated', 'Aggiornamento progetto fallito');

        // Elimina il progetto
        await ProjectsManager.deleteProject(projectId);
        project = await DatabaseManager.get('projects', projectId);
        console.assert(project === undefined, 'Eliminazione progetto fallita');

        console.groupEnd();
    },

    testSubtaskManagement: async () => {
        console.group('🧪 Test Gestione Subtask');

        // Crea un task padre
        const parentTask = {
            title: 'Parent Task',
            status: 'Da Fare',
            priority: 'Media',
            assignee: 'Test User',
            project: 'Test Project',
            deadline: '2025-12-31',
            description: 'Parent Task Description',
            tags: ['Test'],
            owners: [],
            notes: [],
            timeSpent: '00:00:00'
        };
        const parentId = await TasksManager.createTask(parentTask);

        // Crea un subtask
        const subtask = {
            title: 'Test Subtask',
            status: 'Da Fare',
            priority: 'Media',
            assignee: 'Test User',
            timeSpent: '00:00:00'
        };
        const subtaskId = await SubtasksManager.addSubtask(parentId, subtask);
        console.assert(subtaskId > 0, 'Creazione subtask fallita');

        // Leggi il subtask
        let subtaskData = await DatabaseManager.get('subtasks', subtaskId);
        console.assert(subtaskData.title === 'Test Subtask', 'Lettura subtask fallita');

        // Aggiorna il subtask
        subtaskData.title = 'Test Subtask Updated';
        await SubtasksManager.updateSubtask(subtaskData);
        subtaskData = await DatabaseManager.get('subtasks', subtaskId);
        console.assert(subtaskData.title === 'Test Subtask Updated', 'Aggiornamento subtask fallito');

        // Elimina il subtask
        await SubtasksManager.deleteSubtask(subtaskId);
        subtaskData = await DatabaseManager.get('subtasks', subtaskId);
        console.assert(subtaskData === undefined, 'Eliminazione subtask fallita');

        // Elimina il task padre
        await TasksManager.deleteTask(parentId);

        console.groupEnd();
    },

    testImportExport: async () => {
        console.group('🧪 Test Import/Export');

        // Crea dati di test
        await App.createDemoData();

        // Esporta i dati
        await Utils.exportData();

        // Importa i dati
        // Simula la selezione di un file
        const data = await DatabaseManager.getAll('tasks');
        const blob = new Blob([JSON.stringify({ tasks: data })], { type: 'application/json' });
        const file = new File([blob], 'test.json', { type: 'application/json' });
        const event = { target: { files: [file] } };
        await Utils.importData(event);

        console.groupEnd();
    }
};

// Esegui i test dopo l'inizializzazione dell'app
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        TestRunner.run();
    }, 2000);
});