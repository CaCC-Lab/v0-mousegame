interface Window {
  electronAPI?: {
    onNewGame: (callback: () => void) => void
    onShowHelp: (callback: () => void) => void
    removeAllListeners: (channel: string) => void
  }
}