"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  Building2,
  Eye,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from "next/navigation";

interface MutasiHistory {
  kode_mutasi: string;
  kode_aset: string;
  nama_aset: string;
  tipe_mutasi: string;
  divisi_asal: string;
  nama_divisi_asal: string;
  cabang_asal?: string;
  nama_cabang_asal?: string;
  penanggung_jawab_asal?: string;
  nama_penanggung_jawab_asal?: string;
  divisi_tujuan: string;
  nama_divisi_tujuan: string;
  cabang_tujuan?: string;
  nama_cabang_tujuan?: string;
  penanggung_jawab_tujuan?: string;
  nama_penanggung_jawab_tujuan?: string;
  tanggal_mutasi: string;
  alasan_mutasi?: string;
  keterangan?: string;
  nama_pembuat: string;
  status: string;
  foto_bukti_1?: string;
  foto_bukti_2?: string;
  foto_bukti_3?: string;
  foto_bukti_4?: string;
  foto_bukti_5?: string;
}

export default function MutasiAsetPage() {
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [mutasiHistory, setMutasiHistory] = useState<MutasiHistory[]>([]);
  const [selectedMutasi, setSelectedMutasi] = useState<MutasiHistory | null>(
    null
  );
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const searchParams = useSearchParams();
  const highlightKodeAset = searchParams.get("kode_aset");
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    fetchMutasiHistory();
  }, []);

  useEffect(() => {
    if (highlightKodeAset && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    }
  }, [highlightKodeAset, mutasiHistory]);

  const fetchMutasiHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch("/api/mutasi-aset");
      const data = await response.json();

      if (data.success) {
        setMutasiHistory(data.data);
      }
    } catch (error) {
      console.error("Error fetching mutasi history:", error);
      toast.error("Gagal memuat riwayat mutasi");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTipeMutasi = (tipe: string) => {
    if (tipe === "antar_divisi") return "Antar Divisi";
    if (tipe === "antar_cabang") return "Antar Cabang";
    return tipe;
  };

  const getFotoBukti = (mutasi: MutasiHistory): string[] => {
    const photos: string[] = [];
    if (mutasi.foto_bukti_1) photos.push(mutasi.foto_bukti_1);
    if (mutasi.foto_bukti_2) photos.push(mutasi.foto_bukti_2);
    if (mutasi.foto_bukti_3) photos.push(mutasi.foto_bukti_3);
    if (mutasi.foto_bukti_4) photos.push(mutasi.foto_bukti_4);
    if (mutasi.foto_bukti_5) photos.push(mutasi.foto_bukti_5);
    return photos;
  };

  const handleOpenDetail = (mutasi: MutasiHistory) => {
    setSelectedMutasi(mutasi);
    setCurrentPhotoIndex(0);
  };

  const handlePrevPhoto = () => {
    if (!selectedMutasi) return;
    const photos = getFotoBukti(selectedMutasi);
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (!selectedMutasi) return;
    const photos = getFotoBukti(selectedMutasi);
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="container mx-auto p-4 px-4">
      <div className="mb-6">
        <p className="text-3xl font-semibold">Riwayat Mutasi Aset</p>
        <p className="text-gray-500 mt-1">
          Log perpindahan aset antar divisi atau cabang
        </p>
      </div>

      <Separator className="my-4" />

      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : mutasiHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Belum ada riwayat mutasi</p>
        </div>
      ) : (
        <div className="border p-4 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kode Mutasi</TableHead>
                <TableHead>Aset</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Dari</TableHead>
                <TableHead>Ke</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Dibuat Oleh</TableHead>
                <TableHead className="text-center">Foto Bukti</TableHead>
                <TableHead className="text-center w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mutasiHistory.map((mutasi) => {
                const fotoBukti = getFotoBukti(mutasi);
                return (
                  <TableRow
                    key={mutasi.kode_mutasi}
                    className={`${
                      highlightKodeAset === mutasi.kode_aset
                        ? "border-2 border-yellow-400"
                        : ""
                    }`}
                  >
                    <TableCell className="font-medium py-6">
                      {mutasi.kode_mutasi}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mutasi.nama_aset}</p>
                        <p className="text-xs text-gray-500">
                          {mutasi.kode_aset}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="px-4 py-2 rounded-lg">
                        {formatTipeMutasi(mutasi.tipe_mutasi)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{mutasi.nama_divisi_asal}</p>
                        {mutasi.nama_cabang_asal && (
                          <p className="text-xs text-gray-600">
                            {mutasi.nama_cabang_asal}
                          </p>
                        )}
                        {mutasi.nama_penanggung_jawab_asal && (
                          <p className="text-xs text-gray-600">
                            Penanggung Jawab {mutasi.nama_penanggung_jawab_asal}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {mutasi.nama_divisi_tujuan}
                        </p>
                        {mutasi.nama_cabang_tujuan && (
                          <p className="text-xs text-gray-600">
                            {mutasi.nama_cabang_tujuan}
                          </p>
                        )}
                        {mutasi.nama_penanggung_jawab_tujuan && (
                          <p className="text-xs text-gray-600">
                            Penanggung Jawab:{" "}
                            {mutasi.nama_penanggung_jawab_tujuan}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {formatDate(mutasi.tanggal_mutasi)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{mutasi.nama_pembuat}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      {fotoBukti.length > 0 ? (
                        <Badge variant="secondary">
                          {fotoBukti.length} Foto
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenDetail(mutasi)}
                            className="text-xs cursor-pointer"
                          >
                            Lihat Detail Mutasi
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detail Mutasi</DialogTitle>
                            <DialogDescription>
                              {selectedMutasi?.kode_mutasi}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedMutasi && (
                            <div className="space-y-4">
                              {/* Info Aset */}
                              <Card>
                                <CardContent className="p-4">
                                  <h3 className="font-semibold mb-2">
                                    Informasi Aset
                                  </h3>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-gray-600">
                                        Nama Aset:
                                      </p>
                                      <p className="font-medium">
                                        {selectedMutasi.nama_aset}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">
                                        Kode Aset:
                                      </p>
                                      <p className="font-medium">
                                        {selectedMutasi.kode_aset}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Info Mutasi */}
                              <Card>
                                <CardContent className="p-4">
                                  <h3 className="font-semibold mb-2">
                                    Detail Perpindahan
                                  </h3>
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-2">
                                      <Building2 className="h-4 w-4 mt-0.5 text-red-500" />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">
                                          Dari:
                                        </p>
                                        <p className="text-sm">
                                          {selectedMutasi.nama_divisi_asal}
                                        </p>
                                        {selectedMutasi.nama_cabang_asal && (
                                          <p className="text-sm text-gray-600">
                                            Cabang:{" "}
                                            {selectedMutasi.nama_cabang_asal}
                                          </p>
                                        )}
                                        {selectedMutasi.nama_penanggung_jawab_asal && (
                                          <p className="text-sm text-gray-600">
                                            Penanggung Jawab:{" "}
                                            {
                                              selectedMutasi.nama_penanggung_jawab_asal
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-center">
                                      <div className="bg-gray-100 px-2 py-2 rounded-lg">
                                        <ArrowDown className="h-5 w-5" />
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                      <Building2 className="h-4 w-4 mt-0.5 text-green-500" />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">
                                          Ke:
                                        </p>
                                        <p className="text-sm">
                                          {selectedMutasi.nama_divisi_tujuan}
                                        </p>
                                        {selectedMutasi.nama_cabang_tujuan && (
                                          <p className="text-sm text-gray-600">
                                            Cabang:{" "}
                                            {selectedMutasi.nama_cabang_tujuan}
                                          </p>
                                        )}
                                        {selectedMutasi.nama_penanggung_jawab_tujuan && (
                                          <p className="text-sm text-gray-600">
                                            Penanggung Jawab:{" "}
                                            {
                                              selectedMutasi.nama_penanggung_jawab_tujuan
                                            }
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Alasan & Keterangan */}
                              {(selectedMutasi.alasan_mutasi ||
                                selectedMutasi.keterangan) && (
                                <Card>
                                  <CardContent className="p-4">
                                    <h3 className="font-semibold mb-2">
                                      Keterangan
                                    </h3>
                                    {selectedMutasi.alasan_mutasi && (
                                      <div className="mb-2">
                                        <p className="text-sm text-gray-600">
                                          Alasan Mutasi:
                                        </p>
                                        <p className="text-sm">
                                          {selectedMutasi.alasan_mutasi}
                                        </p>
                                      </div>
                                    )}
                                    {selectedMutasi.keterangan && (
                                      <div>
                                        <p className="text-sm text-gray-600">
                                          Keterangan Tambahan:
                                        </p>
                                        <p className="text-sm">
                                          {selectedMutasi.keterangan}
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Foto Bukti */}
                              {getFotoBukti(selectedMutasi).length > 0 && (
                                <Card>
                                  <CardContent className="p-4">
                                    <h3 className="font-semibold mb-3">
                                      Foto Bukti Mutasi
                                    </h3>

                                    {/* Main Photo Display */}
                                    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden mb-3">
                                      <Image
                                        src={
                                          getFotoBukti(selectedMutasi)[
                                            currentPhotoIndex
                                          ]
                                        }
                                        fill
                                        alt={`Foto bukti ${
                                          currentPhotoIndex + 1
                                        }`}
                                        className="object-contain"
                                      />

                                      {getFotoBukti(selectedMutasi).length >
                                        1 && (
                                        <>
                                          <button
                                            onClick={handlePrevPhoto}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                                          >
                                            <ChevronLeft className="w-5 h-5" />
                                          </button>
                                          <button
                                            onClick={handleNextPhoto}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                                          >
                                            <ChevronRight className="w-5 h-5" />
                                          </button>
                                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                            {currentPhotoIndex + 1} /{" "}
                                            {
                                              getFotoBukti(selectedMutasi)
                                                .length
                                            }
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Thumbnails */}
                                    {getFotoBukti(selectedMutasi).length >
                                      1 && (
                                      <div className="grid grid-cols-5 gap-2">
                                        {getFotoBukti(selectedMutasi).map(
                                          (photo, index) => (
                                            <button
                                              key={index}
                                              onClick={() =>
                                                setCurrentPhotoIndex(index)
                                              }
                                              className={`relative aspect-square rounded overflow-hidden border-2 ${
                                                currentPhotoIndex === index
                                                  ? "border-blue-500"
                                                  : "border-gray-200"
                                              }`}
                                            >
                                              <Image
                                                src={photo}
                                                fill
                                                alt={`Thumbnail ${index + 1}`}
                                                className="object-cover"
                                              />
                                            </button>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )}

                              {/* Info Tambahan */}
                              <Card>
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">
                                        Tanggal Mutasi:
                                      </p>
                                      <p className="font-medium">
                                        {formatDate(
                                          selectedMutasi.tanggal_mutasi
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">
                                        Dibuat Oleh:
                                      </p>
                                      <p className="font-medium">
                                        {selectedMutasi.nama_pembuat}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
