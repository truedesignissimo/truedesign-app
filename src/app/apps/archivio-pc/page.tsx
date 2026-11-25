import type { Metadata } from "next";
import { getPcAdministrator, loadPcAssets } from "./data/pc-assets";
import { ArchivioPc } from "./archive-pc";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archivio PC · True Design",
  description: "Archivio in sola lettura dei computer aziendali True Design.",
  robots: { index: false, follow: false },
};

export default async function ArchivioPcPage() {
  try {
    const canEdit = Boolean(await getPcAdministrator());
    const { pcs, versions } = await loadPcAssets(canEdit);
    return <ArchivioPc pcs={pcs} versions={versions} />;
  } catch (error) {
    console.error("[archivio-pc] lettura", error);
    return (
      <main>
        <h1>Archivio PC</h1>
        <p>L’archivio è temporaneamente indisponibile.</p>
        <a href="/apps/archivio-pc">Riprova</a>
      </main>
    );
  }
}
