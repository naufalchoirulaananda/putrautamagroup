"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";

interface JenisCutiIzin {
  id: number;
  kode_jenis: string;
  nama_jenis: string;
  deskripsi: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function JenisCutiIzinPage() {
  const [data, setData] = useState<JenisCutiIzin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JenisCutiIzin | null>(null);

  const [formData, setFormData] = useState({
    id: 0,
    kode_jenis: "",
    nama_jenis: "",
    deskripsi: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jenis-cuti-izin");
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

  const handleOpenDialog = (item?: JenisCutiIzin) => {
    if (item) {
      // Edit mode
      setEditMode(true);
      setSelectedItem(item);
      setFormData({
        id: item.id,
        kode_jenis: item.kode_jenis,
        nama_jenis: item.nama_jenis,
        deskripsi: item.deskripsi || "",
        is_active: item.is_active === 1,
      });
    } else {
      // Add mode
      setEditMode(false);
      setSelectedItem(null);
      setFormData({
        id: 0,
        kode_jenis: "",
        nama_jenis: "",
        deskripsi: "",
        is_active: true,
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
      kode_jenis: "",
      nama_jenis: "",
      deskripsi: "",
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.kode_jenis || !formData.nama_jenis) {
      toast.error("Kode jenis dan nama jenis harus diisi");
      return;
    }

    try {
      setLoading(true);

      const url = "/api/jenis-cuti-izin";
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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

  const handleDelete = async (item: JenisCutiIzin) => {
    if (
      !confirm(
        `Yakin ingin menghapus jenis "${item.nama_jenis}"?\n\nData tidak dapat dikembalikan setelah dihapus.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/jenis-cuti-izin?id=${item.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        // Show specific error if item is still in use
        if (result.usage_count && result.usage_count > 0) {
          toast.error(result.error, {
            description: "Data ini masih digunakan dan tidak dapat dihapus",
            duration: 5000,
          });
        } else {
          toast.error(result.error || "Gagal menghapus data");
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Terjadi kesalahan saat menghapus data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Kelola Jenis Cuti & Izin</h1>
        <p className="text-gray-500 mt-2">
          Manajemen daftar jenis cuti dan izin untuk seluruh karyawan
        </p>
      </header>

      <div className="dark:bg-transparent bg-white border rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-b w-full">
          <Button
            onClick={() => handleOpenDialog()}
            disabled={loading}
            className="w-full sm:w-auto" // full width di mobile, auto di desktop
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Jenis
          </Button>
        </div>

        {loading && data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Memuat data...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Belum ada data jenis cuti/izin</p>
            <p className="text-sm text-gray-400 mt-1">
              Klik tombol &quot;Tambah Jenis&quot; untuk menambahkan
            </p>
          </div>
        ) : (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Jenis</TableHead>
                  <TableHead>Kode Jenis</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-6">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.nama_jenis}</div>
                    </TableCell>
                    <TableCell>
                      <code className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-blue-600">
                        {item.kode_jenis}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-md">
                        {item.deskripsi || (
                          <span className="text-gray-400 italic">
                            Tidak ada keterangan
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.is_active ? "success" : "secondary"}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(item.created_at)}
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
                          onClick={() => handleDelete(item)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              {editMode ? "Edit Jenis Cuti/Izin" : "Tambah Jenis Cuti/Izin"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_jenis">
                  Nama Jenis <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama_jenis"
                  value={formData.nama_jenis}
                  onChange={(e) => {
                    const namaJenis = e.target.value;
                    // Auto-generate kode_jenis dari nama_jenis
                    const kodeJenis = namaJenis
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, ""); // Hapus karakter spesial

                    setFormData({
                      ...formData,
                      nama_jenis: namaJenis,
                      kode_jenis: editMode ? formData.kode_jenis : kodeJenis,
                    });
                  }}
                  className="text-sm"
                  placeholder="e.g: Cuti Melahirkan"
                  required
                />
                <p className="text-xs text-gray-500">
                  Contoh: &quot;Cuti Melahirkan&quot; → kode otomatis: cuti_melahirkan
                </p>
              </div>

              {/* Preview Kode yang akan Digunakan */}
              <div className="space-y-2">
                <Label className="">Kode Jenis (Otomatis)</Label>
                <div className="px-3 py-2 border border-gray-300 rounded-md">
                  <code className="text-sm font-mono ">
                    {formData.kode_jenis || "(akan dibuat otomatis)"}
                  </code>
                </div>
                {editMode && (
                  <p className="text-xs text-amber-600">
                    Kode tidak dapat diubah saat edit untuk menjaga integritas
                    data
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Keterangan</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="text-sm"
                  placeholder="Tambahkan keterangan atau deskripsi jenis cuti/izin (opsional)..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(value) =>
                      setFormData({ ...formData, is_active: Boolean(value) })
                    }
                  />
                  <Label
                    htmlFor="is_active"
                    className="cursor-pointer font-normal"
                  >
                    Aktif (Tampilkan di form pengajuan)
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  Centang untuk menampilkan jenis ini di pilihan form pengajuan
                  karyawan
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
                {loading ? "Menyimpan..." : editMode ? "Update" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
