'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthHeader from '@/components/ui/AuthHeader'

export default function forgotPassword() {
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleReset() {
        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `{window.location.origin}/reset-password`
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
        <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] px-4">

            <AuthHeader />

            <div className="w-full max-w-sm">
                <p className="text-[var(--text-primary)] font-semibold mb-1">
                    Reset your password
                </p>
                <p className="text-[var(--text-muted)] text-sm mb-6">
                    Enter your email and we will send you a reset link.
                </p>

                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="input your email"
                />

                <div className="mb-6" />
                
                <Button onClick={handleReset} loading={loading}>
                    Send reset link
                </Button>

                <p className="text-center text-[var(--text-muted)] text-sm mt-6">
                    Remembered it?{' '}
                    <Link href="/" className="text-[var(--accent-orange)] hover:text-[var(--accent-dim)]">
                    Back to login
                    </Link>
                </p>
            </div>
        </main>
    )
}