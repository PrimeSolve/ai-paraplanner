import { useState, useEffect } from 'react'
import CashflowModel from './cashflow-model.jsx'
import { DEMO_DATA } from './constants/demoData.js'

const hasApiConfig = !!import.meta.env.VITE_API_URL

// Check for client_id in URL query parameters
const urlClientId = (() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('client_id') || params.get('clientId');
})()

/**
 * Standalone mode — CashflowModel using mock/seed data.
 * Active when VITE_API_URL is NOT configured AND no client_id in URL.
 */
function StandaloneApp() {
  return (
    <div>
      <CashflowModel initialData={DEMO_DATA} />
    </div>
  )
}

/**
 * Connected mode — with MSAL auth, client list, and advice request loading.
 * Active when VITE_API_URL IS configured.
 */
function ConnectedApp() {
  // Lazy-load auth & pages to avoid MSAL initialization in standalone mode
  const [AuthProvider, setAuthProvider] = useState(null)
  const [LoginPage, setLoginPage] = useState(null)
  const [ClientListPage, setClientListPage] = useState(null)
  const [AdviceRequestPage, setAdviceRequestPage] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      import('./auth/AuthProvider.jsx'),
      import('./pages/LoginPage.jsx'),
      import('./pages/ClientListPage.jsx'),
      import('./pages/AdviceRequestPage.jsx'),
      import('./api/apiClient.js'),
    ]).then(([authMod, loginMod, clientMod, adviceMod, apiClientMod]) => {
      setAuthProvider(() => authMod.AuthProvider)
      setLoginPage(() => loginMod.default)
      setClientListPage(() => clientMod.default)
      setAdviceRequestPage(() => adviceMod.default)
      setLoaded(true)
    })
  }, [])

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#64748b' }}>
        Loading...
      </div>
    )
  }

  return (
    <AuthProvider>
      <ConnectedRouter
        LoginPage={LoginPage}
        ClientListPage={ClientListPage}
        AdviceRequestPage={AdviceRequestPage}
      />
    </AuthProvider>
  )
}

/**
 * Simple hash-based router for connected mode.
 * Avoids react-router-dom to keep things simple and avoid extra configuration.
 * Routes: #/ → client list, #/advice/:id → advice request, #/login → login
 */
function ConnectedRouter({ LoginPage, ClientListPage, AdviceRequestPage }) {
  // Lazy import useAuth to avoid calling it outside AuthProvider
  const [auth, setAuth] = useState(null)
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    import('./auth/AuthProvider.jsx').then(mod => {
      // We need to get useAuth from the module — but we can't call hooks conditionally.
      // Instead, we'll render a child component that uses the hook.
    })
  }, [])

  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  const navigate = (path) => {
    window.location.hash = path
  }

  return (
    <RouterInner
      route={route}
      navigate={navigate}
      LoginPage={LoginPage}
      ClientListPage={ClientListPage}
      AdviceRequestPage={AdviceRequestPage}
    />
  )
}

function RouterInner({ route, navigate, LoginPage, ClientListPage, AdviceRequestPage }) {
  // Now we can safely import and use useAuth since we're inside AuthProvider
  const [useAuth, setUseAuth] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('./auth/AuthProvider.jsx').then(mod => {
      setUseAuth(() => mod.useAuth)
      setReady(true)
    })
  }, [])

  if (!ready) return null

  return <AuthenticatedRouter
    route={route}
    navigate={navigate}
    useAuth={useAuth}
    LoginPage={LoginPage}
    ClientListPage={ClientListPage}
    AdviceRequestPage={AdviceRequestPage}
  />
}

function AuthenticatedRouter({ route, navigate, useAuth, LoginPage, ClientListPage, AdviceRequestPage }) {
  const { isAuthenticated, getAccessToken } = useAuth()

  // Wire MSAL token into apiClient so all API calls include the Bearer token
  useEffect(() => {
    if (isAuthenticated) {
      import('./api/apiClient.js').then(mod => {
        mod.setTokenProvider(getAccessToken)
      })
    }
  }, [isAuthenticated, getAccessToken])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Parse route
  const adviceMatch = route.match(/^#\/advice\/(.+)$/)
  if (adviceMatch) {
    return (
      <AdviceRequestPage
        adviceRequestId={adviceMatch[1]}
        onNavigateBack={() => navigate('#/')}
      />
    )
  }

  return <ClientListPage onNavigate={navigate} />
}

/**
 * Client ID mode — when client_id is present in the URL query string.
 * Initializes MSAL, acquires a token silently, wires the token provider
 * into apiClient, then renders CashflowModel which fetches the client data.
 */
function ClientIdApp() {
  const [AuthProvider, setAuthProvider] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      import('./auth/AuthProvider.jsx'),
      import('./api/apiClient.js'),
    ]).then(([authMod, apiClientMod]) => {
      setAuthProvider(() => authMod.AuthProvider)
      setLoaded(true)
    })
  }, [])

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#64748b' }}>
        Loading...
      </div>
    )
  }

  return (
    <AuthProvider>
      <ClientIdAuthGate />
    </AuthProvider>
  )
}

/**
 * Inside AuthProvider: wires the MSAL token into apiClient,
 * triggers login if not authenticated, then renders CashflowModel.
 */
function ClientIdAuthGate() {
  const [useAuth, setUseAuth] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('./auth/AuthProvider.jsx').then(mod => {
      setUseAuth(() => mod.useAuth)
      setReady(true)
    })
  }, [])

  if (!ready) return null
  return <ClientIdAuthGateInner useAuth={useAuth} />
}

function ClientIdAuthGateInner({ useAuth }) {
  const { isAuthenticated, getAccessToken, login } = useAuth()
  const [tokenWired, setTokenWired] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      import('./api/apiClient.js').then(mod => {
        mod.setTokenProvider(getAccessToken)
        setTokenWired(true)
      })
    }
  }, [isAuthenticated, getAccessToken])

  if (!isAuthenticated) {
    // Trigger login redirect automatically
    login()
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#64748b' }}>
        Redirecting to sign in...
      </div>
    )
  }

  if (!tokenWired) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', color: '#64748b' }}>
        Acquiring token...
      </div>
    )
  }

  return (
    <div>
      <CashflowModel />
    </div>
  )
}

export default function App() {
  const [factFind, setFactFind] = useState(null)

  // Listen for CLIENT_DATA messages from a parent window (e.g. iframe host)
  // to load client data directly into the cashflow engine.
  useEffect(() => {
    const handler = (event) => {
      if (event.data && event.data.type === 'CLIENT_DATA') {
        setFactFind(event.data.payload)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // If client data was received via postMessage, render the cashflow engine directly
  if (factFind) {
    return (
      <div>
        <CashflowModel initialData={factFind} />
      </div>
    )
  }

  // When client_id is in the URL, authenticate via MSAL and fetch client data
  if (urlClientId) {
    return <ClientIdApp />
  }

  // When API is configured, use connected mode (MSAL auth + client routing)
  if (hasApiConfig) {
    return <ConnectedApp />
  }
  // No API config — standalone demo mode
  return <StandaloneApp />
}
