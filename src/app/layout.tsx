import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import SweetAlertProvider from "@/components/sweet-alert-provider";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบขอใช้รถยนต์ | โรงพยาบาลเกษตรวิสัย",
  description: "ระบบบริหารการขอใช้รถยนต์สำหรับบุคลากรโรงพยาบาลเกษตรวิสัย",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={prompt.variable}>
        <SweetAlertProvider />
        {children}
      </body>
    </html>
  );
}
