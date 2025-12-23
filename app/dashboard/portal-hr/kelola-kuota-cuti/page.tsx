"use client";
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, AlertCircle, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge-cuti-izin";
import { toast } from "sonner";

interface KuotaConfig {
  id: number;
  tahun: number;
  jumlah_hari: number;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

export default function KelolaKuotaCutiPage() {
  const [data, setData] = useState<KuotaConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KuotaConfig | null>(null);
  const [itemToDelete, setItemToDelete] = useState<KuotaConfig | null>(null);

  const [formData, setFormData] = useState({
    id: 0,
    tahun: new Date().getFullYear(),
    jumlah_hari: 12,
    keterangan: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kuota-cuti/config");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: KuotaConfig) => {
    if (item) {
      setEditMode(true);
      setSelectedItem(item);
      setFormData({
        id: item.id,
        tahun: item.tahun,
        jumlah_hari: item.jumlah_hari,
        keterangan: item.keterangan || "",
      });
    } else {
      setEditMode(false);
      setSelectedItem(null);
      setFormData({
        id: 0,
        tahun: new Date().getFullYear(),
        jumlah_hari: 12,
        keterangan: "",
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditMode(false);
    setSelectedItem(null);
    setFormData({
      id: 0,
      tahun: new Date().getFullYear(),
      jumlah_hari: 12,
      keterangan: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tahun || !formData.jumlah_hari) {
      toast.error("Tahun dan jumlah hari harus diisi");
      return;
    }

    if (formData.jumlah_hari < 0 || formData.jumlah_hari > 365) {
      toast.error("Jumlah hari harus antara 0-365");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/kuota-cuti/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        handleCloseDialog();
        fetchData();
      } else {
        toast.error(result.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (item: KuotaConfig) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/kuota-cuti/config?id=${itemToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        toast.error(result.error || "Gagal menghapus data");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Terjadi kesalahan saat menghapus data");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const getCurrentYearConfig = () => {
    const currentYear = new Date().getFullYear();
    return data.find((item) => item.tahun === currentYear);
  };

  const currentConfig = getCurrentYearConfig();

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Kelola Kuota Cuti</h1>
        <p className="text-gray-500 mt-2">
          Manajemen daftar jenis cuti dan izin untuk seluruh karyawan
        </p>
      </header>

      {currentConfig && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-0 items-center">
            <CardHeader className="pb-4 sm:pb-0">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600 sm:block hidden shrink-0" />
                <div>
                  <CardTitle className="text-blue-900 text-lg sm:text-xl">
                    Konfigurasi Tahun {currentConfig.tahun} (Aktif)
                  </CardTitle>
                  <p className="text-sm text-blue-700 mt-1">
                    Kuota cuti yang sedang berlaku untuk tahun ini
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="w-full flex flex-col gap-4">
              <div className="p-4 w-full bg-white rounded-lg flex flex-col justify-center items-center">
                <p className="text-sm text-gray-500 mb-1">Jumlah Hari Cuti Dalam 1 Tahun</p>
                <p className="text-3xl font-bold text-blue-600">
                  {currentConfig.jumlah_hari} Hari
                </p>
              </div>

              {currentConfig.keterangan && (
                <div className="p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Keterangan</p>
                  <p className="text-sm text-gray-700">{currentConfig.keterangan}</p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}

      {/* Main Card */}
      <div className="dark:bg-transparent bg-white border rounded-lg overflow-hidden">
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 p-4 gap-4 border-b">
          <Button onClick={() => handleOpenDialog()} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Konfigurasi
          </Button>
        </div>

        {loading && data.length === 0 ? (
          <div className="text-center py-12">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-2" />
            <>Belum ada konfigurasi kuota cuti</>
            <p className="text-sm mt-1">
              Klik tombol &quot;Tambah Konfigurasi&quot; untuk menambahkan
            </p>
          </div>
        ) : (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Jumlah Hari</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => {
                  const isCurrentYear = item.tahun === new Date().getFullYear();
                  return (
                    <TableRow
                      key={item.id}
                      className={
                        isCurrentYear ? "dark:bg-transparent bg-green-50" : ""
                      }
                    >
                      <TableCell className="py-6">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {item.tahun}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {item.jumlah_hari} Hari
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-md">
                          {item.keterangan || (
                            <span className="text-gray-400">
                              Tidak ada keterangan
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isCurrentYear ? (
                          <Badge variant="success">Tahun Berjalan</Badge>
                        ) : item.tahun < new Date().getFullYear() ? (
                          <Badge variant="secondary">Tahun Lalu</Badge>
                        ) : (
                          <Badge variant="outline">Tahun Mendatang</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(item)}
                            disabled={loading}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenDeleteDialog(item)}
                            disabled={loading || isCurrentYear}
                            title={
                              isCurrentYear
                                ? "Tidak dapat menghapus konfigurasi tahun berjalan"
                                : "Hapus konfigurasi"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog Form */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode
                ? "Edit Konfigurasi Kuota Cuti"
                : "Tambah Konfigurasi Kuota Cuti"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tahun">
                  Tahun <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tahun"
                  type="number"
                  value={formData.tahun}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tahun: parseInt(e.target.value),
                    })
                  }
                  min={2020}
                  max={2100}
                  required
                />
                <p className="text-xs text-gray-500">
                  Tahun berlaku untuk konfigurasi kuota cuti ini
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jumlah_hari">
                  Jumlah Hari Cuti<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="jumlah_hari"
                  type="number"
                  value={formData.jumlah_hari}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jumlah_hari: parseInt(e.target.value),
                    })
                  }
                  min={0}
                  max={365}
                  required
                />
                <p className="text-xs text-gray-500">
                  Total hari cuti yang bisa diambil karyawan dalam 1 tahun
                  (umumnya 12 hari)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  placeholder="Tambahkan keterangan atau catatan khusus (opsional)..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Pratinjau:</strong> Dengan konfigurasi ini, setiap
                  karyawan akan mendapatkan kuota{" "}
                  <strong>{formData.jumlah_hari} hari cuti</strong> untuk tahun{" "}
                  <strong>{formData.tahun}</strong>.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Menyimpan..."
                  : editMode
                  ? "Update Konfigurasi"
                  : "Simpan Konfigurasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Yakin ingin menghapus konfigurasi tahun{" "}
                <strong>{itemToDelete?.tahun}</strong>?
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ Perhatian: Ini akan mempengaruhi kuota cuti semua karyawan untuk tahun tersebut.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}