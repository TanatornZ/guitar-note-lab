import { useEffect, useState } from 'react'
import { ChordFinderPage } from './pages/ChordFinderPage'
import { StrumStudioPage } from './pages/StrumStudioPage'

type Page = 'finder' | 'strum'

function currentPage(): Page {
  return window.location.pathname === '/finder' ? 'finder' : 'strum'
}

export default function App() {
  const [page, setPage] = useState<Page>(currentPage)

  useEffect(() => {
    const updatePage = () => setPage(currentPage())
    window.addEventListener('popstate', updatePage)
    return () => window.removeEventListener('popstate', updatePage)
  }, [])

  return page === 'strum' ? <StrumStudioPage /> : <ChordFinderPage />
}
