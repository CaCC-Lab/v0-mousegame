import {
  SOUND_TYPES,
  getToneSpecs,
  getSoundDuration,
  type SoundType,
} from '../soundSynth'

/**
 * soundSynthの実装テスト（モックなし）
 *
 * 効果音を音声ファイルではなくWeb Audio APIの合成音で鳴らすため、
 * 「どんな音を鳴らすか」はピュア関数のレシピとして切り出してある。
 * ここではそのレシピ自体を検証する（AudioContextは不要）。
 */
describe('soundSynth', () => {
  describe('SOUND_TYPES', () => {
    it('ゲームで使う4種類のサウンドを定義している', () => {
      expect(SOUND_TYPES).toEqual([
        'collect',
        'gameStart',
        'gameOver',
        'highScore',
      ])
    })
  })

  describe('getToneSpecs', () => {
    it.each(SOUND_TYPES)('%s のレシピを1音以上返す', (soundType) => {
      const specs = getToneSpecs(soundType)
      expect(specs.length).toBeGreaterThan(0)
    })

    it.each(SOUND_TYPES)('%s の全ての音が可聴域の周波数を持つ', (soundType) => {
      getToneSpecs(soundType).forEach((spec) => {
        expect(spec.frequency).toBeGreaterThanOrEqual(20)
        expect(spec.frequency).toBeLessThanOrEqual(20000)

        if (spec.endFrequency !== undefined) {
          expect(spec.endFrequency).toBeGreaterThanOrEqual(20)
          expect(spec.endFrequency).toBeLessThanOrEqual(20000)
        }
      })
    })

    it.each(SOUND_TYPES)('%s の全ての音が正の長さを持つ', (soundType) => {
      getToneSpecs(soundType).forEach((spec) => {
        expect(spec.duration).toBeGreaterThan(0)
        expect(spec.offset).toBeGreaterThanOrEqual(0)
      })
    })

    it.each(SOUND_TYPES)('%s の全ての音量が0〜1の範囲に収まる', (soundType) => {
      getToneSpecs(soundType).forEach((spec) => {
        expect(spec.gain).toBeGreaterThan(0)
        expect(spec.gain).toBeLessThanOrEqual(1)
      })
    })

    it.each(SOUND_TYPES)('%s が有効な波形を指定する', (soundType) => {
      const validWaveforms = ['sine', 'square', 'sawtooth', 'triangle']
      getToneSpecs(soundType).forEach((spec) => {
        expect(validWaveforms).toContain(spec.waveform)
      })
    })

    it('呼び出しごとに独立した配列を返す（外部からの変更が漏れない）', () => {
      const first = getToneSpecs('collect')
      first[0].gain = 0.99

      const second = getToneSpecs('collect')
      expect(second[0].gain).not.toBe(0.99)
    })

    it('未知のサウンドタイプでは空配列を返す（例外を投げない）', () => {
      const unknown = 'notASound' as SoundType
      expect(() => getToneSpecs(unknown)).not.toThrow()
      expect(getToneSpecs(unknown)).toEqual([])
    })
  })

  describe('getSoundDuration', () => {
    it.each(SOUND_TYPES)('%s の長さは最後の音が鳴り終わる時刻と一致する', (soundType) => {
      const specs = getToneSpecs(soundType)
      const expected = Math.max(...specs.map((s) => s.offset + s.duration))

      expect(getSoundDuration(soundType)).toBeCloseTo(expected, 5)
    })

    it('collectは頻繁に鳴るため0.3秒以内に収まる', () => {
      // フルーツを取るたびに鳴るので、長いと音が重なって耳障りになる
      expect(getSoundDuration('collect')).toBeLessThanOrEqual(0.3)
    })

    it.each(SOUND_TYPES)('%s はゲーム進行を妨げない2秒以内に収まる', (soundType) => {
      expect(getSoundDuration(soundType)).toBeLessThanOrEqual(2)
    })

    it('未知のサウンドタイプでは0を返す', () => {
      expect(getSoundDuration('notASound' as SoundType)).toBe(0)
    })
  })
})
