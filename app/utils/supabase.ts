import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const createClientSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const pairs = document.cookie.split(';').map(pair => pair.trim())
        return pairs.map(pair => {
          const [name, ...rest] = pair.split('=')
          const value = rest.join('=')
          return { name, value }
        }).filter(cookie => cookie.name && cookie.value)
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options = {} }) => {
          const cookieStr = `${name}=${value}`
          const expires = options.maxAge ? new Date(Date.now() + options.maxAge * 1000).toUTCString() : ''
          
          document.cookie = [
            cookieStr,
            options.path ? `path=${options.path}` : 'path=/',
            expires ? `expires=${expires}` : '',
            options.domain ? `domain=${options.domain}` : '',
            options.sameSite ? `SameSite=${options.sameSite}` : '',
            options.secure ? 'Secure' : ''
          ].filter(Boolean).join('; ')
        })
      }
    }
  })
} 