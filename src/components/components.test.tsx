import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'
import { ChordResults } from './ChordResults'
import { GuitarNeck } from './GuitarNeck'
import { NotePicker } from './NotePicker'

describe('finder components', () => {
  it('renders app navigation', () => {
    render(<AppHeader />)
    expect(screen.getByText('Chord Canvas')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Strum Studio' })).toHaveAttribute('href', '#/strum')
  })

  it('renders every named note and reports selections', () => {
    const onToggle = vi.fn()
    render(<NotePicker selectedNotes={[0]} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button', { name: 'C♯' }))
    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it('uses the selected notes, chord cards, and play button', () => {
    const onToggle = vi.fn()
    const onChoose = vi.fn()
    const onPlay = vi.fn()
    render(<ChordResults
      selectedNotes={[0, 4, 7]}
      matches={[{ name: 'C', type: 'major', tones: [0, 4, 7], exact: true }]}
      audioStatus="Ready"
      onToggleNote={onToggle}
      onChooseChord={onChoose}
      onPlayChord={onPlay}
    />)

    fireEvent.click(screen.getByRole('button', { name: /C ×/ }))
    fireEvent.click(screen.getByRole('button', { name: /Play selected chord/ }))
    fireEvent.click(screen.getByRole('button', { name: /exact set/ }))
    expect(onToggle).toHaveBeenCalledWith(0)
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onChoose).toHaveBeenCalledWith([0, 4, 7])
  })

  it('shows empty-result guidance and disabled playback', () => {
    render(<ChordResults selectedNotes={[]} matches={[]} audioStatus="Waiting" onToggleNote={vi.fn()} onChooseChord={vi.fn()} onPlayChord={vi.fn()} />)

    expect(screen.getByText('Choose one or more notes to explore possible chords.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Play selected chord/ })).toBeDisabled()
    expect(screen.getByText('Chord matches will appear here.')).toBeInTheDocument()
  })

  it('reverses strings, clears, and passes a clicked fret to its callback', () => {
    const onReverse = vi.fn()
    const onClear = vi.fn()
    const onFretClick = vi.fn()
    const { rerender } = render(<GuitarNeck selectedNotes={[]} reversed={false} onReverse={onReverse} onClear={onClear} onFretClick={onFretClick}><div>Picker</div></GuitarNeck>)

    fireEvent.click(screen.getByRole('button', { name: 'Reverse strings' }))
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    fireEvent.click(screen.getByRole('button', { name: 'E string, fret 1, F' }))
    expect(onReverse).toHaveBeenCalledTimes(1)
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onFretClick).toHaveBeenCalledWith(5, 41)

    rerender(<GuitarNeck selectedNotes={[5]} reversed onReverse={onReverse} onClear={onClear} onFretClick={onFretClick}><div>Picker</div></GuitarNeck>)
    expect(screen.getByRole('button', { name: 'Normal strings' })).toBeInTheDocument()
  })
})
