'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthHeader from '@/components/ui/AuthHeader'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function Signup() {
    const supabase = createClient()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)


    async function handleSignup() {
        if (password != confirmPassword) {
            toast.error('Password do not match')
            return
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 charactersm.')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            if (error.message.includes('already registered') ||
                error.message.includes('already in use') ||
                error.message.includes('User already registered')) {
                toast.error('An account with this email already exists.')
            } else {
                toast.error(error.message)
            }
            setLoading(false)
            return
        }

        toast.success('Account created! Check your email to verify')
        router.push('/')
    }

    async function handleGoogleLogin() {
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
                    placeholder="At least 6 characters"
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                />

                <div className="mb-6" />

                <Button onClick={handleSignup} loading={loading}>
                    Create account
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
                    Already have an account?{' '}
                    <Link href="/" className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    )
}