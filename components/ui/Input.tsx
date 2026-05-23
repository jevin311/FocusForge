interface InputProps {
    label: string
    type?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
}

export default function Input({
    label,
    type = 'text',
    value,
    onChange,
    placeholder
}: InputProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm text-[var(--text-muted)] mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-input)] focus:border-[var(--accent-orange)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)]"
            />
        </div>
    )
}