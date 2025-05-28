export const translations = {
  ja: {
    // UI Controls
    start: 'はじめる',
    pause: 'ちゅうだん',
    resume: 'さいかい',
    reset: 'リセット',
    hardMode: 'むずかしいモード',
    darkMode: 'ダークモード',
    howToPlay: 'あそびかた',
    language: '日本語',
    muteSound: 'おとをけす',
    unmuteSound: 'おとをだす',
    volume: 'おんりょう',
    
    // Game Info
    score: '得点:',
    highScore: '最高得点:',
    timeFormat: (minutes: number, seconds: number) => `${minutes}分${seconds.toString().padStart(2, '0')}秒`,
    
    // Help Dialog
    helpTitle: 'フルーツハーベストゲームのあそびかた',
    helpContent: {
      apple: '🍎 りんご: クリックして収穫',
      blueberry: '🫐 ブルーベリー: ダブルクリックして収穫',
      lemon: '🍋 レモン: 右クリックして収穫',
      watermelon: '🍉 スイカ: ドラッグして右側のエリアにドロップ',
      hardModeDesc: 'むずかしいモード: フルーツが動き回ります',
      easyModeDesc: 'かんたんモード: フルーツは動きません',
      timeLimit: '制限時間は3分間です',
      goal: 'たくさんのフルーツを収穫して高得点を目指そう！',
      keyboardTitle: 'キーボード操作:',
      keyboardSpace: 'スペースキー: ゲームの一時停止/再開',
      keyboardArrow: '矢印キー: フルーツを選択',
      keyboardEnter: 'Enterキー: 選択したフルーツを収穫 / ゲーム開始',
    },
  },
  en: {
    // UI Controls
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    hardMode: 'Hard Mode',
    darkMode: 'Dark Mode',
    howToPlay: 'How to Play',
    language: 'English',
    muteSound: 'Mute sound',
    unmuteSound: 'Unmute sound',
    volume: 'Volume',
    
    // Game Info
    score: 'Score:',
    highScore: 'High Score:',
    timeFormat: (minutes: number, seconds: number) => `${minutes}:${seconds.toString().padStart(2, '0')}`,
    
    // Help Dialog
    helpTitle: 'How to Play Fruit Harvest Game',
    helpContent: {
      apple: '🍎 Apple: Click to harvest',
      blueberry: '🫐 Blueberry: Double-click to harvest',
      lemon: '🍋 Lemon: Right-click to harvest',
      watermelon: '🍉 Watermelon: Drag and drop to the right area',
      hardModeDesc: 'Hard Mode: Fruits move around',
      easyModeDesc: 'Easy Mode: Fruits stay still',
      timeLimit: 'Time limit is 3 minutes',
      goal: 'Harvest as many fruits as possible to get a high score!',
      keyboardTitle: 'Keyboard Controls:',
      keyboardSpace: 'Space: Pause/Resume game',
      keyboardArrow: 'Arrow Keys: Select fruit',
      keyboardEnter: 'Enter: Harvest selected fruit / Start game',
    },
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ja