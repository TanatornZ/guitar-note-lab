import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./pages/ChordFinderPage', () => ({ ChordFinderPage: () => <div>finder page</div> }))
vi.mock('./pages/StrumStudioPage', () => ({ StrumStudioPage: () => <div>strum page</div> }))

import App from './App'

describe('App', () => {
  it('uses the finder as the default hash route', () => {
    window.location.hash = '#/'
    render(<App />)
    expect(screen.getByText('finder page')).toBeInTheDocument()
  })

  it('changes screens when the hash changes', async () => {
    window.location.hash = '#/'
    render(<App />)
    window.location.hash = '#/strum'
    fireEvent(window, new HashChangeEvent('hashchange'))
    await waitFor(() => expect(screen.getByText('strum page')).toBeInTheDocument())
  })
})
