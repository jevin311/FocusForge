export default function AuthHeader() {
    return (
        //just a part of the authentication pages ui that keeps repeating (header)
        <>
            <h1 className="text-4xl font-bold mb-2">
                <span className="text-[var(--text-primary)]">Focus</span>
                <span className="text-[var(--accent-orange)]">Forge</span>
            </h1>
            <p className="text-[var(--text-muted)] mb-8">
                Your focus, forged daily.
            </p>
        </>
    )
}