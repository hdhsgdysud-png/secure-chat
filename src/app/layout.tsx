import "./globals.css";

export const metadata = {
  title: 'FALCON',
  description: 'Secure Messaging',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
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