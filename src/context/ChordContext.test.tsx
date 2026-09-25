import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const audio = {
  play: vi.fn(),
  stop: vi.fn(),
}

vi.mock('../audio/GuitarAudio', () => ({
  GuitarAudio: class { constructor() { return audio } },
}))

import { ChordProvider, useChordContext } from './ChordContext'

function Controls() {
  const context = useChordContext()
  return <>
    <output>{context.selectedNotes.join(',')}|{String(context.reversed)}|{context.matches.length}</output>
    <button onClick={() => context.toggleNote(0, 60)}>toggle</button>
    <button onClick={context.toggleStringOrder}>reverse</button>
    <button onClick={() => context.chooseChord([0, 4, 7])}>choose</button>
    <button onClick={context.playSelectedChord}>play</button>
    <button onClick={context.clearSelection}>clear</button>
  </>
}

describe('ChordProvider', () => {
  it('shares selection, matching, playback, and string order controls', () => {
    render(<ChordProvider><Controls /></ChordProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }))
    expect(screen.getByText(/0\|false\|/)).toBeInTheDocument()
    expect(audio.play).toHaveBeenCalledWith([60])

    fireEvent.click(screen.getByRole('button', { name: 'reverse' }))
    expect(screen.getByText(/0\|true\|/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'choose' }))
    expect(screen.getByText(/0,4,7\|true\|/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'play' }))
    expect(audio.play).toHaveBeenLastCalledWith([48, 52, 55], true)

    fireEvent.click(screen.getByRole('button', { name: 'clear' }))
    expect(screen.getByText(/\|true\|0/)).toBeInTheDocument()
    expect(audio.stop).toHaveBeenCalledTimes(1)
  })

  it('requires a provider for context consumers', () => {
    const ThrowingConsumer = () => {
      useChordContext()
      return null
    }
    expect(() => render(<ThrowingConsumer />)).toThrow('useChordContext must be used within a ChordProvider.')
  })
})
