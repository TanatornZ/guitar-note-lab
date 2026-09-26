import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./pages/ChordFinderPage', () => ({ ChordFinderPage: () => <div>finder page</div> }))
vi.mock('./pages/StrumStudioPage', () => ({ StrumStudioPage: () => <div>strum page</div> }))

import App from './App'

describe('App', () => {
  beforeEach(() => window.history.replaceState({}, '', '/'))
  afterEach(() => window.history.replaceState({}, '', '/'))

  it('uses Strum Studio as the default main route', () => {
    render(<App />)
    expect(screen.getByText('strum page')).toBeInTheDocument()
  })

  it('changes screens when browser navigation changes the path', async () => {
    render(<App />)
    window.history.pushState({}, '', '/finder')
    fireEvent.popState(window)
    await waitFor(() => expect(screen.getByText('finder page')).toBeInTheDocument())
  })
})
