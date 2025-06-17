import React from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'

interface SoundControlsProps {
  soundEnabled: boolean
  volume: number
  onToggleSound: () => void
  onVolumeChange: (volume: number) => void
}

export function SoundControls({
  soundEnabled,
  volume,
  onToggleSound,
  onVolumeChange,
}: SoundControlsProps) {
  const { t } = useLanguage()
  
  const volumePercentage = Math.round(volume * 100)

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={onToggleSound}
        variant="outline"
        size="icon"
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? t.muteSound : t.unmuteSound}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex items-center gap-2">
        <label htmlFor="volume-slider" className="sr-only">
          {t.volume}
        </label>
        <input
          id="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          disabled={!soundEnabled}
          className="w-24"
          aria-label={t.volume}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={volume}
        />
        <span className="text-sm text-gray-600 w-10 text-right">
          {volumePercentage}%
        </span>
      </div>
    </div>
  )
}