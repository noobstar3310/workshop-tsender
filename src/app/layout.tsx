import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ReactNode } from "react";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "TSender",
  description: "A simple token sender",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {props.children}
        </Providers>
      </body>
    </html>
  );
}
