import { useEffect, useState } from 'react'
import { ChordFinderPage } from './pages/ChordFinderPage'
import { StrumStudioPage } from './pages/StrumStudioPage'

type Page = 'finder' | 'strum'

function currentPage(): Page {
  return window.location.hash === '#/strum' ? 'strum' : 'finder'
}

export default function App() {
  const [page, setPage] = useState<Page>(currentPage)

  useEffect(() => {
    const updatePage = () => setPage(currentPage())
    window.addEventListener('hashchange', updatePage)
    return () => window.removeEventListener('hashchange', updatePage)
  }, [])

  return page === 'strum' ? <StrumStudioPage /> : <ChordFinderPage />
}
