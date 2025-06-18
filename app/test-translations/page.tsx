'use client'

import React from 'react'
import { useLanguage } from '@/hooks/useLanguage'

export default function TestTranslations() {
  const { t, language, toggleLanguage } = useLanguage()
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Translation System Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current State:</h2>
        <p>Language: <strong>{language}</strong></p>
        <button 
          onClick={toggleLanguage}
          style={{ padding: '10px', marginBottom: '20px' }}
        >
          Toggle Language (Current: {language})
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Difficulty Translations:</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>t.difficulty</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t?.difficulty || 'UNDEFINED'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>t.difficultyEasy</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t?.difficultyEasy || 'UNDEFINED'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>t.difficultyNormal</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t?.difficultyNormal || 'UNDEFINED'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>t.difficultyHard</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{t?.difficultyHard || 'UNDEFINED'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Difficulty Stats:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(t?.difficultyStats, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Difficulty Descriptions:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(t?.difficultyDesc, null, 2)}
        </pre>
      </div>

      <div>
        <h2>All Translation Keys:</h2>
        <details>
          <summary>Click to expand</summary>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto', maxHeight: '400px' }}>
            {JSON.stringify(Object.keys(t || {}), null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}