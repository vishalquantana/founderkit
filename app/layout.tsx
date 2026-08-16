import type { Metadata } from "next";
import { Geist_Mono, Orbitron, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/AppNav";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quantana AI Cofounder",
  description:
    "Quantana AI Cofounder — an AI-powered founder diagnostic. Answer 6 quick questions and get your startup readiness view with a 7-day action plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${chakraPetch.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("mrs-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}var f=Number(localStorage.getItem("mrs-fontpx"));if(f>=14&&f<=24){document.documentElement.style.fontSize=f+"px";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
