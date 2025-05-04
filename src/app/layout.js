import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
// import OfflineIndicator from "./components/OfflineIndicator";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Add service worker registration
const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        registration => {
          console.log('ServiceWorker registration successful');
        },
        err => {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    });
  }
};

export const metadata = {
  title: "Notess - Your Modern Note Taking App",
  description: "A Notion-like notes taking application with powerful editing features",
  manifest: "/manifest.json",
  icons: {
    apple: [
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" }
    ]
  }
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }) {
  // Register service worker on component mount
  if (typeof window !== 'undefined') {
    registerServiceWorker();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Notess" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Notess" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          {/* <OfflineIndicator /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
