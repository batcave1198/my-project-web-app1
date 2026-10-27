import { BackgroundMusic } from "@/components/store/background-music";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getActiveMusicTrack } from "@/lib/music";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const music = await getActiveMusicTrack();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {music && <BackgroundMusic src={music.url} title={music.title} />}
    </div>
  );
}
