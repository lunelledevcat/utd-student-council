import { HomeView } from "./home-view";

// static + ISR: content refreshes every 10 minutes (approvals also revalidate it at once)
export const revalidate = 600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  return <HomeView locale={(await params).locale} />;
}
