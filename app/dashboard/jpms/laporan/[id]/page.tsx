"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = "https://putrautamagroup.id/api";

export default function DetailLaporan() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [realVolume, setRealVolume] = useState("");

  useEffect(() => {
    fetch(`${API}/laporan-detail.php?id=${id}`)
      .then(res => res.json())
      .then(json => setData(json.data));
  }, [id]);

  const verifikasi = async () => {
    await fetch(`${API}/verifikasi-laporan.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idLaporan: id,
        realVolume: realVolume
      })
    });
    router.back();
  };

  if (!data) return null;

  return (
    <div className="p-6 space-y-4">
      <h1 className="font-bold text-xl">Detail Laporan</h1>

      <img
        src={data.gambar}
        className="w-full max-w-md rounded"
      />

      <div>No Plat: {data.nomorPlat}</div>
      <div>Material: {data.namaMaterial}</div>
      <div>Volume: {data.volume}</div>

      {data.statusVerifikasi !== "TERVERIFIKASI" && (
        <>
          <Input
            placeholder="Real Volume"
            value={realVolume}
            onChange={(e) => setRealVolume(e.target.value)}
          />
          <Button onClick={verifikasi}>Verifikasi</Button>
        </>
      )}
    </div>
  );
}
