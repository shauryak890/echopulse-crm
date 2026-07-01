import { useState } from 'react'
import Sidebar from './components/Sidebar'
import { ToastProvider } from './components/Toast'
import { useLeads } from './hooks/useLeads'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { IconAlert } from './components/icons'

import LeadsPage from './pages/LeadsPage'
import ImportPage from './pages/ImportPage'
import PipelinePage from './pages/PipelinePage'
import SearchStringsPage from './pages/SearchStringsPage'
import TemplatesPage from './pages/TemplatesPage'

export default function App() {
  const [page, setPage] = useState('leads')
  const leadsState = useLeads()

  return (
    <ToastProvider>
      <div className="app">
        <Sidebar
          active={page}
          onNavigate={setPage}
          leadCount={leadsState.leads.length}
        />
        <main className="main">
          {!isSupabaseConfigured && <SetupBanner />}
          {page === 'leads' && <LeadsPage state={leadsState} />}
          {page === 'import' && <ImportPage state={leadsState} />}
          {page === 'pipeline' && <PipelinePage state={leadsState} />}
          {page === 'search' && <SearchStringsPage />}
          {page === 'templates' && <TemplatesPage />}
        </main>
      </div>
    </ToastProvider>
  )
}

// Shown only when .env hasn't been filled in. Keeps the app usable (no white
// screen, no console errors) and tells the user exactly what to do.
function SetupBanner() {
  return (
    <div style={{ padding: '26px 30px 0' }}>
      <div className="banner banner-warn">
        <IconAlert className="banner-icon" />
        <div>
          <strong>Supabase isn’t connected yet.</strong> Add{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a{' '}
          <code>.env</code> file in the project root, then restart{' '}
          <code>npm run dev</code>. See the README and <code>schema.sql</code> for setup.
          The reference pages (Search Strings, Templates) work without it.
        </div>
      </div>
    </div>
  )
}
