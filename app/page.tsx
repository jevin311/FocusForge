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


//login page function
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

  //2 different login methods, first is email password
  async function handleEmailLogin() {
    setLoading(true)

    //aysnc allow supabase to authenticate login info, if theres error, {error} will have value
    const { data, error } = await supabase.auth.signInWithPassword({
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

    //add param when logging in so that dashboard can show pop up welcome msg
    router.push('/dashboard?login=email')
  }

  //second method is using google
  async function handleGoogleLogin() {
    //use supabase 3rd party OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        //refer to app/auth/callback, redirect to dashboard
        redirectTo: `${window.location.origin}/auth/callback?type=google`
      }
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

        {/*password input */}
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {/*forget password*/}
        <div className="flex justify-end -mb-2">
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
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          <span className="text-[var(--text-faint)] text-xs uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>

        {/*google login button*/}
        <GoogleButton onClick={handleGoogleLogin} />

        {/*sign up button*/}
        <p className="text-center text-[var(--text-muted)] text-sm mt-8">
          No account yet?{' '}
          <Link href="/signup" className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]">
            Sign up
          </Link>
        </p>
      </div>
  
    </AuthCard>
  )
}

