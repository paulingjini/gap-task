// Utility Functions Module
const Utils = {
    formatDate: (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'short', day: 'numeric' });
    },
  
    formatSeconds: (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },
  
    parseTimeToSeconds: (timeStr) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':').map(p => parseInt(p) || 0);
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    },
  
    escapeHtml: (text) => {
      if (!text) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.toString().replace(/[&<>"']/g, m => map[m]);
    },
  
    renderMarkdown: (text) => {
      if (!text) return '';
      if (typeof marked !== 'undefined' && marked.parse) {
        return marked.parse(text);
      }
      return Utils.escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    },
  
    extractTagsAndOwners: (text) => {
        if (!text) return { tags: [], owners: [] };
        
        const tagRegex = /#\[([^\]]+)\]/g;
        const ownerRegex = /@\[([^\]]+)\]/g;
        
        const tags = [];
        const owners = [];
        
        let match;
  
        while ((match = tagRegex.exec(text)) !== null) {
            if (match[1]) tags.push(match[1].trim());
        }
  
        while ((match = ownerRegex.exec(text)) !== null) {
            if (match[1]) owners.push(match[1].trim());
        }
  
        const simpleTagRegex = /(?:\s|^)#(\w+)/g;
        while ((match = simpleTagRegex.exec(text)) !== null) {
            if (match[1]) tags.push(match[1].trim());
        }
        
        return {
            tags: Array.from(new Set(tags)).filter(t => t),
            owners: Array.from(new Set(owners)).filter(o => o)
        };
    },
  
    showNotification: (message, type = 'info') => {
      const colors = {
        success: 'bg-green-500',
        danger: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
      };
  
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
      notification.textContent = message;
      document.body.appendChild(notification);
  
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  };