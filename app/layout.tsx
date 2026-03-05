import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthHydrate } from "@/components/AuthHydrate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drama Phim - Xem phim online miễn phí",
  description:
    "Xem phim online miễn phí, chất lượng cao. Phim bộ, phim lẻ, hoạt hình mới cập nhật mỗi ngày.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var key = 'drama-phim-theme';
  var stored = typeof localStorage !== 'undefined' && localStorage.getItem(key);
  var theme = 'dark';
  try {
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.state && parsed.state.theme) theme = parsed.state.theme;
    }
  } catch (e) {}
  document.documentElement.classList.toggle('dark', theme === 'dark');
})();
`,
          }}
        />
        <ThemeProvider>
          <AuthHydrate />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
