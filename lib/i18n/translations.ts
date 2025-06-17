export const translations = {
  ja: {
    // UI Controls
    start: 'はじめる',
    pause: 'ちゅうだん',
    resume: 'さいかい',
    reset: 'リセット',
    hardMode: 'うごくモード',
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
    helpTitle: 'フルーツあつめゲームのあそびかた',
    helpContent: {
      apple: '🍎 りんご: マウスでカチッとクリックしてつかまえよう！',
      blueberry: '🫐 ブルーベリー: すばやく２かいクリック（ダブルクリック）でゲット！',
      lemon: '🍋 レモン: マウスのみぎボタンをおしてとろう！',
      watermelon: '🍉 スイカ: マウスでつかんで、みぎがわのきいろいエリアまでもっていこう！',
      hardModeDesc: 'うごくモード: フルーツがにげまわるよ！おいかけてつかまえよう',
      easyModeDesc: 'とまるモード: フルーツはうごかないから、ゆっくりあそべるよ',
      timeLimit: 'じかんは３ぷんかん！（ステージによってかわるよ）',
      goal: 'できるだけたくさんのフルーツをあつめて、たかいてんすうをめざそう！',
      keyboardTitle: 'キーボードでもあそべるよ:',
      keyboardSpace: 'スペースキー: ゲームをとめたり、つづけたりできるよ',
      keyboardArrow: 'やじるしキー: フルーツをえらべるよ',
      keyboardEnter: 'エンターキー: えらんだフルーツをとる / ゲームをはじめる',
    },
  },
  en: {
    // UI Controls
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    hardMode: 'Moving Mode',
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
    helpTitle: 'How to Play Fruit Collecting Game',
    helpContent: {
      apple: '🍎 Apple: Click once to catch it!',
      blueberry: '🫐 Blueberry: Click twice quickly (double-click) to get it!',
      lemon: '🍋 Lemon: Use the right mouse button to pick it!',
      watermelon: '🍉 Watermelon: Drag it to the yellow area on the right!',
      hardModeDesc: 'Moving Mode: Fruits run away! Chase and catch them',
      easyModeDesc: 'Still Mode: Fruits don\'t move, so you can play slowly',
      timeLimit: 'You have 3 minutes! (Time varies by stage)',
      goal: 'Collect as many fruits as you can for a high score!',
      keyboardTitle: 'You can also use keyboard:',
      keyboardSpace: 'Space: Stop or continue the game',
      keyboardArrow: 'Arrow Keys: Choose a fruit',
      keyboardEnter: 'Enter: Take the chosen fruit / Start game',
    },
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ja