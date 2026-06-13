import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next
  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeNext(requestUrl.searchParams.get('next'))

  console.log('[auth/callback] has code', Boolean(code))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  console.log('[auth/callback] exchange success', !exchangeError)

  if (exchangeError) {
    return NextResponse.redirect(new URL('/login?error=callback_failed', requestUrl.origin))
  }

  const { data: { user } } = await supabase.auth.getUser()
  console.log('[auth/callback] has user', Boolean(user))
  console.log('[auth/callback] user email', user?.email)

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=no_user', requestUrl.origin))
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  console.log('[auth/callback] profile exists', Boolean(profile))

  if (!profile && !profileError) {
    const { error: rpcError } = await supabase.rpc('create_profile_for_current_user')
    if (rpcError) {
      console.log('[auth/callback] profile creation failed', rpcError.message)
      return NextResponse.redirect(new URL('/login?error=profile_failed', requestUrl.origin))
    }
  }

  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
  const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
  const isNewUser = Math.abs(lastSignInAt - createdAt) < 60_000

  const destination = isNewUser ? '/onboarding' : next
  console.log('[auth/callback] redirecting to', destination)

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
