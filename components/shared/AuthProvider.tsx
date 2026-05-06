import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

type AuthContextType = {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true })

// Fetches and listens to Supabase auth state, exposing session to the entire app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Keep session in sync with Supabase auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Convenience hook for consuming auth state anywhere in the app
export const useAuth = () => useContext(AuthContext)