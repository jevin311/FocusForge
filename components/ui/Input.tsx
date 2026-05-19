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
            <label className="block text-[#9A9080] text-sm mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-lg bg-[#1A1814] text-[#EDE5D2] border border-[#2A2820] focus:outline-none focus:border-[#FF8230]"
            />
        </div>
    )
}