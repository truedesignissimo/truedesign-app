import type { Metadata } from "next";
import pcsData from "./data/pcs.json";
import { ArchivioPc } from "./archive-pc";
import type { PcRecord } from "./domain/archive";

export const metadata: Metadata = {
  title: "Archivio PC · True Design",
  description: "Archivio in sola lettura dei computer aziendali True Design.",
  robots: { index: false, follow: false },
};

export default function ArchivioPcPage() {
  return <ArchivioPc pcs={pcsData as PcRecord[]} />;
}
