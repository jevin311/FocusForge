import "./globals.css";
import { Toaster } from "sonner"

export const metadata = {
  title: 'FocusForge',
  description: 'Study smarter. Track your real focus.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/*toaster is for the pop up when theres an error/sonner*/}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  )
}
