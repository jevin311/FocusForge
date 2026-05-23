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

    //aysnc allow supabase to authenticate login info, if theres error, {error} will have value
    const { error } = await supabase.auth.signInWithPassword({
      email, password
    })

    //the error messages if theres error (the predicted error is what supabase usually generate)
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        //same ouput even if account does not exist for security reasons
        toast.error('Incorrect email or password.')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please verify your email before logging in')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    //pop up when successfully logged in
    toast.success("Time to forge!")
    router.push('/dashboard')
  }

  //second method is using google
  async function handleGoogleLogin() {
    //use supabase 3rd party OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        //refer to app/auth/callback, redirect to dashboard
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) toast.error(error.message)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] px-4">

      <AuthHeader />

      <div className="w-full max-w-sm">

        {/* email input */}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="input your email"
        />

        {/*password input */}
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="input your password"
        />

        {/*forget password*/}
        <div className="flex justify-end mb-6">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--accent-orange)] hover:text-[var(--accent-dim)]"
          >
            Forgot password?
          </Link>
        </div>

        {/*log in button*/}
        <Button onClick={handleEmailLogin} loading={loading}>
          Log in
        </Button>

        {/*just a simple "or" between login and google login*/}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[var(--text-faint)] text-sm">or</span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        {/*google login button*/}
        <Button onClick={handleGoogleLogin} variant="outline">
          Continue with Google
        </Button>

        {/*sign up button*/}
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