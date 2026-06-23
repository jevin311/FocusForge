// Sidebar.tsx
'use client'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  userName: string | null
  userAvatar?: string | null
}

const NAV_ITEMS = [
  { icon: '⚒', label: 'Forge', href: '/dashboard' },
  { icon: '📅', label: 'Analytics', href: '/analytics' },
  { icon: '🎵', label: 'Lofi', href: '/lofi' },
]

export default function Sidebar({ userName }: SidebarProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '20px',
      gap: '8px',
    }}>

      {/* Account dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div style={{
            width: '45px', height: '45px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: '8px', flexShrink: 0,
            background: 'rgb(30, 20, 0)',
            border: '2px solid rgba(249,115,22,0.25)',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>👤</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48 ml-2">
          <DropdownMenuLabel>{userName || 'My Account'}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Nav items */}
      {NAV_ITEMS.map((btn) => {
        const active = pathname === btn.href
        return (
          <div
            key={btn.label}
            onClick={() => router.push(btn.href)}
            style={{
              width: '52px', height: '52px', borderRadius: '12px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px', cursor: 'pointer',
              background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
              border: active ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
            }}
          >
            <div style={{ fontSize: '22px', lineHeight: 1 }}>{btn.icon}</div>
            <span style={{
              fontSize: '9px',
              color: active ? '#f97316' : 'rgba(255,255,255,0.3)',
              letterSpacing: '.04em',
            }}>
              {btn.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}