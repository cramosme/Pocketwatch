import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Central fetch wrapper for all backend API calls
// Automatically attaches the user's JWT token to every request
// so the backend middleware can verify who is calling
export async function api(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}