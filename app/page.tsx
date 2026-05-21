'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email before logging in')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] px-4">
      
      <h1 className="text-4xl font-bold mb-2">
        <span className="text-[var(--text-primary)]">Focus</span>
        <span className="text-[var(--accent-orange)]">Forge</span>
      </h1>

      <p className="text-[var(--text-muted)] mb-8">
        Your focus, forged daily.
      </p>

      <div className="w-full max-w-sm">

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="input your email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="input your password"
        />

        <div className="flex justify-end mb-6">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--accent-orange)] hover:text-[var(--accent-dim)]"
          >
            Forgot password?
          </Link>
        </div>

        <Button onClick={handleEmailLogin} loading={loading}>
          Log in
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[var(--text-faint)] text-sm">or</span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        <Button onClick={handleGoogleLogin} variant="outline">
          Continue with Google
        </Button>

        <p className="text-center text-[var(--text-muted)] text-sm mt-6">
          No account yet?{' '}
          <Link
            href="/signup"
            className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]"
          >
            Sign up
          </Link>
        </p>

      </div>
    </main>
  )
}