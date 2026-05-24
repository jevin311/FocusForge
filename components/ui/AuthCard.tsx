export default function AuthCard({ children }: { children: React.ReactNode }) {
    return (
        <main className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden bg-[var(--bg-base)] px-4 py-8">
            <div className="w-full max-w-[420px] px-8 sm:px-10 pt-[20px] pb-[20px] bg-[var(--bg-form)] border-t-4 border-[var(--accent-orange)] rounded-2xl shadow-xl shadow-[var(--accent-orange)]/5">
                <div className="flex flex-col w-full items-center">
                    {children}
                </div>
            </div>
        </main>
    )
}