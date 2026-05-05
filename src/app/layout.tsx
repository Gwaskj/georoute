import "./globals.css";
import Header from "@/components/Header";
import { getHeaderConfig } from "@/lib/headerConfig";
import { ReactNode } from "react";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const config = await getHeaderConfig();

  return (
    <html lang="en">
      <body>
        <Header
          title={config.title}
          logoUrl={config.logo_url}
          bannerUrl={config.banner_url}
          logo_x={config.logo_x}
          logo_y={config.logo_y}
          logo_scale={config.logo_scale}
          banner_offset_x={config.banner_offset_x}
          banner_offset_y={config.banner_offset_y}
        />
        {children}
      </body>
    </html>
  );
}
