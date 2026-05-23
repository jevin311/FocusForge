//ensure type safety of the button
interface ButtonProps {
    onClick?: () => void
    loading?: boolean
    disabled?: boolean
    children: React.ReactNode
    variant?: 'primary' | 'outline'
}

//just a button 
export default function Button({
    onClick,
    loading,
    disabled,
    children,
    variant = 'primary'
}: ButtonProps) {
    //the base styling
    const base = "w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
    //dynamic styling when theres action on the button
    const styles = {
        primary: "bg-[var(--accent-orange)] text-white hover:bg-[var(--accent-dim)]",
        outline: "border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
    }

    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`${base} ${styles[variant]}`}
        >
            {/* if loading is true, spinning animation as svg, else will just load */}
            {loading ? (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            ) : children}
        </button>
    )
}