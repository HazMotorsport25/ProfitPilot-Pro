import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ProfitPilot Pro",
  description: "A comprehensive e-commerce profit calculator designed for Shopify and eBay sellers",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}