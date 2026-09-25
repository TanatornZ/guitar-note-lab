import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const audio = { play: vi.fn(), stop: vi.fn() }

vi.mock('../audio/GuitarAudio', () => ({
  GuitarAudio: class { constructor() { return audio } },
}))

import { ChordFinderPage } from './ChordFinderPage'

describe('ChordFinderPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lets a player select notes, choose a chord result, reverse and clear', () => {
    render(<ChordFinderPage />)
    fireEvent.click(screen.getByRole('button', { name: 'C' }))
    fireEvent.click(screen.getByRole('button', { name: 'E' }))
    fireEvent.click(screen.getByRole('button', { name: 'G' }))

    expect(screen.getByText('C ×')).toBeInTheDocument()
    expect(screen.getAllByText('C').length).toBeGreaterThan(1)
    fireEvent.click(screen.getByRole('button', { name: /C.*exact set/ }))
    expect(screen.getByText('E ×')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reverse strings' }))
    expect(screen.getByRole('button', { name: 'Normal strings' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Play selected chord/ }))
    expect(audio.play).toHaveBeenLastCalledWith([48, 52, 55], true)
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryByText('C ×')).not.toBeInTheDocument()
    expect(audio.stop).toHaveBeenCalledTimes(1)
  })

  it('plays a clicked fret through the guitar engine', () => {
    render(<ChordFinderPage />)
    fireEvent.click(screen.getByRole('button', { name: 'E string, fret 1, F' }))
    expect(audio.play).toHaveBeenCalledWith([41])
  })
})
