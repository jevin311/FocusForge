'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function Signup() {
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    async function handleSignup() {
        setError('')

        if (password != confirmPassword) {
            setError('Password do not match')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 charactersm.')
        }
    }
    
}