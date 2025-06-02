import { useEffect, useRef, useState, useCallback } from 'react'
import { SoundManager } from '../lib/soundManager'

export interface UseSoundEffectsReturn {
  playCollectSound: () => Promise<void>
  playGameStartSound: () => Promise<void>
  playGameOverSound: () => Promise<void>
  playHighScoreSound: () => Promise<void>
  toggleSound: () => void
  setVolume: (volume: number) => void
  soundEnabled: boolean
  volume: number
}

export function useSoundEffects(): UseSoundEffectsReturn {
  const soundManagerRef = useRef<SoundManager | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [volume, setVolumeState] = useState(0.5)

  useEffect(() => {
    soundManagerRef.current = new SoundManager()
    setSoundEnabled(soundManagerRef.current.isEnabled())
    setVolumeState(soundManagerRef.current.getVolume())

    return () => {
      soundManagerRef.current?.destroy()
    }
  }, [])

  const playCollectSound = useCallback(async () => {
    await soundManagerRef.current?.play('collect')
  }, [])

  const playGameStartSound = useCallback(async () => {
    await soundManagerRef.current?.play('gameStart')
  }, [])

  const playGameOverSound = useCallback(async () => {
    await soundManagerRef.current?.play('gameOver')
  }, [])

  const playHighScoreSound = useCallback(async () => {
    await soundManagerRef.current?.play('highScore')
  }, [])

  const toggleSound = useCallback(() => {
    soundManagerRef.current?.toggle()
    setSoundEnabled(soundManagerRef.current?.isEnabled() ?? false)
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    soundManagerRef.current?.setVolume(newVolume)
    // SoundManagerがクランプした値を取得
    const actualVolume = soundManagerRef.current?.getVolume() ?? newVolume
    setVolumeState(actualVolume)
  }, [])

  return {
    playCollectSound,
    playGameStartSound,
    playGameOverSound,
    playHighScoreSound,
    toggleSound,
    setVolume,
    soundEnabled,
    volume,
  }
}