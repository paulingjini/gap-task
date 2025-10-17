// Initialization Script
window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione applicazione...');
    
    setTimeout(function() {
      console.log('✓ Tailwind CSS caricato');
      
      // Initialize app
      App.initialize().then(() => {
        console.log('✅ Applicazione pronta!');
        
        // Check if initial load is empty, then prompt for demo data
        if (TasksManager.tasks.length === 0 && ProjectsManager.projects.length === 0) {
            setTimeout(() => {
              if (confirm('👋 Benvenuto! Vuoi caricare alcuni dati demo per iniziare?')) {
                App.createDemoData();
              }
            }, 1000);
          }
      }).catch(error => {
        console.error('❌ Errore inizializzazione:', error);
      });
      
    }, 100);
  });
  
  console.log('%c📋 Task Management App v2.8 (Modulare)', 'color: #4F46E5; font-size: 16px; font-weight: bold;');
  console.log('%cApp caricata con successo!', 'color: #10B981;');
  console.log('%c💡 Usa App.createDemoData() per caricare dati di esempio', 'color: #6B7280;');