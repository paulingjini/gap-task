// Projects Management Module
const ProjectsManager = {
    projects: [],
  
    loadProjects: async () => {
      ProjectsManager.projects = await DatabaseManager.getAll('projects');
    },
  
    createProject: async (projectData) => {
      const project = {
        ...projectData,
        createdAt: new Date().toISOString()
      };
      
      await DatabaseManager.add('projects', project);
      await ProjectsManager.loadProjects();
      Utils.showNotification('Progetto creato', 'success');
    },
  
    updateProject: async (projectData) => {
      projectData.updatedAt = new Date().toISOString();
      await DatabaseManager.update('projects', projectData);
      await ProjectsManager.loadProjects();
      Utils.showNotification('Progetto aggiornato', 'success');
    },
  
    deleteProject: async (projectId) => {
      if (!confirm('Eliminare questo progetto?')) {
        return;
      }
  
      await DatabaseManager.delete('projects', projectId);
      await ProjectsManager.loadProjects();
      Utils.showNotification('Progetto eliminato', 'success');
    },
  
    getProjectTasks: (projectName) => {
      return TasksManager.tasks.filter(t => t.project === projectName);
    },
  
    getProjectProgress: (projectName) => {
      const tasks = ProjectsManager.getProjectTasks(projectName);
      if (tasks.length === 0) return 0;
      
      const completed = tasks.filter(t => t.status === 'Fatto').length;
      return (completed / tasks.length) * 100;
    }
  };