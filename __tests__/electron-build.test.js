const fs = require('fs');
const path = require('path');

describe('Electron Build Configuration', () => {
  let packageJson;

  beforeAll(() => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    packageJson = JSON.parse(packageContent);
  });

  describe('Build Scripts', () => {
    test('should have electron:build script', () => {
      expect(packageJson.scripts['electron:build']).toBeDefined();
      expect(packageJson.scripts['electron:build']).toContain('electron-builder');
    });

    test('should have dist script for distribution', () => {
      expect(packageJson.scripts.dist).toBeDefined();
      expect(packageJson.scripts.dist).toContain('electron-builder');
    });

    test('should have platform-specific build scripts', () => {
      expect(packageJson.scripts['build:win']).toBeDefined();
      expect(packageJson.scripts['build:mac']).toBeDefined();
      expect(packageJson.scripts['build:linux']).toBeDefined();
    });
  });

  describe('Build Configuration', () => {
    test('should have build configuration', () => {
      expect(packageJson.build).toBeDefined();
    });

    test('should have appId', () => {
      expect(packageJson.build.appId).toBeDefined();
      expect(packageJson.build.appId).toBe('com.fruitharvestgame.app');
    });

    test('should have productName', () => {
      expect(packageJson.build.productName).toBeDefined();
      expect(packageJson.build.productName).toBe('Fruit Harvest Game');
    });

    test('should have proper output directory', () => {
      expect(packageJson.build.directories).toBeDefined();
      expect(packageJson.build.directories.output).toBe('dist');
    });

    test('should include necessary files', () => {
      expect(packageJson.build.files).toBeDefined();
      expect(packageJson.build.files).toContain('electron/**/*');
      expect(packageJson.build.files).toContain('out/**/*');
    });

    test('should have platform configurations', () => {
      expect(packageJson.build.mac).toBeDefined();
      expect(packageJson.build.win).toBeDefined();
      expect(packageJson.build.linux).toBeDefined();
    });

    test('should have Windows configuration', () => {
      expect(packageJson.build.win.target).toBeDefined();
      expect(packageJson.build.win.target).toContain('nsis');
      expect(packageJson.build.win.icon).toBeDefined();
    });

    test('should have macOS configuration', () => {
      expect(packageJson.build.mac.category).toBe('public.app-category.games');
      expect(packageJson.build.mac.icon).toBeDefined();
    });

    test('should have Linux configuration', () => {
      expect(packageJson.build.linux.target).toBeDefined();
      expect(packageJson.build.linux.category).toBe('Game');
      expect(packageJson.build.linux.icon).toBeDefined();
    });

    test('should have author information', () => {
      expect(packageJson.author).toBeDefined();
      expect(packageJson.author.name).toBeDefined();
      expect(packageJson.author.email).toBeDefined();
    });

    test('should have description', () => {
      expect(packageJson.description).toBeDefined();
      expect(packageJson.description.length).toBeGreaterThan(0);
    });
  });

  describe('Icon Files', () => {
    test('should have icon files in build resources', () => {
      const iconsPath = path.join(__dirname, '..', 'build');
      const iconExists = fs.existsSync(iconsPath);
      
      if (iconExists) {
        const files = fs.readdirSync(iconsPath);
        expect(files.some(file => file.endsWith('.ico'))).toBe(true);
        expect(files.some(file => file.endsWith('.icns'))).toBe(true);
        expect(files.some(file => file.endsWith('.png'))).toBe(true);
      }
    });
  });
});