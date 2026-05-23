import "./globals.css";

export const metadata = {
  title: 'FocusForge',
  description: 'Study smarter. Track your real focus.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
