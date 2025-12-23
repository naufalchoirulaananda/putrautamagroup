"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const API = "https://putrautamagroup.id/api";
const IMAGE_BASE = "https://putrautamagroup.id/public/mobileapp/app/mpu/docs/";

export default function DetailLaporanPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [realVolume, setRealVolume] = useState("");
  const [status, setStatus] = useState("DITERIMA");
  const [respon, setRespon] = useState("");
  const [loading, setLoading] = useState(true);

  /* load detail */
  useEffect(() => {
    fetch(`${API}/laporan-detail.php?id=${id}`)
      .then(res => res.json())
      .then(json => {
        setData(json.data);
        setRealVolume(json.data.realVolume ?? "");
        setImages(json.data.images ?? []);
        setLoading(false);
      });
  }, [id]);

  /* submit verifikasi */
  const submit = async () => {
    if (status === "DITOLAK" && respon.length < 10) {
      alert("Alasan penolakan minimal 10 karakter");
      return;
    }

    await fetch(`${API}/verifikasi-laporan.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idLaporan: data.idLaporan,
        statusVerifikasi: status,
        realVolume: realVolume,
        responVerifikasi: respon,
      }),
    });

    alert("Laporan berhasil diverifikasi");
    router.back();
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold">Form Verifikasi Laporan</h1>

      {/* DATA */}
      <Input readOnly value={data.namaLaporan} placeholder="Kelompok Laporan" />
      <Input readOnly value={data.namaMaterial} placeholder="Material" />
      <Input readOnly value={data.nomorPlat} placeholder="Nomor Plat" />
      <Input readOnly value={data.suratJalan} placeholder="Surat Jalan" />

      {/* DIMENSI */}
      <div className="grid grid-cols-5 gap-2">
        <Input readOnly value={data.panjang} placeholder="Panjang" />
        <Input readOnly value={data.lebar} placeholder="Lebar" />
        <Input readOnly value={data.tinggi} placeholder="Tinggi" />
        <Input readOnly value={data.ta} placeholder="TA" />
        <Input readOnly value={data.tp} placeholder="TP" />
      </div>

      <Input readOnly value={data.volume} placeholder="Volume" />

      {/* FOTO */}
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <img
            key={i}
            src={`${IMAGE_BASE}${img}`}
            className="w-40 h-40 object-cover rounded border cursor-pointer"
            onClick={() => window.open(`${IMAGE_BASE}${img}`, "_blank")}
          />
        ))}
      </div>

      {/* VERIFIKASI */}
      <h2 className="font-semibold mt-6">Verifikasi</h2>

      <Input
        placeholder="Real Volume"
        value={realVolume}
        onChange={e => setRealVolume(e.target.value)}
      />

      <RadioGroup value={status} onValueChange={setStatus}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="DITERIMA" />
          <span>DITERIMA</span>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="DITOLAK" />
          <span>DITOLAK</span>
        </div>
      </RadioGroup>

      {status === "DITOLAK" && (
        <Textarea
          placeholder="Alasan penolakan"
          value={respon}
          onChange={e => setRespon(e.target.value)}
        />
      )}

      {/* ACTION */}
      <div className="flex gap-3">
        <Button onClick={submit}>Verifikasi</Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </div>
  );
}
