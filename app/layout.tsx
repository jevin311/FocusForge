import "./globals.css";
import { Toaster } from "sonner"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'FocusForge',
  description: 'Study smarter. Track your real focus.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        {/*toaster is for the pop up when theres an error/sonner*/}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  )
}
