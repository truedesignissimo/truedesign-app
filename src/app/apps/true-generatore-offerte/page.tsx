import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import OfferGenerator from "./offer-generator";

export default async function TrueOfferGeneratorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <OfferGenerator userId={user.id} />;
}

