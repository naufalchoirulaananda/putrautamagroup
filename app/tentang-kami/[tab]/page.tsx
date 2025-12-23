"use client";
import TentangKami from "@/components/tentang-kami/TentangKami";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const tabParam = params?.tab;

  const tab = Array.isArray(tabParam) ? tabParam[0] : tabParam ?? "sekilas-perusahaan";

  return <TentangKami tab={tab} />;
}
