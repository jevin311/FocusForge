interface InputProps {
    label: string
    type?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
}

//pretty straight foward, just the place where text is input
export default function Input({
    label,
    type = 'text',
    value,
    onChange,
    placeholder
}: InputProps) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-medium text-[var(--text-muted)] ml-1 text-left">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full h-10 px-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border-2 border-[var(--border-input)] focus:border-[var(--accent-orange)] focus:ring-2 focus:ring-[var(--accent-orange)] focus:outline-none transition-all placeholder:text-[var(--text-faint)] text-sm"
            />
        </div>
    )
}