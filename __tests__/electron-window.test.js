const path = require('path');
const fs = require('fs');

describe('Electron Window Management', () => {
  describe('Window Features', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should set window title', () => {
      expect(mainContent).toContain('title: \'フルーツハーベストゲーム\'');
    });

    test('should set window icon', () => {
      expect(mainContent).toContain('icon: path.join(__dirname');
    });

    test('should load correct URL in development', () => {
      expect(mainContent).toContain('isDev');
      expect(mainContent).toContain('http://localhost:3000');
    });

    test('should load correct file in production', () => {
      expect(mainContent).toContain('mainWindow.loadFile');
      expect(mainContent).toContain('../out/index.html');
    });

    test('should open DevTools in development', () => {
      expect(mainContent).toContain('mainWindow.webContents.openDevTools()');
    });

    test('should handle window state properly', () => {
      expect(mainContent).toContain('mainWindow = null');
    });

    test('should prevent multiple instances on macOS', () => {
      expect(mainContent).toContain('BrowserWindow.getAllWindows()');
    });
  });

  describe('Security Features', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should prevent navigation to unauthorized URLs', () => {
      expect(mainContent).toContain('event.preventDefault()');
    });

    test('should handle new window requests securely', () => {
      expect(mainContent).toContain('action: \'deny\'');
    });

    test('should use context isolation', () => {
      expect(mainContent).toContain('contextIsolation: true');
    });

    test('should disable node integration', () => {
      expect(mainContent).toContain('nodeIntegration: false');
    });
  });

  describe('Menu Shortcuts', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should have New Game shortcut', () => {
      expect(mainContent).toContain('CmdOrCtrl+N');
    });

    test('should have Quit shortcut', () => {
      expect(mainContent).toContain('Ctrl+Q');
      expect(mainContent).toContain('Cmd+Q');
    });

    test('should have Reload shortcut', () => {
      expect(mainContent).toContain('CmdOrCtrl+R');
    });

    test('should have Fullscreen shortcut', () => {
      expect(mainContent).toContain('F11');
    });

    test('should have DevTools shortcut', () => {
      expect(mainContent).toContain('F12');
    });

    test('should have Zoom shortcuts', () => {
      expect(mainContent).toContain('CmdOrCtrl+Plus');
      expect(mainContent).toContain('CmdOrCtrl+-');
      expect(mainContent).toContain('CmdOrCtrl+0');
    });
  });

  describe('IPC Event Handlers', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should send new-game event', () => {
      expect(mainContent).toContain('mainWindow.webContents.send(\'new-game\')');
    });

    test('should send show-help event', () => {
      expect(mainContent).toContain('mainWindow.webContents.send(\'show-help\')');
    });

    test('should check if mainWindow exists before sending events', () => {
      const newGameMatch = mainContent.match(/if \(mainWindow\)[\s\S]*?send\('new-game'\)/);
      const showHelpMatch = mainContent.match(/if \(mainWindow\)[\s\S]*?send\('show-help'\)/);
      expect(newGameMatch).toBeTruthy();
      expect(showHelpMatch).toBeTruthy();
    });
  });

  describe('Platform Specific Features', () => {
    let mainContent;

    beforeAll(() => {
      const mainPath = path.join(__dirname, '..', 'electron', 'main.js');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('should handle macOS app lifecycle', () => {
      expect(mainContent).toContain('process.platform !== \'darwin\'');
    });

    test('should have macOS specific menu items', () => {
      expect(mainContent).toContain('app.getName()');
      expect(mainContent).toContain('role: \'about\'');
      expect(mainContent).toContain('role: \'services\'');
    });

    test('should handle macOS hide/show commands', () => {
      expect(mainContent).toContain('role: \'hide\'');
      expect(mainContent).toContain('role: \'hideothers\'');
      expect(mainContent).toContain('role: \'unhide\'');
    });
  });
});