"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import CameraCaptureAP from "@/components/portal-logistik/CameraCapture";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface LokasiData {
  id: number;
  nama_lokasi: string;
}

interface StokData {
  id: number;
  nama_item: string;
  lokasi: string;
  qty_total: number;
}

interface AlertDialog {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
}

function Page() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState<Date | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [lokasi, setLokasi] = useState("");
  const [namaItem, setNamaItem] = useState("");
  const [lokasiList, setLokasiList] = useState<LokasiData[]>([]);
  const [itemList, setItemList] = useState<StokData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLokasi, setLoadingLokasi] = useState(true);
  const [stokTersedia, setStokTersedia] = useState<number>(0);

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState<AlertDialog>({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    periode: new Date().getFullYear().toString(),
    qty: "",
    keterangan: "",
  });

  useEffect(() => {
    fetchLokasi();
  }, []);

  useEffect(() => {
    if (lokasi) {
      fetchItemsByLokasi(lokasi);
    } else {
      setItemList([]);
      setNamaItem("");
      setStokTersedia(0);
    }
  }, [lokasi]);

  useEffect(() => {
    if (namaItem && lokasi) {
      const selectedItem = itemList.find(
        (item) => item.nama_item === namaItem && item.lokasi === lokasi
      );
      setStokTersedia(selectedItem?.qty_total || 0);
    } else {
      setStokTersedia(0);
    }
  }, [namaItem, lokasi, itemList]);

  const showAlert = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    setAlertDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeAlert = () => {
    setAlertDialog({
      ...alertDialog,
      open: false,
    });

    // Redirect ke riwayat-perbaikan jika sukses
    if (alertDialog.type === "success") {
      router.push("/dashboard/portal-logistik/riwayat-perbaikan");
    }
  };

  const fetchLokasi = async () => {
    try {
      const response = await fetch(
        "/api/logistik/penerimaan-logistik?type=lokasi"
      );
      const result = await response.json();

      if (result.success) {
        setLokasiList(result.data);
      }
    } catch (error) {
      console.error("Error fetching lokasi:", error);
      showAlert("error", "Error", "Gagal memuat data lokasi");
    } finally {
      setLoadingLokasi(false);
    }
  };

  const fetchItemsByLokasi = async (selectedLokasi: string) => {
    try {
      const response = await fetch(
        `/api/logistik/laporan-logistik?lokasi=${selectedLokasi}&limit=1000`
      );
      const result = await response.json();

      if (result.success) {
        setItemList(result.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleCapture = (files: File[]) => {
    setPhotos(files);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleReset = () => {
    setFormData({
      periode: new Date().getFullYear().toString(),
      qty: "",
      keterangan: "",
    });
    setTanggal(null);
    setLokasi("");
    setNamaItem("");
    setPhotos([]);
    setStokTersedia(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !namaItem ||
      !tanggal ||
      !lokasi ||
      !formData.periode ||
      !formData.qty
    ) {
      showAlert(
        "error",
        "Validasi Error",
        "Mohon isi semua field yang wajib (bertanda *)"
      );
      return;
    }

    const qtyInput = document.getElementById("qty") as HTMLInputElement;
    const qtyValue = qtyInput.value.trim();
    const qtyPerbaikan = parseInt(qtyValue, 10);

    if (isNaN(qtyPerbaikan) || qtyPerbaikan <= 0) {
      showAlert(
        "error",
        "Input Tidak Valid",
        "Jumlah harus berupa angka positif"
      );
      return;
    }

    if (qtyPerbaikan > stokTersedia) {
      showAlert(
        "error",
        "Stok Tidak Cukup",
        `Jumlah yang diminta (${qtyPerbaikan} unit) melebihi stok tersedia (${stokTersedia} unit)`
      );
      return;
    }

    setLoading(true);

    try {
      const submitFormData = new FormData();

      submitFormData.append("namaItem", namaItem);

      // ===== FIX TIMEZONE: Format tanggal manual tanpa konversi UTC =====
      const year = tanggal.getFullYear();
      const month = String(tanggal.getMonth() + 1).padStart(2, "0");
      const day = String(tanggal.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      console.log("🔍 DEBUG Tanggal:");
      console.log("Tanggal object:", tanggal);
      console.log("Tanggal yang dikirim:", formattedDate);

      submitFormData.append("tanggalPerbaikan", formattedDate);
      // ==================================================================

      submitFormData.append("lokasi", lokasi);
      submitFormData.append("periode", formData.periode);
      submitFormData.append("qty", qtyValue);
      submitFormData.append("keterangan", formData.keterangan);

      photos.forEach((photo, index) => {
        submitFormData.append(`foto_${index + 1}`, photo);
      });

      const response = await fetch("/api/logistik/perbaikan-logistik", {
        method: "POST",
        body: submitFormData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert(
          "success",
          "Berhasil!",
          `Perbaikan/pengambilan "${namaItem}" sebanyak ${result.debug.qtyDikurangi} unit berhasil dicatat.\n\nStok sebelumnya: ${result.debug.stokSebelum} unit\nStok tersisa: ${result.debug.stokTersisa} unit`
        );

        handleReset();
        if (lokasi) fetchItemsByLokasi(lokasi);
      } else {
        throw new Error(result.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      showAlert(
        "error",
        "Gagal Menyimpan",
        error.message ||
          "Terjadi kesalahan saat memproses data. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="@container mx-auto p-4 px-4">
        <header className="mb-4">
          <h1 className="text-3xl font-bold">
            Perbaikan / Pengambilan Logistik
          </h1>
          <p className="text-gray-500 mt-2">
            Formulir untuk mencatat pengambilan atau perbaikan logistik
          </p>
        </header>
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <Card className="mx-4">
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="lokasi">
                      Lokasi
                    </Label>
                    <Select value={lokasi} onValueChange={setLokasi} required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih lokasi..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Lokasi</SelectLabel>
                          {loadingLokasi ? (
                            <SelectItem value="loading" disabled>
                              Memuat...
                            </SelectItem>
                          ) : lokasiList.length > 0 ? (
                            lokasiList.map((lok) => (
                              <SelectItem key={lok.id} value={lok.nama_lokasi}>
                                {lok.nama_lokasi}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>
                              Tidak ada data lokasi
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="namaItem">
                      Nama Item
                    </Label>
                    <Select
                      value={namaItem}
                      onValueChange={setNamaItem}
                      disabled={!lokasi}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih item..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Item</SelectLabel>
                          {itemList.length > 0 ? (
                            itemList.map((item) => (
                              <SelectItem key={item.id} value={item.nama_item}>
                                {item.nama_item} (Stok: {item.qty_total})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="empty" disabled>
                              Tidak ada item di lokasi ini
                            </SelectItem>
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label>
                      Tanggal Perbaikan
                    </Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-between font-normal ${
                            !tanggal && "text-muted-foreground"
                          }`}
                          type="button"
                        >
                          <span>
                            {tanggal
                              ? tanggal.toLocaleDateString("id-ID")
                              : "Pilih tanggal..."}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Calendar
                          mode="single"
                          selected={tanggal ?? undefined}
                          onSelect={(d) => {
                            setTanggal(d ?? null);
                            setOpen(false);
                          }}
                          className="w-full"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="periode">
                      Periode
                    </Label>
                    <Input
                      id="periode"
                      type="text"
                      className="text-sm"
                      placeholder="Contoh: Q1 2024"
                      value={formData.periode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {stokTersedia > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Stok tersedia: <strong>{stokTersedia}</strong> unit
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="qty">
                    Jumlah yang Diambil
                  </Label>
                  <Input
                    id="qty"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="text-sm"
                    placeholder="Masukkan jumlah..."
                    value={formData.qty}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        qty: value,
                      }));
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto (Opsional, Maksimal 10 foto)</Label>
                  <div className="border rounded-lg sm:p-4">
                    <CameraCaptureAP onCapture={handleCapture} />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Textarea
                    id="keterangan"
                    className="text-sm"
                    rows={4}
                    placeholder="Tuliskan keterangan..."
                    value={formData.keterangan}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? "Menyimpan..." : "Submit"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Alert Dialog */}
      <Dialog open={alertDialog.open} onOpenChange={closeAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {alertDialog.type === "success" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <DialogTitle className="text-xl">{alertDialog.title}</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-base whitespace-pre-line">
              {alertDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              onClick={closeAlert}
              className="w-full sm:w-auto"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Page;
