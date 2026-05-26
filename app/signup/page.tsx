'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthCard from '@/components/ui/AuthCard'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import GoogleButton from '@/components/ui/GoogleButton'

export default function Signup() {
    const supabase = createClient()
    const router = useRouter()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    //normal signup with email, pw
    async function handleSignup() {
        if (!name.trim()) {
            toast.error('Please enter your name')
            return
        }
        if (password != confirmPassword) {
            toast.error('Password do not match')
            return
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            //configuration: where to redirect to, the error handle later
            options: {
                //emailRedirectTo used in email flows (signup, password reset)
                //check app/auth/callback as well, go to dashboard 
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    full_name: name.trim() //save name to user metadata
                }
            }
        })

        //this will decide the redirection
        if (error) {
            if (error.message.includes('already registered') ||
                error.message.includes('already in use') ||
                error.message.includes('User already registered')
            ) {
                toast.error('An account with this email already exists')
            } else {
                toast.error(error.message)
            }
            setLoading(false)
            return
        }

        if (data.user && data.user.identities && data.user.identities.length === 0) {
            toast.error('An account with this email already exists')
            setLoading(false)
            return
        }

        toast.success('Account created! Check your email to verify')
        router.push('/')
    }

    async function handleGoogleLogin() {
        setGoogleLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                //refer to app/auth/callback, redirect to dashboard
                redirectTo: `${window.location.origin}/auth/callback?type=google`
            }
        })
        if (error) {
            toast.error(error.message)
            setGoogleLoading(false)
        }
    }


    return (
        <AuthCard>

            <div className="flex flex-col w-full max-w-[320px] mx-auto gap-3">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
                        Create account
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">
                        Start forging your focus today.
                    </p>
                </div>

                <Input
                    label="Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                />

                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
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

                <Button onClick={handleSignup} loading={loading}>
                    Create account
                </Button>

                <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                    <span className="text-[var(--text-faint)] text-xs uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                </div>

                <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />

                <p className="text-center text-[var(--text-muted)] text-sm mt-8">
                    Already have an account?{' '}
                    <Link href="/" className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]">
                        Log in
                    </Link>
                </p>
            </div>

        </AuthCard >
    )
}