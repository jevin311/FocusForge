'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthCard from '@/components/ui/AuthCard'

export default function ForgotPassword() {
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleReset() {
        if (!email) {
            toast.error('Please enter your email')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        //same message even if no account for security reasons
        toast.success('Reset link sent! Check your email.')
        setLoading(false)
    }

    return (
        <AuthCard>

            <div className="flex flex-col w-full max-w-[320px] mx-auto gap-3">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
                        Reset your password
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">
                        Enter your email and we will send you a reset link.
                    </p>
                </div>


                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you.domain.com"
                />

                <div className="mb-8" />

                <Button onClick={handleReset} loading={loading}>
                    Send reset link
                </Button>

                <p className="text-center text-[var(--text-muted)] text-sm mt-8">
                    Remembered it?{' '}
                    <Link href="/" className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]">
                        Back to login
                    </Link>
                </p>

            </div>

        </AuthCard >
    )
}