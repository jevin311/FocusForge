'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthCard from '@/components/ui/AuthCard'
import { toast } from 'sonner'
import GoogleButton from '@/components/ui/GoogleButton'

// login page function
export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast.success('Email verified! you can now log in.')
    }
    if (searchParams.get('error') === 'auth') {
      toast.error('Something went wrong. Please try again.')
    }
  }, [searchParams])

  // If user already has an active session, skip login and go straight to dashboard
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.replace('/dashboard')
      }
    }

    checkSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fix for bfcache — prevents frozen back/forward navigation issues after OAuth
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        window.location.reload()
      }
    }

    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  // email/password login
  async function handleEmailLogin() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Incorrect email or password.')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email before logging in')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard?login=email')
  }

  // google login
  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=google`,
      },
    })

    if (error) toast.error(error.message)
  }

  return (
    <AuthCard>
      <div className="flex flex-col w-full max-w-[320px] mx-auto gap-3">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-1">
            <span className="text-[var(--text-primary)]">Focus</span>
            <span className="text-[var(--accent-orange)]">Forge</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Your focus, forged daily.
          </p>
        </div>

        {/* email input */}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
        />

        {/* password input */}
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {/* forgot password */}
        <div className="flex justify-end -mb-2">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--accent-orange)] hover:text-[var(--accent-dim)]"
          >
            Forgot password?
          </Link>
        </div>

        {/* login button */}
        <Button onClick={handleEmailLogin} loading={loading}>
          Log in
        </Button>

        {/* separator */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[var(--text-faint)] text-xs uppercase tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        {/* google login */}
        <GoogleButton onClick={handleGoogleLogin} />

        {/* sign up */}
        <p className="text-center text-[var(--text-muted)] text-sm mt-8">
          No account yet?{' '}
          <Link
            href="/signup"
            className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}