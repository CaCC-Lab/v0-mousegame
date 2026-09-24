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
    stageSelect: 'ステージ選択',
    settings: 'せってい',
    dropArea: 'ドロップエリア',
    // 右端の細い帯に横書きで収まる短い語。
    // 「ドロップエリア」は縦書きにしないと入らず、縦書きは読みにくいと2人に言われた
    dropAreaShort: 'ここへ',
    stageGoals: 'ステージ目標:',
    scoreText: 'スコア:',
    fruitsText: 'フルーツ:',
    stage: 'ステージ',
    stageClear: '🎉 ステージクリア！ 🎉',
    stageCleared: 'をクリアしました！',
    nextStage: '次のステージへ',
    close: '閉じる',
    
    // Stage Selector
    targetScore: '目標スコア',
    targetFruits: '目標フルーツ',
    timeLimit: '制限時間',
    seconds: '秒',
    pieces: '個',
    cleared: '✅ クリア済み',
    locked: '🔒 ロック中',
    
    // Stage Names and Descriptions
    stages: {
      stage1: {
        name: 'フルーツ畑',
        description: 'フルーツ収穫の基本を学びましょう'
      },
      stage2: {
        name: 'リンゴ園',
        description: 'リンゴを中心に収穫しましょう'
      },
      stage3: {
        name: 'ブルーベリー農園',
        description: 'ブルーベリーのダブルクリックに挑戦'
      },
      stage4: {
        name: 'レモン畑',
        description: 'レモンの右クリックをマスターしよう'
      },
      stage5: {
        name: 'スイカ畑',
        description: 'スイカドラッグの技を極めよう'
      },
      stage6: {
        name: 'フルーツパラダイス',
        description: '全てのフルーツをバランスよく収穫'
      }
    },
    
    apple: 'りんご',
    blueberry: 'ブルーベリー',
    lemon: 'レモン',
    watermelon: 'スイカ',
    points: 'てん',
    combo: 'コンボ',
    gameTitle: 'フルーツハーベストゲーム',
    helpDescription: 'ゲームの遊び方の説明',
    touchDeviceNotice: 'スマホでもあそべるよ！ながおしでレモン、なぞってスイカをはこぼう。',

    // チャレンジ（コード上は arcade。画面での名前は「チャレンジ」。v1.2 D5）
    chooseMode: 'あそびかたをえらぼう',
    arcadeMode: 'チャレンジ',
    // {seconds} は ARCADE_CONFIG.startTimeSec から差し込む
    arcadeBadge: '{seconds}びょう から',
    arcadeTagline: 'とると じかんが ふえるよ。どこまで つづけられるかな？',
    practiceMode: 'れんしゅう',
    practiceTagline: 'ステージをすすんで、マウスそうさをマスターしよう',
    arcadeResultTitle: 'チャレンジけっか',
    endReasonTimeUp: 'じかんぎれ！',
    // {seconds} は今回続いた秒数
    playedSeconds: '{seconds}びょう つづいた！',
    nextTargetFirst: 'まずは 1こ とろう',
    timeLeftLabel: 'のこり',
    // {points} はリザルトで計算した次の目標点
    nextTarget: 'つぎは {points}てんを めざそう',
    weakOperationTitle: 'にがてな そうさ',
    practiceWeakOperation: 'れんしゅうで ためす',
    fruitsStartMoving: 'フルーツが うごきだした！',
    best: 'ベスト',
    newBest: 'じこベストこうしん！',
    rank: 'だんい',
    fever: 'ボーナスタイム',
    feverGauge: 'ボーナスタイムのゲージ',
    // ゲージの意味と発動条件を、遊んでいる最中に読めるようにするための短い一言
    feverHintCharging: 'コンボでたまる',
    feverHintActive: 'てんすう2ばい！',
    maxCombo: 'さいだいコンボ',
    feverCount: 'ボーナスタイム',
    times: 'かい',
    retry: 'もういちど',
    arcadeZeroHint: 'まずは 🍎 をクリックしてみよう',
    backToMenu: 'メニューへ',
    rankUp: 'しょうかく！',
    toNextRank: (points: number, rank: string) => `つぎの${rank}まで あと${points}てん`,
    maxRankReached: 'さいこうだんい たっせい！',
    specialFruit: 'スペシャルフルーツ（スコア2ばい）',
    fruitSection: '🍓 フルーツのとりかた 🍓',
    modeSection: '🎮 ゲームモード 🎮',
    easyMode: '🐢 とまるモード',
    hardModeTitle: '🏃 うごくモード',
    
    // Difficulty
    difficulty: '難易度',
    difficultyEasy: 'かんたん',
    difficultyNormal: 'ふつう',
    difficultyHard: 'むずかしい',
    // {multiplier} は types/difficulty.ts の scoreMultiplier から差し込む（docs/game-spec.md §7）。
    // 難易度で実際に変わるのは、れんしゅうの得点倍率だけ（時間・果物の数はステージの値が優先される）
    difficultyDesc: {
      easy: 'れんしゅうで とれる てんすうが {multiplier}ばいに なるよ（チャレンジは かわらないよ）',
      normal: 'れんしゅうの てんすうは そのまま（{multiplier}ばい）だよ',
      hard: 'れんしゅうで とれる てんすうが {multiplier}ばいに なるよ（チャレンジは かわらないよ）'
    },
    
    // Game Info
    score: '得点:',
    highScore: 'ベスト:',
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
      timeLimit: 'じかんはステージによってかわるよ（だいたい１ぷん〜２ふん３０びょう）',
      goal: 'できるだけたくさんのフルーツをあつめて、たかいてんすうをめざそう！',
      arcadeTitle: '🏆 チャレンジ 🏆',
      arcadeDesc: 'とると のこりじかんが ふえて、まちがえると へるよ。じかんが なくなったら おしまい。つづけてとると「コンボ」がつながって、てんすうが2ばい・3ばい…とふえていくよ。たくさんとると、フルーツが うごきだすよ。',
      arcadeFever: 'コンボをつなげてゲージがいっぱいになると「ボーナスタイム」！てんすうがさらに2ばい、フルーツもどんどんふえるよ。',
      arcadeRank: 'じこベストにおうじて、ブロンズ→シルバー→ゴールド…とだんいがあがるよ。',
      touchTitle: 'スマホ・タブレットのそうさ:',
      touchTap: 'タップ: りんごをとる',
      touchDoubleTap: 'すばやく2かいタップ: ブルーベリーをとる',
      touchLongPress: 'ながおし: レモンをとる（みぎクリックのかわり）',
      touchDrag: 'ゆびでなぞる: スイカをきいろいエリアまではこぶ',
      keyboardTitle: 'キーボードでもあそべるよ:',
      keyboardSpace: 'スペースキー: ゲームをとめたり、つづけたりできるよ',
      keyboardArrow: 'やじるしキー: フルーツをえらべるよ',
      keyboardEnter: 'エンターキー: えらんだフルーツをとる / ゲームをはじめる',
      powerUpTitle: '⚡ パワーアップアイテムについて ⚡',
      // {interval} {lifetime} {seconds} {count} {multiplier} は HelpDialog が types/powerup.ts の定数から差し込む。
      // 数値をここに書き写さない（docs/game-spec.md §6）
      powerUpDesc: 'れんしゅうモードのとちゅうで、ときどきパワーアップアイテムがでてくるよ！{interval}びょうごとにあらわれるかも。{lifetime}びょうできえちゃうから、はやくクリックしてとろう！',
      powerUpSpeedBoost: '💨 スピードダウン: うごくモードのとき、フルーツのうごきが{seconds}びょうかんゆっくりになるよ',
      powerUpScoreMultiplier: '⭐ スコア{multiplier}ばい: {seconds}びょうかん、とったフルーツのてんすうが{multiplier}ばいになるよ',
      powerUpTimeExtension: '⏰ じかんえんちょう: のこりじかんが{seconds}びょうふえるよ！',
      powerUpExtraFruits: '🍎 フルーツついか: あたらしいフルーツが{count}こでてくるよ！',
      powerUpFreezeTime: '❄️ じかんこおり: {seconds}びょうかん、タイマーがとまるよ',
    },

    // ゲーミフィケーション（バッジ・レベル・コンボ）
    // types/gamification.ts の定数はデータの識別子だけを持ち、
    // 画面に出す文言はここから引く（英語ロケールで日本語が混ざらないように）
    gamification: {
      streak: 'コンボ',
      streakSuccess: 'コンボ',
      amazingBonus: 'すごい！🌟',
      dailyPracticeTitle: 'きょうのれんしゅう',
      daysStreakLabel: 'れんぞく日数',
      daysStreakUnit: '日れんぞく',
      goalComplete: 'クリア！',
      goalIncomplete: 'がんばろう！',
      totalSuccess: '累計成功',
      levelProgressLabel: 'のレベル進捗',
      nextLevel: '次まで',
      threshold: '閾値',
      badgeEarned: '獲得済み',
      badgeProgress: 'の進捗',
      badgeCongrats: 'おめでとう！',
      viewCollection: 'ずかんを見る',
      collectionTitle: 'ずかん',
      tabFruits: 'フルーツ',
      tabBadges: 'バッジ',
      tabMastery: 'じゅくたつ',
      tabPractice: 'れんしゅう',
      fruitsComplete: 'コンプリート！',
      practiceStreakLabel: 'れんぞく',
      practiceDaysUnit: '日',
      stampCalendarLabel: '直近30日スタンプカレンダー',
      resultTitle: 'れんしゅうけっか',
      resultClose: 'とじる',
      resultStars: 'ほし',
      resultSuccessCounts: 'せいこうかいすう',
      resultComparison: 'ぜんかいくらべ',
      resultCountUnit: 'かい',
      deltaUp: 'ふえた',
      deltaDown: 'へった',
      deltaSame: 'おなじ',
      encouragement3: 'すごい！次もがんばろう！',
      encouragement2: 'よくできました！もう少し！',
      encouragement1: 'クリアおめでとう！',
      encouragement0: 'れんしゅうのきろくだよ',
      // プレイ中の凡例の見出し。すぐ上の収穫カウンターと役割を見分けるためのもの
      legendTitle: 'とりかた',
      // 連続成功が途切れた瞬間だけ出す。薄い表示のままだと気づけない
      streakBroken: 'コンボがとぎれた！',
      dailyGoalCompleteTitle: 'きょうのれんしゅうクリア！',
      levelUpTitle: 'レベルアップ！',
      // 誤操作したときに出すヒント（{fruit} と {action} を差し替えて使う）
      missHint: '{fruit}は{action}だよ！',
      // 星が付かなかったときに出す次の一歩（{fruit} と {action} を差し替えて使う）
      nextFocus: 'つぎは{fruit}の{action}をやってみよう！',
      operations: {
        click: 'クリック',
        doubleClick: 'ダブルクリック',
        rightClick: '右クリック',
        drop: 'ドラッグ',
      },
      badges: {
        clickMaster: 'クリック名人',
        doubleClickExpert: 'ダブルクリック達人',
        rightClickPro: '右クリックマスター',
        dragDoctor: 'ドラッグ博士',
      },
      masteryLevels: {
        1: 'はじめて',
        2: 'できるね',
        3: 'じょうず',
        4: 'すごい',
        5: 'マスター',
      },
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
    stageSelect: 'Select Stage',
    settings: 'Settings',
    dropArea: 'Drop Area',
    // Short label that fits the narrow strip horizontally
    dropAreaShort: 'DROP',
    stageGoals: 'Stage Goals:',
    scoreText: 'Score:',
    fruitsText: 'Fruits:',
    stage: 'Stage',
    stageClear: '🎉 Stage Clear! 🎉',
    stageCleared: 'cleared!',
    nextStage: 'Next Stage',
    close: 'Close',
    
    // Stage Selector
    targetScore: 'Target Score',
    targetFruits: 'Target Fruits',
    timeLimit: 'Time Limit',
    seconds: 'seconds',
    pieces: 'pieces',
    cleared: '✅ Cleared',
    locked: '🔒 Locked',
    
    // Stage Names and Descriptions
    stages: {
      stage1: {
        name: 'Fruit Farm',
        description: 'Learn the basics of fruit harvesting'
      },
      stage2: {
        name: 'Apple Orchard',
        description: 'Focus on harvesting apples'
      },
      stage3: {
        name: 'Blueberry Farm',
        description: 'Take on the blueberry double-click'
      },
      stage4: {
        name: 'Lemon Grove',
        description: 'Master the right-click with lemons'
      },
      stage5: {
        name: 'Watermelon Field',
        description: 'Perfect your watermelon drag'
      },
      stage6: {
        name: 'Fruit Paradise',
        description: 'Harvest every fruit in balance'
      }
    },
    
    apple: 'Apple',
    blueberry: 'Blueberry',
    lemon: 'Lemon',
    watermelon: 'Watermelon',
    points: 'points',
    combo: 'Combo',
    gameTitle: 'Fruit Harvest Game',
    helpDescription: 'How to play the game',
    touchDeviceNotice: 'Touch works too! Long-press for lemons, drag watermelons to the drop zone.',

    // Challenge (arcade in code; v1.2 D5)
    chooseMode: 'Choose how to play',
    arcadeMode: 'Challenge',
    arcadeBadge: 'From {seconds}s',
    arcadeTagline: 'Every catch adds time. How long can you keep going?',
    practiceMode: 'Practice',
    practiceTagline: 'Clear stages and master every mouse move',
    arcadeResultTitle: 'Challenge Result',
    endReasonTimeUp: 'Time up!',
    playedSeconds: 'You lasted {seconds}s!',
    nextTargetFirst: 'First, catch one fruit!',
    timeLeftLabel: 'Left',
    nextTarget: 'Next goal: {points} pts',
    weakOperationTitle: 'Needs practice',
    practiceWeakOperation: 'Practice it',
    fruitsStartMoving: 'The fruits are moving!',
    best: 'Best',
    newBest: 'New personal best!',
    rank: 'Rank',
    fever: 'BONUS TIME',
    feverGauge: 'Bonus Time gauge',
    // Short line so players can learn what the gauge is while playing
    feverHintCharging: 'Chain combos to fill',
    feverHintActive: 'Double points!',
    maxCombo: 'Max combo',
    feverCount: 'Bonus Times',
    times: 'x',
    retry: 'Play again',
    arcadeZeroHint: 'Start by clicking an 🍎 apple!',
    backToMenu: 'Back to menu',
    rankUp: 'Rank up!',
    toNextRank: (points: number, rank: string) => `${points} pts to ${rank}`,
    maxRankReached: 'Top rank reached!',
    specialFruit: 'Special Fruit (2x score)',
    fruitSection: '🍓 How to Catch Fruits 🍓',
    modeSection: '🎮 Game Modes 🎮',
    easyMode: '🐢 Still Mode',
    hardModeTitle: '🏃 Moving Mode',
    
    // Difficulty
    difficulty: 'Difficulty',
    difficultyEasy: 'Easy',
    difficultyNormal: 'Normal',
    difficultyHard: 'Hard',
    difficultyDesc: {
      easy: 'Points in Practice are x{multiplier} (Challenge is not affected)',
      normal: 'Points in Practice are unchanged (x{multiplier})',
      hard: 'Points in Practice are x{multiplier} (Challenge is not affected)'
    },
    
    // Game Info
    score: 'Score:',
    highScore: 'Best:',
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
      timeLimit: 'Time varies by stage (about 1 to 2.5 minutes)',
      goal: 'Collect as many fruits as you can and beat your best!',
      arcadeTitle: '🏆 Challenge 🏆',
      arcadeDesc: 'Every catch adds a little time and every mistake takes some away. When the timer runs out, the game ends. Keep catching without a miss to build a Combo — your points go 2x, 3x and higher. Catch enough and the fruits start to move.',
      arcadeFever: 'Fill the gauge with combos to start BONUS TIME: double points on top of your combo, and the field fills up with fruit.',
      arcadeRank: 'Your personal best sets your rank: Bronze → Silver → Gold and beyond.',
      touchTitle: 'On phones and tablets:',
      touchTap: 'Tap: pick an apple',
      touchDoubleTap: 'Double tap quickly: pick a blueberry',
      touchLongPress: 'Long press: pick a lemon (instead of right-click)',
      touchDrag: 'Drag with your finger: carry a watermelon to the yellow area',
      keyboardTitle: 'You can also use keyboard:',
      keyboardSpace: 'Space: Stop or continue the game',
      keyboardArrow: 'Arrow Keys: Choose a fruit',
      keyboardEnter: 'Enter: Take the chosen fruit / Start game',
      powerUpTitle: '⚡ About Power-Up Items ⚡',
      powerUpDesc: 'In Practice mode, power-up items sometimes appear! One may show up every {interval} seconds, and it disappears after {lifetime} seconds, so click it quickly!',
      powerUpSpeedBoost: '💨 Speed Down: In Moving Mode, fruits move slower for {seconds} seconds',
      powerUpScoreMultiplier: '⭐ Score x{multiplier}: Fruits are worth {multiplier}x points for {seconds} seconds',
      powerUpTimeExtension: '⏰ Time Extension: Adds {seconds} seconds to the time left!',
      powerUpExtraFruits: '🍎 Extra Fruits: {count} new fruits appear!',
      powerUpFreezeTime: '❄️ Freeze Time: The timer stops for {seconds} seconds',
    },

    // Gamification (badges / levels / streaks)
    gamification: {
      streak: 'Combo',
      streakSuccess: 'Combo',
      amazingBonus: 'Amazing! 🌟',
      dailyPracticeTitle: "Today's practice",
      daysStreakLabel: 'Day streak',
      daysStreakUnit: '-day streak',
      goalComplete: 'Done!',
      goalIncomplete: 'Keep going!',
      totalSuccess: 'Total',
      levelProgressLabel: ' level progress',
      nextLevel: 'Remaining:',
      threshold: 'Next level:',
      badgeEarned: 'Earned',
      badgeProgress: ' progress',
      badgeCongrats: 'Congratulations!',
      viewCollection: 'View collection',
      collectionTitle: 'Collection',
      tabFruits: 'Fruits',
      tabBadges: 'Badges',
      tabMastery: 'Mastery',
      tabPractice: 'Practice',
      fruitsComplete: 'Complete!',
      practiceStreakLabel: 'Streak',
      practiceDaysUnit: 'days',
      stampCalendarLabel: 'Stamp calendar for the last 30 days',
      resultTitle: 'Practice results',
      resultClose: 'Close',
      resultStars: 'Stars',
      resultSuccessCounts: 'Successes',
      resultComparison: 'vs. last round',
      resultCountUnit: '',
      deltaUp: 'up',
      deltaDown: 'down',
      deltaSame: 'same',
      encouragement3: 'Awesome! Keep it up!',
      encouragement2: 'Well done! Almost there!',
      encouragement1: 'Nice clear!',
      encouragement0: 'Here is your practice record',
      // Heading for the in-play legend, so it is not mistaken for the harvest counter
      legendTitle: 'How to catch',
      // Shown only at the moment a streak is lost
      streakBroken: 'Combo lost!',
      dailyGoalCompleteTitle: "Today's practice complete!",
      levelUpTitle: 'Level up!',
      // Shown when the player uses the wrong action ({fruit} / {action} are replaced)
      missHint: '{fruit} needs a {action}!',
      // Suggested next step when no stars were earned ({fruit} / {action} are replaced)
      nextFocus: 'Next, try the {action} on the {fruit}!',
      operations: {
        click: 'Click',
        doubleClick: 'Double-click',
        rightClick: 'Right-click',
        drop: 'Drag',
      },
      badges: {
        clickMaster: 'Click Master',
        doubleClickExpert: 'Double-click Expert',
        rightClickPro: 'Right-click Pro',
        dragDoctor: 'Drag Doctor',
      },
      masteryLevels: {
        1: 'Beginner',
        2: 'Getting it',
        3: 'Skilled',
        4: 'Great',
        5: 'Master',
      },
    },
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ja