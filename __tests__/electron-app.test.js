const path = require('path');
const fs = require('fs');

describe('Electron App Functionality', () => {
  describe('Main Process File', () => {
    test('should have main.js file', () => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test('should have preload.js file', () => {
      const preloadPath = path.join(__dirname, '..', 'electron', 'preload.js');
      expect(fs.existsSync(preloadPath)).toBe(true);
    });
  });

  describe('Window Configuration', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should create window with proper dimensions', () => {
      expect(mainContent).toContain('width: 1200');
      expect(mainContent).toContain('height: 800');
    });

    test('should have security settings enabled', () => {
      expect(mainContent).toContain('nodeIntegration: false');
      expect(mainContent).toContain('contextIsolation: true');
    });

    test('should set preload script', () => {
      expect(mainContent).toContain('preload: path.join(__dirname, \'preload.js\')');
    });

    test('should handle window closed event', () => {
      expect(mainContent).toContain('mainWindow.on(\'closed\'');
    });

    test('should prevent navigation to external URLs', () => {
      expect(mainContent).toContain('will-navigate');
    });

    test('should handle external links properly', () => {
      expect(mainContent).toContain('setWindowOpenHandler');
      expect(mainContent).toContain('shell.openExternal');
    });
  });

  describe('Menu Configuration', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should create application menu', () => {
      expect(mainContent).toContain('createMenu');
      expect(mainContent).toContain('Menu.buildFromTemplate');
    });

    test('should have File menu with New Game option', () => {
      expect(mainContent).toContain('label: \'ファイル\'');
      expect(mainContent).toContain('label: \'新しいゲーム\'');
      expect(mainContent).toContain('accelerator: \'CmdOrCtrl+N\'');
    });

    test('should have Edit menu', () => {
      expect(mainContent).toContain('label: \'編集\'');
      expect(mainContent).toContain('role: \'undo\'');
      expect(mainContent).toContain('role: \'redo\'');
    });

    test('should have View menu', () => {
      expect(mainContent).toContain('label: \'表示\'');
      expect(mainContent).toContain('role: \'reload\'');
      expect(mainContent).toContain('role: \'togglefullscreen\'');
    });

    test('should have Help menu', () => {
      expect(mainContent).toContain('label: \'ヘルプ\'');
      expect(mainContent).toContain('label: \'ゲームの遊び方\'');
    });

    test('should handle macOS specific menu', () => {
      expect(mainContent).toContain('process.platform === \'darwin\'');
    });
  });

  describe('IPC Communication', () => {
    let preloadContent;

    beforeAll(() => {
      const preloadPath = path.join(__dirname, '..', 'electron', 'preload.js');
      preloadContent = fs.readFileSync(preloadPath, 'utf8');
    });

    test('should expose electronAPI to renderer', () => {
      expect(preloadContent).toContain('contextBridge.exposeInMainWorld');
      expect(preloadContent).toContain('electronAPI');
    });

    test('should handle new-game event', () => {
      expect(preloadContent).toContain('onNewGame');
      expect(preloadContent).toContain('new-game');
    });

    test('should handle show-help event', () => {
      expect(preloadContent).toContain('onShowHelp');
      expect(preloadContent).toContain('show-help');
    });

    test('should provide removeAllListeners method', () => {
      expect(preloadContent).toContain('removeAllListeners');
    });
  });

  describe('App Lifecycle', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should handle app ready event', () => {
      expect(mainContent).toContain('app.whenReady()');
    });

    test('should handle app activate event for macOS', () => {
      expect(mainContent).toContain('app.on(\'activate\'');
    });

    test('should handle window-all-closed event', () => {
      expect(mainContent).toContain('app.on(\'window-all-closed\'');
    });

    test('should have security for web-contents-created', () => {
      expect(mainContent).toContain('app.on(\'web-contents-created\'');
    });
  });
});