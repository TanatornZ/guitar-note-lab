import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const audio = {
  prepare: vi.fn().mockResolvedValue(true),
  playStrum: vi.fn(),
  playMetronome: vi.fn(),
  stop: vi.fn(),
  setTone: vi.fn(),
}

vi.mock('../audio/GuitarAudio', () => ({
  GuitarAudio: class { constructor() { return audio } },
}))

import { StrumStudioPage } from './StrumStudioPage'
import { STRUM_CHORDS } from '../data/strumChords'

const midis = (id: string) => STRUM_CHORDS.find((chord) => chord.id === id)!.midis

describe('StrumStudioPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.useRealTimers())

  it('edits its sequence, groove controls, and strum pattern', async () => {
    const user = userEvent.setup()
    render(<StrumStudioPage />)

    expect(screen.getByRole('link', { name: 'Strum Studio' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Chord finder' })).toHaveAttribute('href', '/finder')
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
    expect(audio.playStrum).toHaveBeenCalledWith([48, 52, 55, 60, 64], 'down', true)

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

  it('updates and resets guitar tone during a performance without stopping the loop', async () => {
    render(<StrumStudioPage />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Play performance/ })) })
    fireEvent.change(screen.getByRole('slider', { name: 'Bass' }), { target: { value: '5' } })
    fireEvent.change(screen.getByRole('slider', { name: 'Middle' }), { target: { value: '-4' } })
    fireEvent.change(screen.getByRole('slider', { name: 'Treble' }), { target: { value: '7' } })
    expect(audio.setTone).toHaveBeenLastCalledWith({ bass: 5, middle: -4, treble: 7 })
    expect(screen.getByText('+5 dB')).toBeInTheDocument()
    expect(screen.getByText('-4 dB')).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Treble' })).toHaveAttribute('aria-valuetext', '7 decibels')
    fireEvent.click(screen.getByRole('button', { name: 'Reset guitar tone' }))
    expect(audio.setTone).toHaveBeenLastCalledWith({ bass: 0, middle: 0, treble: 0 })
    for (const name of ['Bass', 'Middle', 'Treble']) expect(screen.getByRole('slider', { name })).toHaveValue('0')
    expect(audio.stop).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Stop performance/ })).toBeInTheDocument()
  })

  it('loads an editable practice preset without automatically playing', () => {
    render(<StrumStudioPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Load practice preset' }))
    expect(screen.getByText('82 BPM')).toBeInTheDocument()
    expect(screen.getByLabelText('Time signature')).toHaveValue('4/4')
    expect(screen.getByLabelText('Rhythm grid')).toHaveValue('4')
    expect(screen.getAllByRole('button', { name: /^Accent step/ })).toHaveLength(16)
    expect(screen.getByLabelText('Duration of chord 1, C')).toHaveValue('2')
    expect(screen.getByLabelText('Duration of chord 7, C')).toHaveValue('1')
    expect(screen.getByRole('button', { name: /Metronome off/ })).toBeInTheDocument()
    expect(audio.prepare).not.toHaveBeenCalled()
    expect(audio.playStrum).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Accent step 1' }))
    expect(screen.getByRole('button', { name: 'Accent step 1' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.change(screen.getByLabelText('Duration of chord 1, C'), { target: { value: '4' } })
    expect(screen.getByLabelText('Duration of chord 1, C')).toHaveValue('4')
    fireEvent.click(screen.getByRole('button', { name: 'Load practice preset' }))
    expect(screen.getByRole('button', { name: 'Accent step 1' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Duration of chord 1, C')).toHaveValue('2')
  })

  it('plays sixteenth-note rests, accents, mid-bar changes, and a complete looping progression', async () => {
    vi.useFakeTimers()
    const { unmount } = render(<StrumStudioPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Load practice preset' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Play performance/ })) })
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('C'), 'down', true)
    const stepMs = 60000 / 82 / 4
    act(() => vi.advanceTimersByTime(stepMs))
    expect(audio.playStrum).toHaveBeenCalledTimes(1) // Step 2 rings without another attack.
    act(() => vi.advanceTimersByTime(stepMs))
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('C'), 'down', false)
    act(() => vi.advanceTimersByTime(stepMs))
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('C'), 'up', false)
    act(() => vi.advanceTimersByTime(stepMs * 5))
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('G'), 'down', true)
    act(() => vi.advanceTimersByTime(stepMs * 8))
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('Am'), 'down', true)
    act(() => vi.advanceTimersByTime(stepMs * 48))
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('C'), 'down', true)
    expect(audio.playMetronome).not.toHaveBeenCalled()
    unmount()
    const count = audio.playStrum.mock.calls.length
    act(() => vi.advanceTimersByTime(5000))
    expect(audio.playStrum).toHaveBeenCalledTimes(count)
  })

  it('keeps metronome clicks on numbered beats and respects custom chord durations', async () => {
    vi.useFakeTimers()
    render(<StrumStudioPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Load practice preset' }))
    fireEvent.change(screen.getByLabelText('Duration of chord 1, C'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Metronome off/ }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Play performance/ })) })
    const stepMs = 60000 / 82 / 4
    expect(audio.playMetronome).toHaveBeenCalledWith(true)
    act(() => vi.advanceTimersByTime(stepMs * 3))
    expect(audio.playMetronome).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(stepMs * 2))
    expect(audio.playMetronome).toHaveBeenCalledTimes(2)
    expect(audio.playMetronome).toHaveBeenLastCalledWith(false)
    expect(audio.playStrum).toHaveBeenLastCalledWith(midis('G'), 'up', false)
    // Loading a preset stops an ongoing performance and resets the sequence.
    fireEvent.click(screen.getByRole('button', { name: 'Load practice preset' }))
    expect(screen.getByRole('button', { name: /Play performance/ })).toBeInTheDocument()
    const count = audio.playStrum.mock.calls.length
    act(() => vi.advanceTimersByTime(5000))
    expect(audio.playStrum).toHaveBeenCalledTimes(count)
  })

  it('cancels a pending start when a preset replaces the sequence', async () => {
    let ready!: (value: boolean) => void
    audio.prepare.mockReturnValueOnce(new Promise<boolean>((resolve) => { ready = resolve }))
    render(<StrumStudioPage />)
    fireEvent.click(screen.getByRole('button', { name: /Play performance/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Load practice preset' }))
    await act(async () => ready(true))
    expect(audio.playStrum).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Play performance/ })).toBeInTheDocument()
  })
})
