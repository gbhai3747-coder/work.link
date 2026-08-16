import type { Metadata } from "next";

import { FindWorkersClient } from "@/components/workers/find-workers-client";
import { SiteHeader } from "@/components/layout/site-header";
import { mapsConfigured } from "@/lib/geo";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Find Workers",
  description:
    "Find trusted local workers near you by service category and distance.",
};

export const dynamic = "force-dynamic";

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAdminClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, slug")
    .order("name");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <FindWorkersClient
          services={services ?? []}
          initialServiceSlug={params.service}
          mapsEnabled={mapsConfigured()}
        />
      </main>
    </>
  );
}
