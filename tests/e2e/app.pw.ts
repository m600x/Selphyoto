import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TINY_PNG_PATH = path.join(__dirname, 'fixtures', 'tiny.png');

test.beforeAll(() => {
  const fixtureDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
  if (!fs.existsSync(TINY_PNG_PATH)) {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0BFwMgwasCoAgBDBQIA/1UDQQAAAABJRU5ErkJggg==';
    fs.writeFileSync(TINY_PNG_PATH, Buffer.from(pngBase64, 'base64'));
  }
});

async function addImageViaButton(page: Page) {
  await expandSidebar(page);
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#import-btn'),
  ]);
  await fileChooser.setFiles(TINY_PNG_PATH);
  await page.waitForSelector('.layer-row');
}

async function expandSidebar(page: Page) {
  const panel = page.locator('#layer-panel');
  if (await panel.evaluate(el => el.classList.contains('collapsed'))) {
    await page.click('#sidebar-drawer-toggle');
    await expect(panel).not.toHaveClass(/collapsed/);
  }
}
async function expandSettingsPanel(page: Page) {
  const panel = page.locator('#settings-panel');
  if (await panel.evaluate(el => el.classList.contains('collapsed'))) {
    await page.click('#settings-drawer-toggle');
    await expect(panel).not.toHaveClass(/collapsed/);
  }
}

test.describe('Page load', () => {
  test('title and toolbar are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#sidebar-title')).toContainText("Selph'Yoto");
    await expect(page.locator('#toolbar')).toBeVisible();
  });

  test('empty layer message is shown initially', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await expect(page.locator('#layer-empty')).toBeVisible();
  });

  test('export and clear buttons are disabled when empty', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await expect(page.locator('#export-btn')).toBeDisabled();
    await expect(page.locator('#clear-canvas-btn')).toBeDisabled();
  });

  test('outline button defaults to ON', async ({ page }) => {
    await page.goto('/');
    await expandSettingsPanel(page);
    await expect(page.locator('#outline-btn')).toHaveText('ON');
  });

  test('correction inputs have default values', async ({ page }) => {
    await page.goto('/');
    await expandSettingsPanel(page);
    await expect(page.locator('#correction-x')).toHaveValue('0.961');
    await expect(page.locator('#correction-y')).toHaveValue('0.961');
  });

  test('app version is displayed', async ({ page }) => {
    await page.goto('/');
    const versionText = await page.locator('#app-version').textContent();
    expect(versionText).toMatch(/^M600/);
  });

  test('undo and redo buttons are disabled initially', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#undo-btn')).toBeDisabled();
    await expect(page.locator('#redo-btn')).toBeDisabled();
  });
});

test.describe('Add image', () => {
  test('add image via button creates a layer row', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await expect(page.locator('.layer-row')).toHaveCount(1);
    await expect(page.locator('#layer-empty')).not.toBeVisible();
  });

  test('export button is enabled after adding visible image', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await expect(page.locator('#export-btn')).toBeEnabled();
  });

  test('clear canvas button is enabled after adding image', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await expect(page.locator('#clear-canvas-btn')).toBeEnabled();
  });
});

test.describe('Layer operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
  });

  test('toggle visibility hides and shows layer', async ({ page }) => {
    const visBtn = page.locator('.layer-row .vis-btn').first();
    await visBtn.click();
    await expect(visBtn).toHaveClass(/hidden/);
    await visBtn.click();
    await expect(visBtn).not.toHaveClass(/hidden/);
  });

  test('toggle lock changes lock state', async ({ page }) => {
    const lockBtn = page.locator('.layer-row .lock-btn').first();
    await expect(lockBtn).not.toHaveClass(/locked/);
    await lockBtn.click();
    await expect(lockBtn).toHaveClass(/locked/);
    await lockBtn.click();
    await expect(lockBtn).not.toHaveClass(/locked/);
  });

  test('delete with confirmation removes layer', async ({ page }) => {
    await page.locator('.layer-row .del-btn').first().click();
    await expect(page.locator('#confirm-modal-overlay')).not.toHaveClass(/hidden/);
    await page.click('#confirm-modal-ok');
    await expect(page.locator('.layer-row')).toHaveCount(0);
    await expect(page.locator('#layer-empty')).toBeVisible();
  });

  test('delete cancel keeps the layer', async ({ page }) => {
    await page.locator('.layer-row .del-btn').first().click();
    await expect(page.locator('#confirm-modal-overlay')).not.toHaveClass(/hidden/);
    await page.click('#confirm-modal-cancel');
    await expect(page.locator('.layer-row')).toHaveCount(1);
  });

  test('rename via double-click', async ({ page }) => {
    const name = page.locator('.layer-row .layer-name').first();
    await name.dblclick();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('renamed.png');
    await page.keyboard.press('Enter');
    await expect(name).toHaveText('renamed.png');
  });
});

test.describe('Settings', () => {
  test('change background color', async ({ page }) => {
    await page.goto('/');
    await expandSettingsPanel(page);
    const blackBtn = page.locator('.bg-btn[data-bg="#000000"]');
    await blackBtn.click();
    await expect(blackBtn).toHaveClass(/active/);
  });

  test('change cutting marks color', async ({ page }) => {
    await page.goto('/');
    await expandSettingsPanel(page);
    const yellowBtn = page.locator('.mark-btn[data-mark="#cccc00"]');
    await yellowBtn.click();
    await expect(yellowBtn).toHaveClass(/active/);
  });

  test('toggle outline', async ({ page }) => {
    await page.goto('/');
    await expandSettingsPanel(page);
    const btn = page.locator('#outline-btn');
    await expect(btn).toHaveText('ON');
    await btn.click();
    await expect(btn).toHaveText('OFF');
    await btn.click();
    await expect(btn).toHaveText('ON');
  });

  test('modify correction factor X', async ({ page }) => {
    await page.goto('/');
    await expandSettingsPanel(page);
    const input = page.locator('#correction-x');
    await input.fill('0.95');
    await input.dispatchEvent('change');
    await expect(input).toHaveValue('0.95');
  });
});

test.describe('Group operations', () => {
  test('create group adds a group header', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    await expect(page.locator('.group-header')).toHaveCount(1);
    await expect(page.locator('.group-name').first()).toHaveText('Group 1');
  });

  test('rename group via double-click', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    const name = page.locator('.group-name').first();
    await name.dblclick();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('My Group');
    await page.keyboard.press('Enter');
    await expect(name).toHaveText('My Group');
  });

  test('delete group removes it', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    await page.locator('.group-header .del-btn').first().click();
    await expect(page.locator('.group-header')).toHaveCount(0);
  });
});

test.describe('Export image', () => {
  test('export triggers a download with correct filename pattern', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-btn'),
    ]);

    expect(download.suggestedFilename()).toMatch(/^selphyoto_exported_\d{8}_\d{6}\.png$/);
  });

  test('export as JPEG via dropdown', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);

    await page.click('#export-dropdown-btn');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('.split-btn-option[data-format="jpeg"]'),
    ]);

    expect(download.suggestedFilename()).toMatch(/^selphyoto_exported_\d{8}_\d{6}\.jpg$/);
  });
});

test.describe('Project save/load', () => {
  test('export project triggers zip download', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await expandSettingsPanel(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#save-project-btn'),
    ]);

    expect(download.suggestedFilename()).toMatch(/^selphyoto_project_\d{8}_\d{6}\.zip$/);
  });
});

test.describe('Clear canvas', () => {
  test('clear canvas with confirmation removes everything', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.click('#new-group-btn');

    await page.click('#clear-canvas-btn');
    await expect(page.locator('#confirm-modal-overlay')).not.toHaveClass(/hidden/);
    await page.click('#confirm-modal-ok');

    await expect(page.locator('.layer-row')).toHaveCount(0);
    await expect(page.locator('.group-header')).toHaveCount(0);
    await expect(page.locator('#layer-empty')).toBeVisible();
    await expect(page.locator('#export-btn')).toBeDisabled();
  });

  test('clear canvas cancel preserves state', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);

    await page.click('#clear-canvas-btn');
    await expect(page.locator('#confirm-modal-overlay')).not.toHaveClass(/hidden/);
    await page.click('#confirm-modal-cancel');

    await expect(page.locator('.layer-row')).toHaveCount(1);
  });
});

test.describe('Keyboard shortcuts', () => {
  test('Delete key removes selected image with confirmation', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);

    await page.locator('.layer-row').first().click();
    await page.keyboard.press('Delete');

    await expect(page.locator('#confirm-modal-overlay')).not.toHaveClass(/hidden/);
    await page.click('#confirm-modal-ok');
    await expect(page.locator('.layer-row')).toHaveCount(0);
  });
});

test.describe('Auto-save', () => {
  test('added image persists after reload', async ({ page, context }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await addImageViaButton(page);

    await page.waitForTimeout(2500);

    const newPage = await context.newPage();
    await newPage.goto(page.url(), { waitUntil: 'domcontentloaded' });
    await page.close();

    await newPage.waitForFunction(
      () => document.readyState === 'complete' && !!document.querySelector('#layer-panel'),
      { timeout: 15000, polling: 500 },
    );
    await newPage.waitForTimeout(3000);

    const panel = newPage.locator('#layer-panel');
    if (await panel.evaluate(el => el.classList.contains('collapsed'))) {
      await newPage.click('#sidebar-drawer-toggle');
      await expect(panel).not.toHaveClass(/collapsed/);
    }

    await expect(newPage.locator('.layer-row')).toHaveCount(1);
  });
});

test.describe('Autosave status', () => {
  test('shows autosave timestamp after interaction', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.waitForTimeout(1500);
    const text = await page.locator('#autosave-status').textContent();
    expect(text).toMatch(/^Autosaved/);
  });

  test('shows dash after clear canvas', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.waitForTimeout(1500);

    await page.click('#clear-canvas-btn');
    await page.click('#confirm-modal-ok');
    await expect(page.locator('#autosave-status')).toHaveText('-');
  });
});

test.describe('Undo / Redo', () => {
  test('undo button becomes enabled after adding an image', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#undo-btn')).toBeDisabled();
    await addImageViaButton(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#undo-btn')).toBeEnabled();
  });

  test('undo after group creation removes the group', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    await expect(page.locator('.group-header')).toHaveCount(1);
    await page.waitForTimeout(100);

    await page.click('#undo-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.group-header')).toHaveCount(0);
  });

  test('redo restores after undo', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    await expect(page.locator('.group-header')).toHaveCount(1);
    await page.waitForTimeout(100);

    await page.click('#undo-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.group-header')).toHaveCount(0);

    await page.click('#redo-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.group-header')).toHaveCount(1);
  });

  test('Ctrl+Z triggers undo', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    await expect(page.locator('.group-header')).toHaveCount(1);
    await page.waitForTimeout(100);

    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(500);
    await expect(page.locator('.group-header')).toHaveCount(0);
  });

  test('Ctrl+Y triggers redo', async ({ page }) => {
    await page.goto('/');
    await expandSidebar(page);
    await page.click('#new-group-btn');
    await page.waitForTimeout(100);

    await page.keyboard.press('ControlOrMeta+z');
    await page.waitForTimeout(500);

    await page.keyboard.press('ControlOrMeta+y');
    await page.waitForTimeout(500);
    await expect(page.locator('.group-header')).toHaveCount(1);
  });

  test('background color change does not enable undo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#undo-btn')).toBeDisabled();
    await expandSettingsPanel(page);
    await page.click('.bg-btn[data-bg="#000000"]');
    await page.waitForTimeout(100);
    await expect(page.locator('#undo-btn')).toBeDisabled();
  });

  test('outline toggle does not enable undo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#undo-btn')).toBeDisabled();
    await expandSettingsPanel(page);
    await page.click('#outline-btn');
    await page.waitForTimeout(100);
    await expect(page.locator('#undo-btn')).toBeDisabled();
  });

  test('undo after delete restores the image', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.waitForTimeout(300);

    await page.locator('.layer-row .del-btn').first().click();
    await page.click('#confirm-modal-ok');
    await expect(page.locator('.layer-row')).toHaveCount(0);

    await page.click('#undo-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.layer-row')).toHaveCount(1);
  });

  test('clear canvas disables undo/redo', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.waitForTimeout(300);

    await page.click('#clear-canvas-btn');
    await page.click('#confirm-modal-ok');
    await page.waitForTimeout(300);

    await expect(page.locator('#undo-btn')).toBeDisabled();
    await expect(page.locator('#redo-btn')).toBeDisabled();
  });

  test('clear canvas is enabled when canvas is empty but history exists', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.waitForTimeout(300);

    await page.locator('.layer-row .del-btn').first().click();
    await page.click('#confirm-modal-ok');
    await expect(page.locator('.layer-row')).toHaveCount(0);

    await expect(page.locator('#clear-canvas-btn')).toBeEnabled();
  });

  test('clear canvas after undo fully resets history in IDB', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);
    await page.waitForTimeout(300);

    await page.click('#clear-canvas-btn');
    await page.click('#confirm-modal-ok');
    await page.waitForTimeout(500);

    await addImageViaButton(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#undo-btn')).toBeEnabled();

    await page.click('#undo-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.layer-row')).toHaveCount(0);

    const hasOldImages = await page.evaluate(() => {
      return document.querySelectorAll('.layer-row').length;
    });
    expect(hasOldImages).toBe(0);
  });
});

test.describe('Locked image', () => {
  test('delete button is disabled when image is locked', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);

    const lockBtn = page.locator('.layer-row .lock-btn').first();
    await lockBtn.click();
    await expect(lockBtn).toHaveClass(/locked/);

    const delBtn = page.locator('.layer-row .del-btn').first();
    await expect(delBtn).toBeDisabled();
  });

  test('delete button is re-enabled when image is unlocked', async ({ page }) => {
    await page.goto('/');
    await addImageViaButton(page);

    const lockBtn = page.locator('.layer-row .lock-btn').first();
    await lockBtn.click();
    await expect(page.locator('.layer-row .del-btn').first()).toBeDisabled();

    await lockBtn.click();
    await expect(page.locator('.layer-row .del-btn').first()).toBeEnabled();
  });
});
