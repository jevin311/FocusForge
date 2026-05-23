'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'


//login page function
export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  //2 different login methods, first is email password
  async function handleEmailLogin() {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email, password
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

  //second method is using google
  async function handleGoogleLogin() {
    //use supabase 3rd party OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#0C0B09] px-4">

      <h1 className="text-4xl font-bold text-[#EDE5D2] mb-2">FocusForge</h1>
      <p className="text-[#6A6058] mb-8">Your focus, forged daily.</p>

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
            className="text-sm text-[#FF8230] hover:text-[#D45618]"
          >
            Forgot password?
          </Link>
        </div>

        <Button onClick={handleEmailLogin} loading={loading}>
          Log in
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#2A2820]" />
          <span className="text-[#3C3628] text-sm">or</span>
          <div className="flex-1 h-px bg-[#2A2820]" />
        </div>

        <Button onClick={handleGoogleLogin} variant="outline">
          Continue with Google
        </Button>

        <p className="text-center text-[#6A6058] text-sm mt-6">
          No account yet?{' '}
          <Link href="/signup" className="text-[#FF8230] hover:text-[#D45618]">
            Sign up
          </Link>
        </p>

      </div>
    </main>
  )
}