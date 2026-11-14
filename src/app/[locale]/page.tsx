import { Suspense } from "react";
import { HomeFeed } from "@/components/home/home-feed";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeFeed />
    </Suspense>
  );
}
