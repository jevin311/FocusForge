import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
    userName: string | null
}

export default function Sidebar({ userName }: SidebarProps) {
    const supabase = createClient()
    const router = useRouter()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div
            style={{
                background: 'rgba(0,0,0,0.2)',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '24px',
                gap: '6px',
            }}
        >
            {/* Top Forge Icon + Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div
                        style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            background: 'rgba(249,115,22,0.12)',
                            border: '1px solid rgba(249,115,22,0.25)',
                        }}
                    >
                        <span style={{ fontSize: '22px', lineHeight: 1 }}>⚒</span>
                        <span
                            style={{
                                fontSize: '9px',
                                color: '#f97316',
                                letterSpacing: '.04em',
                            }}
                        >
                            Forge
                        </span>
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

            {/* Remaining Sidebar Buttons */}
            {[
                { icon: '📅', label: 'Calendar', active: false },
                { icon: '📊', label: 'Stats', active: false },
            ].map((btn) => (
                <div
                    key={btn.label}
                    style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        background: btn.active ? 'rgba(249,115,22,0.12)' : 'transparent',
                        border: btn.active ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
                    }}
                >
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>{btn.icon}</span>
                    <span
                        style={{
                            fontSize: '9px',
                            color: btn.active ? '#f97316' : 'rgba(255,255,255,0.3)',
                            letterSpacing: '.04em',
                        }}
                    >
                        {btn.label}
                    </span>
                </div>
            ))}
        </div>
    )
}
