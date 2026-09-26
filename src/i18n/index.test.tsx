import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { I18nProvider, translate, useI18n } from '.'

function TranslationProbe() {
  const { t } = useI18n()
  return <p>{t('finder.playChord')}</p>
}

describe('i18n', () => {
  afterEach(() => {
    window.localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('uses i18next resources for English and Thai translations', () => {
    expect(translate('en', 'studio.play')).toBe('▶ Play performance')
    expect(translate('th', 'studio.play')).toBe('▶ เล่นการแสดง')
  })

  it('switches the rendered UI to Thai and remembers the selection', () => {
    render(<I18nProvider><LanguageSwitcher /><TranslationProbe /></I18nProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'ไทย' }))

    expect(screen.getByText('▶ เล่นคอร์ดที่เลือก')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('th')
    expect(window.localStorage.getItem('chord-canvas-language')).toBe('th')
  })
})
