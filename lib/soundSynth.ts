/**
 * 効果音のレシピ（ピュア関数）
 *
 * 音声ファイルを配置する代わりに、Web Audio APIのオシレーターで効果音を合成する。
 * これにより以下を同時に満たす:
 *   - 音源のライセンス管理が不要（すべて自前生成）
 *   - 追加のダウンロードが発生しない（itch.io配信時のロード待ちゼロ）
 *   - 配信パスに依存しない（/sounds/*.mp3 のような絶対パス参照が不要）
 *
 * 「どんな音を鳴らすか」だけをここに切り出し、実際の再生はSoundManagerが行う。
 */

export type SoundType = 'collect' | 'gameStart' | 'gameOver' | 'highScore'

export const SOUND_TYPES: readonly SoundType[] = [
  'collect',
  'gameStart',
  'gameOver',
  'highScore',
] as const

/** 合成する単音の仕様 */
export interface ToneSpec {
  /** 開始周波数(Hz) */
  frequency: number
  /** 終了周波数(Hz)。指定するとfrequencyからなめらかに変化する */
  endFrequency?: number
  /** 波形 */
  waveform: OscillatorType
  /** サウンド先頭からの再生開始位置(秒) */
  offset: number
  /** 鳴らす長さ(秒) */
  duration: number
  /** 音量係数(0〜1)。SoundManagerのマスター音量がさらに乗算される */
  gain: number
}

/** 音名 → 周波数(Hz)。平均律・A4=440Hz基準 */
const NOTE = {
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  E6: 1318.51,
  G6: 1567.98,
} as const

/**
 * サウンドごとのレシピ。
 * 小学生が長時間使うツールなので、耳に痛くないやわらかい波形（sine / triangle）のみ使う。
 */
const TONE_SPECS: Record<SoundType, readonly ToneSpec[]> = {
  // フルーツ収穫時。頻繁に鳴るので短く軽やかに（2音の上昇）
  collect: [
    { frequency: NOTE.C6, waveform: 'sine', offset: 0, duration: 0.08, gain: 0.35 },
    { frequency: NOTE.E6, waveform: 'sine', offset: 0.05, duration: 0.1, gain: 0.3 },
  ],

  // ゲーム開始。やる気が出る上昇アルペジオ
  gameStart: [
    { frequency: NOTE.C5, waveform: 'triangle', offset: 0, duration: 0.12, gain: 0.3 },
    { frequency: NOTE.E5, waveform: 'triangle', offset: 0.1, duration: 0.12, gain: 0.3 },
    { frequency: NOTE.G5, waveform: 'triangle', offset: 0.2, duration: 0.18, gain: 0.32 },
  ],

  // ゲーム終了。失敗感を出さないよう、やさしい下降で「おしまい」を伝える
  gameOver: [
    { frequency: NOTE.G5, waveform: 'sine', offset: 0, duration: 0.18, gain: 0.28 },
    { frequency: NOTE.E5, waveform: 'sine', offset: 0.15, duration: 0.18, gain: 0.28 },
    { frequency: NOTE.C5, waveform: 'sine', offset: 0.3, duration: 0.35, gain: 0.3 },
  ],

  // ハイスコア更新。いちばん華やかなファンファーレ（最後の音は伸ばす）
  highScore: [
    { frequency: NOTE.C5, waveform: 'triangle', offset: 0, duration: 0.12, gain: 0.3 },
    { frequency: NOTE.E5, waveform: 'triangle', offset: 0.09, duration: 0.12, gain: 0.3 },
    { frequency: NOTE.G5, waveform: 'triangle', offset: 0.18, duration: 0.12, gain: 0.32 },
    {
      frequency: NOTE.C6,
      endFrequency: NOTE.G6,
      waveform: 'triangle',
      offset: 0.27,
      duration: 0.5,
      gain: 0.34,
    },
  ],
}

/**
 * 指定サウンドの合成レシピを取得する。
 * 呼び出し側が書き換えても定義が壊れないよう、毎回コピーを返す。
 */
export function getToneSpecs(soundType: SoundType): ToneSpec[] {
  const specs = TONE_SPECS[soundType]
  if (!specs) return []

  return specs.map((spec) => ({ ...spec }))
}

/** 指定サウンドが鳴り終わるまでの長さ(秒)。未定義のサウンドは0 */
export function getSoundDuration(soundType: SoundType): number {
  const specs = getToneSpecs(soundType)
  if (specs.length === 0) return 0

  return Math.max(...specs.map((spec) => spec.offset + spec.duration))
}
