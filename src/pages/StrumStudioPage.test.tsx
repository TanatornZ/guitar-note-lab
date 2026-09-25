import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const audio = {
  prepare: vi.fn().mockResolvedValue(true),
  playStrum: vi.fn(),
  playMetronome: vi.fn(),
  stop: vi.fn(),
}

vi.mock('../audio/GuitarAudio', () => ({
  GuitarAudio: class { constructor() { return audio } },
}))

import { StrumStudioPage } from './StrumStudioPage'

describe('StrumStudioPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('edits its sequence, groove controls, and strum pattern', async () => {
    const user = userEvent.setup()
    render(<StrumStudioPage />)

    expect(screen.getByText('Your progression')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear sequence' }))
    expect(screen.getByText('Choose chords above to create your loop.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Play performance/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Add at least one chord')

    fireEvent.click(screen.getByRole('button', { name: /Add chord/ }))
    expect(screen.getByLabelText('Remove C')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Remove C'))
    expect(screen.getByText('Choose chords above to create your loop.')).toBeInTheDocument()

    const search = screen.getByRole('combobox', { name: 'Search a chord' })
    await user.click(search)
    await user.clear(search)
    await user.type(search, 'Gm')
    await user.click(await screen.findByRole('option', { name: 'Gm' }))
    fireEvent.click(screen.getByRole('button', { name: /Add chord/ }))
    expect(screen.getByText('Gm')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Tempo/), { target: { value: '120' } })
    expect(screen.getByText('120 BPM')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Time signature'), { target: { value: '3/4' } })
    expect(screen.getByRole('button', { name: /Beat 3/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Metronome on/ }))
    expect(screen.getByRole('button', { name: /Metronome off/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Add half-beats/ }))
    expect(screen.getByRole('button', { name: /Half-beats on/ })).toBeInTheDocument()
    expect(screen.getAllByText('&')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Beat 1.*Down/ }))
    expect(screen.getByRole('button', { name: /Beat 1.*Up/ })).toBeInTheDocument()
  })

  it('prepares, plays a sequence, then stops it', async () => {
    render(<StrumStudioPage />)
    fireEvent.click(screen.getByRole('button', { name: /Play performance/ }))

    await waitFor(() => expect(audio.prepare).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: /Stop performance/ })).toBeInTheDocument()
    await waitFor(() => expect(audio.playMetronome).toHaveBeenCalledWith(true))
    expect(audio.playStrum).toHaveBeenCalledWith([48, 52, 55, 60, 64], 'down')

    fireEvent.click(screen.getByRole('button', { name: /Stop performance/ }))
    expect(audio.stop).toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Stopped.')
  })

  it('does not start when preparing guitar audio fails', async () => {
    audio.prepare.mockResolvedValueOnce(false)
    render(<StrumStudioPage />)
    fireEvent.click(screen.getByRole('button', { name: /Play performance/ }))
    await waitFor(() => expect(audio.prepare).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: /Play performance/ })).toBeInTheDocument()
  })
})
