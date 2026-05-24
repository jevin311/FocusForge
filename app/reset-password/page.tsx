'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AuthCard from '@/components/ui/AuthCard'

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
        <AuthCard>
            <div className="flex flex-col w-full max-w-[320px] mx-auto gap-3">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">
                        Set new password
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">
                        Choose a strong password for your account.
                    </p>
                </div>

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
        </AuthCard >
    )
}