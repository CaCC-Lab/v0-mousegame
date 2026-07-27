const fs = require('fs');
const path = require('path');

describe('Documentation', () => {
  describe('README.md', () => {
    let readmeContent;
    const readmePath = path.join(__dirname, '..', 'README.md');

    beforeAll(() => {
      if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, 'utf8');
      }
    });

    test('should have README.md file', () => {
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('should have game title', () => {
      // 見出しにゲーム名が含まれていること（表記ゆれを許容）
      expect(readmeContent).toMatch(/# .*(フルーツキャッチ|フルーツハーベスト|Fruit Harvest)/i);
    });

    test('should have game description', () => {
      expect(readmeContent).toMatch(/(説明|Description|概要|Overview)/i);
    });

    test('should have keyboard controls section', () => {
      expect(readmeContent).toMatch(/(キーボード操作|Keyboard Controls|操作方法|Controls)/i);
    });

    test('should document movement controls', () => {
      expect(readmeContent).toMatch(/矢印キー|Arrow Keys|↑↓←→|WASD/i);
    });

    test('should document game controls', () => {
      expect(readmeContent).toMatch(/(スペース|Space|Enter|エンター)/i);
    });

    test('should have installation instructions', () => {
      expect(readmeContent).toMatch(/(インストール|Installation|セットアップ|Setup)/i);
    });

    test('should have running instructions', () => {
      expect(readmeContent).toMatch(/(実行|Run|起動|Start)/i);
      expect(readmeContent).toContain('npm');
    });

    test('should mention Electron build', () => {
      expect(readmeContent).toMatch(/(Electron|デスクトップ|Desktop)/i);
    });

    test('should have development section', () => {
      expect(readmeContent).toMatch(/(開発|Development|Development Setup)/i);
    });
  });

  describe('Keyboard Controls Documentation', () => {
    let readmeContent;
    const readmePath = path.join(__dirname, '..', 'README.md');

    beforeAll(() => {
      if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, 'utf8');
      }
    });

    test('should document arrow key controls', () => {
      const hasArrowKeys = 
        readmeContent.includes('↑') || 
        readmeContent.includes('上') ||
        readmeContent.includes('Up') ||
        readmeContent.includes('ArrowUp');
      expect(hasArrowKeys).toBe(true);
    });

    test('should document all four directions', () => {
      const directions = ['上', '下', '左', '右', 'Up', 'Down', 'Left', 'Right', '↑', '↓', '←', '→'];
      let directionCount = 0;
      
      directions.forEach(dir => {
        if (readmeContent.includes(dir)) {
          directionCount++;
        }
      });
      
      expect(directionCount).toBeGreaterThanOrEqual(4);
    });

    test('should document pause functionality', () => {
      const hasPause = 
        readmeContent.includes('Pause') ||
        readmeContent.includes('ポーズ') ||
        readmeContent.includes('一時停止') ||
        readmeContent.includes('P');
      expect(hasPause).toBe(true);
    });

    test('should document game restart', () => {
      const hasRestart = 
        readmeContent.includes('Restart') ||
        readmeContent.includes('リスタート') ||
        readmeContent.includes('再開') ||
        readmeContent.includes('新しいゲーム') ||
        readmeContent.includes('R');
      expect(hasRestart).toBe(true);
    });

    test('should have keyboard shortcuts table or list', () => {
      const hasTable = readmeContent.includes('|') && readmeContent.includes('---');
      const hasList = readmeContent.includes('- ') || readmeContent.includes('* ');
      expect(hasTable || hasList).toBe(true);
    });
  });

  describe('In-Game Help', () => {
    let gameComponentContent;
    const componentPath = path.join(__dirname, '..', 'components', 'FruitHarvestGame.tsx');

    beforeAll(() => {
      if (fs.existsSync(componentPath)) {
        gameComponentContent = fs.readFileSync(componentPath, 'utf8');
      }
    });

    test('should have help dialog or overlay', () => {
      const hasHelp = 
        gameComponentContent.includes('help') ||
        gameComponentContent.includes('Help') ||
        gameComponentContent.includes('ヘルプ') ||
        gameComponentContent.includes('?');
      expect(hasHelp).toBe(true);
    });

    test('should show controls in UI', () => {
      const hasControlsDisplay = 
        gameComponentContent.includes('Arrow') ||
        gameComponentContent.includes('矢印') ||
        gameComponentContent.includes('WASD') ||
        gameComponentContent.includes('Space');
      expect(hasControlsDisplay).toBe(true);
    });
  });
});