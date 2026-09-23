import { DifficultyLevel, DIFFICULTY_CONFIGS } from '@/types/difficulty'
import type { translations } from '@/lib/i18n/translations'

/** 難易度の説明文。倍率は定数から差し込む（手で書き写さない） */
export function describeDifficulty(
  level: DifficultyLevel,
  t: typeof translations.ja | typeof translations.en
): string {
  return t.difficultyDesc[level].replace(/\{multiplier\}/g, String(DIFFICULTY_CONFIGS[level].scoreMultiplier))
}
