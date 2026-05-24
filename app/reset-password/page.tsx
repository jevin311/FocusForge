'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthHeader from '@/components/ui/AuthHeader'

export default function ResetPassword() {
    const supabase = createClient()
    const router = useRouter()

    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState('')

    async function handleUpdatePassword() {
        if (password != confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        toast.success('Password updated!')
        router.push('/')
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] px-4">

            <AuthHeader />

            <div className="w-full max-w-sm">
                <p className="text-[var(--text-primary)] font-semibold mb-1">
                    Set new password
                </p>
                <p className="text-[var(--text-muted)] text-sm mb-6">
                    Create a new password for your account.
                </p>

                <Input
                    label="New password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                />

                <Input
                    label="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                />

                <div className="mb-6" />

                <Button onClick={handleUpdatePassword} loading={loading}>
                    Update password
                </Button>

            </div>
        </main>
    )


}