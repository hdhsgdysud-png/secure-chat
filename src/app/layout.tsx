import "./globals.css";

export const metadata = {
  title: 'FALCON',
  description: 'Secure Messaging',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-slate-900">{children}</body>
    </html>
  )
}