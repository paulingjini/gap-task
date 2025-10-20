const { test, expect } = require('@playwright/test');

test.describe('Task Management App', () => {
  // This hook now only resets the database, ensuring a clean state for each test.
  // Demo data will be created by each test that needs it.
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.evaluate(() => window.App.reset());
    await page.waitForFunction(() => window.dbInitialized);
  });

  test('should load the app and display tasks', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    await expect(page.locator('#view-tasks h2').first()).toHaveText('Tasks');
    await expect(page.locator('#tasks-container .task-row-content')).not.toHaveCount(0);
  });

  test('should create a new task', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    const newTaskTitle = 'My New E2E Test Task';
    await page.click('button:has-text("Add Task")');

    await page.waitForSelector('#details-modal.active');

    await page.evaluate((title) => {
      document.getElementById('details-field-title').textContent = title;
    }, newTaskTitle);

    await page.locator('#details-modal button[type="submit"]').click();
    await page.waitForSelector('#details-modal', { state: 'hidden' });

    await expect(page.locator('#tasks-container').locator(`text=${newTaskTitle}`)).toBeVisible();
  });

  test('should edit a task by inline editing', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    const editedTaskTitle = 'My Edited E2E Test Task';

    await page.locator('.task-title-cell').first().dblclick();

    const titleInput = page.locator('.task-title-cell input[type="text"]').first();
    await titleInput.fill(editedTaskTitle);
    await titleInput.press('Enter');

    await page.waitForSelector('.task-title-cell input[type="text"]', { state: 'hidden' });
    await expect(page.locator(`text=${editedTaskTitle}`)).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    const taskRow = page.locator('.task-row-content').first();
    const taskTitle = await taskRow.locator('.title-text').first().textContent();

    page.on('dialog', dialog => dialog.accept());

    await taskRow.locator('button[title="Elimina"]').click();

    await page.waitForTimeout(500);

    await expect(page.locator(`#tasks-container .task-row-content:has-text("${taskTitle}")`)).not.toBeVisible();
  });

  test('should display the summary view', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    await page.click('#btn-summary');
    await expect(page.locator('#view-summary.view-container.active')).toBeVisible();
    await expect(page.locator('#stat-complete')).not.toHaveText('0');
  });

  test('should display the projects view and create a new project', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    await page.click('#btn-projects');
    await expect(page.locator('#view-projects.view-container.active')).toBeVisible();

    const newProjectName = 'New E2E Project';
    await page.click('button:has-text("Add Project")');
    await page.waitForSelector('#project-modal.active');
    await page.fill('#project-name', newProjectName);
    await page.click('#project-modal button[type="submit"]');
    await page.waitForSelector('#project-modal', { state: 'hidden' });
    await expect(page.locator(`text=${newProjectName}`)).toBeVisible();
  });

  test('should create a history entry when a new task is added', async ({ page }) => {
    await page.evaluate(() => window.App.createDemoData());
    const taskForHistory = 'A Task Just for History';

    // Create a task to generate a history log
    await page.click('button:has-text("Add Task")');
    await page.waitForSelector('#details-modal.active');
    await page.evaluate((title) => {
      document.getElementById('details-field-title').textContent = title;
    }, taskForHistory);
    await page.locator('#details-modal button[type="submit"]').click();
    await page.waitForSelector('#details-modal', { state: 'hidden' });

    // Navigate to history and check for the log
    await page.click('#btn-history');
    await expect(page.locator('#view-history.view-container.active')).toBeVisible();
    // The history will contain more than one entry now because of the demo data.
    // The most important thing is that the new task is in the history.
    await expect(page.locator('#history-container .history-item')).not.toHaveCount(0);

    // Check that the title of that item is correct. This is a more robust selector
    // that first finds the specific history item, then the title within it.
    const historyItem = page.locator('.history-item', { hasText: taskForHistory });
    await expect(historyItem).toHaveCount(1);

    const titleInItem = historyItem.locator('div.text-sm.mb-2');
    await expect(titleInItem).toHaveText(taskForHistory);
    await expect(titleInItem).toBeVisible();
  });
});