'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthHeader from '@/components/ui/AuthHeader'
import { toast } from 'sonner'


//login page function
export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  //2 different login methods, first is email password
  async function handleEmailLogin() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email, password
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

    toast.success("Time to forge!")
    router.push('/dashboard')
  }

  //second method is using google
  async function handleGoogleLogin() {
    //use supabase 3rd party OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) toast.error(error.message)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] px-4">

      <AuthHeader />

      <div className="w-full max-w-sm">

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