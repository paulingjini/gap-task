const fs = require('fs').promises;
const path = require('path');

async function build() {
    console.log('🚀 Inizio del processo di build...');

    try {
        // 1. Leggi il template HTML principale
        let htmlContent = await fs.readFile('index.html', 'utf-8');
        console.log('✅ Letto index.html');

        // 2. Estrai la versione dal CHEANGELOG.md
        const changelog = await fs.readFile('CHEANGELOG.md', 'utf-8');
        const versionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);
        if (!versionMatch) {
            throw new Error('Impossibile trovare la versione nel CHEANGELOG.md');
        }
        const version = versionMatch[1];
        console.log(`✅ Versione trovata: ${version}`);

        // 3. Inline CSS
        const cssContent = await fs.readFile('styles.css', 'utf-8');
        htmlContent = htmlContent.replace(
            '<link rel="stylesheet" href="styles.css">',
            `<style>${cssContent}</style>`
        );
        console.log('✅ Inlined styles.css');

        // 4. Pre-carica i componenti HTML
        const componentsDir = 'components';
        const componentFiles = [
            'header.html',
            'views/tasks-view.html',
            'views/summary-view.html',
            'views/projects-view.html',
            'views/history-view.html',
            'modals/details-modal.html',
            'modals/project-modal.html',
            'modals/config-modal.html'
        ];

        const components = {};
        for (const file of componentFiles) {
            const componentName = path.basename(file, '.html').replace('-view', '').replace('-modal', '');
            const filePath = path.join(componentsDir, file);
            try {
                components[componentName] = await fs.readFile(filePath, 'utf-8');
            } catch (error) {
                console.warn(`⚠️ Componente non trovato: ${filePath}. Sarà ignorato.`);
                // Ignora i file non trovati per non bloccare la build
            }
        }
        console.log('✅ Pre-caricati i componenti HTML');

        // 5. Concatena i file JS
        const jsFiles = [
            'config.js',
            'database.js',
            'utils.js',
            'tasks.js',
            'subtasks.js',
            'projects.js',
            'history.js',
            'timers.js',
            'rendering.js',
            'modals.js',
            'views.js',
            'app.js',
            'init.js'
        ];

        let jsContent = '';

        // Sostituisci il loader con una versione statica
        const staticLoader = `
            const ComponentLoader = {
                components: ${JSON.stringify(components)},
                loadAll: async () => {
                    document.getElementById('header-container').innerHTML = ComponentLoader.components.header || '';
                    document.getElementById('view-tasks').innerHTML = ComponentLoader.components['tasks-view'] || '';
                    document.getElementById('view-summary').innerHTML = ComponentLoader.components['summary-view'] || '';
                    document.getElementById('view-projects').innerHTML = ComponentLoader.components['projects-view'] || '';
                    document.getElementById('view-history').innerHTML = ComponentLoader.components['history-view'] || '';

                    let modalsHTML = '';
                    if (ComponentLoader.components['task-details-modal']) modalsHTML += ComponentLoader.components['task-details-modal'];
                    if (ComponentLoader.components['project-modal']) modalsHTML += ComponentLoader.components['project-modal'];
                    if (ComponentLoader.components['field-config-modal']) modalsHTML += ComponentLoader.components['field-config-modal'];
                    document.getElementById('modals-container').innerHTML = modalsHTML;

                    return Promise.resolve();
                }
            };
        `;
        jsContent += staticLoader;
        console.log('✅ Creato loader statico');

        for (const file of jsFiles) {
            const filePath = path.join('js', file);
            jsContent += await fs.readFile(filePath, 'utf-8') + '\n\n';
        }
        console.log('✅ Concatenati i file JavaScript');

        // 6. Sostituisci gli script nel template HTML
        const scriptRegex = /<script src="js\/.*?"><\/script>/gs;
        htmlContent = htmlContent.replace(scriptRegex, ''); // Rimuovi tutti i vecchi script
        htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
        console.log('✅ Inserito il JavaScript combinato nell\'HTML');

        // Rimuovi il link al test.js se presente
        htmlContent = htmlContent.replace(/<script src="tests\/test.js"><\/script>/, '');

        // 7. Salva il file finale
        const outputFilename = `TaskManager.V${version}.html`;
        await fs.writeFile(outputFilename, htmlContent, 'utf-8');
        console.log(`🎉 Build completata! File salvato come: ${outputFilename}`);

    } catch (error) {
        console.error('❌ Errore durante il processo di build:', error);
    }
}

build();