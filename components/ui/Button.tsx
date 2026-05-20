interface ButtonProps {
    onClick?: () => void
    loading?: boolean
    disabled?: boolean
    children: React.ReactNode
    variant?: 'primary' | 'outline'
}

export default function Button({
    onClick,
    loading,
    disabled,
    children,
    variant = 'primary'
}: ButtonProps) {
    const base = "w-full py-3 rounded-lg font-medium transition disabled:opacity-50"
    const styles = {
        primary: "bg-[#FF8230] text-white hover:bg-[#D45618]",
        outline: "border border-[#2A2820] text-[#EDE5D2] hover:bg-[#1A1814]"
    }

    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`${base} ${styles[variant]}`}
        >
            {loading ? 'Loading...' : children}
        </button>
    )
}