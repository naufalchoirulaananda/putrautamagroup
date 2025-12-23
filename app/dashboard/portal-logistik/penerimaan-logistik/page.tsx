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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import CameraCaptureAP from "@/components/portal-logistik/CameraCapture";
import { useRouter } from "next/navigation";

interface LokasiData {
  id: number;
  nama_lokasi: string;
  created_at: string;
}

interface AlertDialogState {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  redirectOnClose?: boolean;
}

interface DeleteConfirmState {
  open: boolean;
  lokasiId: number | null;
  lokasiName: string;
}

function Page() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState<Date | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [lokasi, setLokasi] = useState("");
  const [lokasiList, setLokasiList] = useState<LokasiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLokasi, setLoadingLokasi] = useState(true);

  // Dialog Manajemen Lokasi
  const [lokasiDialogOpen, setLokasiDialogOpen] = useState(false);
  const [namaLokasiInput, setNamaLokasiInput] = useState("");
  const [editingLokasi, setEditingLokasi] = useState<LokasiData | null>(null);
  const [loadingLokasiAction, setLoadingLokasiAction] = useState(false);

  // Delete Confirmation Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    open: false,
    lokasiId: null,
    lokasiName: "",
  });

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    open: false,
    type: "success",
    title: "",
    message: "",
    redirectOnClose: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    namaItem: "",
    periode: new Date().getFullYear().toString(),
    qty: "",
    keterangan: "",
  });

  useEffect(() => {
    fetchLokasi();
  }, []);

  const fetchLokasi = async () => {
    setLoadingLokasi(true);
    try {
      const response = await fetch("/api/logistik/lokasi-logistik");
      const result = await response.json();

      if (result.success) {
        setLokasiList(result.data);
      }
    } catch (error) {
      console.error("Error fetching lokasi:", error);
      showAlert("error", "Error", "Gagal memuat data lokasi", false);
    } finally {
      setLoadingLokasi(false);
    }
  };

  const showAlert = (
    type: "success" | "error",
    title: string,
    message: string,
    redirectOnClose: boolean = false
  ) => {
    setAlertDialog({
      open: true,
      type,
      title,
      message,
      redirectOnClose,
    });
  };

  const closeAlert = () => {
    const shouldRedirect = alertDialog.redirectOnClose;
    setAlertDialog({
      ...alertDialog,
      open: false,
    });

    // Redirect ke laporan-logistik hanya jika sukses submit form utama
    if (shouldRedirect) {
      router.push("/dashboard/portal-logistik/laporan-logistik");
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
      namaItem: "",
      periode: new Date().getFullYear().toString(),
      qty: "",
      keterangan: "",
    });
    setTanggal(null);
    setLokasi("");
    setPhotos([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.namaItem ||
      !tanggal ||
      !lokasi ||
      !formData.periode ||
      !formData.qty
    ) {
      showAlert(
        "error",
        "Validasi Error",
        "Mohon isi semua field yang wajib (bertanda *)",
        false
      );
      return;
    }

    const qtyInput = document.getElementById("qty") as HTMLInputElement;
    const qtyValue = qtyInput.value.trim();

    setLoading(true);

    try {
      const submitFormData = new FormData();

      submitFormData.append("namaItem", formData.namaItem);

      const year = tanggal.getFullYear();
      const month = String(tanggal.getMonth() + 1).padStart(2, "0");
      const day = String(tanggal.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      submitFormData.append("tanggalPembelian", formattedDate);

      submitFormData.append("lokasi", lokasi);
      submitFormData.append("periode", formData.periode);
      submitFormData.append("qty", qtyValue);
      submitFormData.append("keterangan", formData.keterangan);

      photos.forEach((photo, index) => {
        submitFormData.append(`foto_${index + 1}`, photo);
      });

      const response = await fetch("/api/logistik/penerimaan-logistik", {
        method: "POST",
        body: submitFormData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert(
          "success",
          "Berhasil!",
          `Data logistik "${formData.namaItem}" sebanyak ${qtyValue} unit berhasil disimpan ke lokasi ${lokasi}.`,
          true // Redirect ke laporan setelah submit form utama
        );
        handleReset();
      } else {
        throw new Error(result.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      showAlert(
        "error",
        "Gagal Menyimpan",
        error.message ||
          "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
        false
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== MANAJEMEN LOKASI ==========
  const handleOpenLokasiDialog = () => {
    setLokasiDialogOpen(true);
    setNamaLokasiInput("");
    setEditingLokasi(null);
  };

  const handleCloseLokasiDialog = () => {
    setLokasiDialogOpen(false);
    setNamaLokasiInput("");
    setEditingLokasi(null);
  };

  const handleAddLokasi = async () => {
    if (!namaLokasiInput.trim()) {
      showAlert("error", "Error", "Nama lokasi tidak boleh kosong", false);
      return;
    }

    setLoadingLokasiAction(true);
    try {
      const response = await fetch("/api/logistik/lokasi-logistik", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_lokasi: namaLokasiInput.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("success", "Berhasil!", "Lokasi berhasil ditambahkan", false);
        setNamaLokasiInput("");
        fetchLokasi(); // Refresh data lokasi
      } else {
        throw new Error(result.error || "Gagal menambahkan lokasi");
      }
    } catch (error: any) {
      showAlert("error", "Error", error.message, false);
    } finally {
      setLoadingLokasiAction(false);
    }
  };

  const handleEditLokasi = (lokasi: LokasiData) => {
    setEditingLokasi(lokasi);
    setNamaLokasiInput(lokasi.nama_lokasi);
  };

  const handleUpdateLokasi = async () => {
    if (!editingLokasi || !namaLokasiInput.trim()) {
      showAlert("error", "Error", "Nama lokasi tidak boleh kosong", false);
      return;
    }

    setLoadingLokasiAction(true);
    try {
      const response = await fetch("/api/logistik/lokasi-logistik", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingLokasi.id,
          nama_lokasi: namaLokasiInput.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("success", "Berhasil!", "Lokasi berhasil diperbarui", false);
        setNamaLokasiInput("");
        setEditingLokasi(null);
        fetchLokasi(); // Refresh data lokasi
      } else {
        throw new Error(result.error || "Gagal memperbarui lokasi");
      }
    } catch (error: any) {
      showAlert("error", "Error", error.message, false);
    } finally {
      setLoadingLokasiAction(false);
    }
  };

  const handleOpenDeleteConfirm = (id: number, namaLokasi: string) => {
    setDeleteConfirm({
      open: true,
      lokasiId: id,
      lokasiName: namaLokasi,
    });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({
      open: false,
      lokasiId: null,
      lokasiName: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.lokasiId) return;

    setLoadingLokasiAction(true);
    handleCloseDeleteConfirm(); // Tutup dialog konfirmasi

    try {
      const response = await fetch(
        `/api/logistik/lokasi-logistik?id=${deleteConfirm.lokasiId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        showAlert("success", "Berhasil!", "Lokasi berhasil dihapus", false);
        fetchLokasi(); // Refresh data lokasi
      } else {
        throw new Error(result.error || "Gagal menghapus lokasi");
      }
    } catch (error: any) {
      showAlert("error", "Error", error.message, false);
    } finally {
      setLoadingLokasiAction(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLokasi(null);
    setNamaLokasiInput("");
  };

  return (
    <>
      <div className="@container mx-auto p-4 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Penerimaan Logistik</h1>
          <p className="text-gray-500 mt-2">
            Formulir lengkap untuk mencatat setiap barang logistik yang baru
            diterima ke dalam sistem
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
                    <Label htmlFor="namaItem">
                      Nama Item
                    </Label>
                    <Input
                      id="namaItem"
                      type="text"
                      className="text-sm"
                      placeholder="Masukkan nama item..."
                      value={formData.namaItem}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label>
                      Tanggal Pembelian
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
                              : "Pilih tanggal pembelian..."}
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
                    <Label htmlFor="lokasi">
                      Lokasi
                    </Label>

                    <div className="flex items-center gap-2">
                      {/* Select Lokasi */}
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
                                <SelectItem
                                  key={lok.id}
                                  value={lok.nama_lokasi}
                                >
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

                      {/* Tombol Tambah Lokasi */}
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 cursor-pointer"
                        onClick={handleOpenLokasiDialog}
                      >
                        Tambah Lokasi
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="periode">
                      Periode Pembelian
                    </Label>
                    <Input
                      id="periode"
                      type="text"
                      className="text-sm"
                      placeholder="Contoh: Q1 2024, Januari 2024"
                      value={formData.periode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="qty">
                    Jumlah Logistik
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
                  <Label>Foto Aset (Maksimal 10 foto)</Label>
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
                    placeholder="Tuliskan keterangan lengkap..."
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

      {/* Dialog Manajemen Lokasi */}
      <Dialog open={lokasiDialogOpen} onOpenChange={setLokasiDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manajemen Lokasi Logistik</DialogTitle>
            <DialogDescription>
              Tambah, edit, atau hapus lokasi penyimpanan logistik
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Form Tambah/Edit Lokasi */}
            <div className="space-y-3">
              <Label htmlFor="namaLokasi">
                {editingLokasi ? "Edit Nama Lokasi" : "Tambah Lokasi Baru"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="namaLokasi"
                  placeholder="Masukkan nama lokasi..."
                  value={namaLokasiInput}
                  onChange={(e) => setNamaLokasiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      editingLokasi ? handleUpdateLokasi() : handleAddLokasi();
                    }
                  }}
                  className="flex-1"
                />
                {editingLokasi ? (
                  <>
                    <Button
                      onClick={handleUpdateLokasi}
                      disabled={loadingLokasiAction}
                    >
                      {loadingLokasiAction ? "Menyimpan..." : "Update"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={loadingLokasiAction}
                    >
                      Batal
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddLokasi}
                    disabled={loadingLokasiAction}
                  >
                    {loadingLokasiAction ? "Menambah..." : "Tambah"}
                  </Button>
                )}
              </div>
            </div>

            {/* Tabel Lokasi dengan ScrollArea */}
            <div className="space-y-2">
              <Label>Daftar Lokasi</Label>
              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Nama Lokasi</TableHead>
                      <TableHead className="text-center w-32">Opsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingLokasi ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : lokasiList.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-8 text-gray-500"
                        >
                          Belum ada data lokasi
                        </TableCell>
                      </TableRow>
                    ) : (
                      lokasiList.map((lok, index) => (
                        <TableRow key={lok.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {lok.nama_lokasi}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditLokasi(lok)}
                                disabled={loadingLokasiAction}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleOpenDeleteConfirm(
                                    lok.id,
                                    lok.nama_lokasi
                                  )
                                }
                                disabled={loadingLokasiAction}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseLokasiDialog}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Konfirmasi Hapus */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={handleCloseDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus lokasi{" "}
              <span className="font-semibold">
                "{deleteConfirm.lokasiName}"
              </span>
              ?
              <br />
              <br />
              Lokasi tidak dapat dihapus jika masih digunakan dalam data
              logistik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog untuk Success/Error */}
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
            <DialogDescription className="pt-3 text-base">
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
