// File: components/portal-karyawan/CabangManagementDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Cabang {
  kode_cabang: string;
  nama_cabang: string;
  divisi_id: number | null;
  divisi_name?: string;
}

interface Divisi {
  id: number;
  kode_divisi: string;
  nama_divisi: string;
}

interface CabangManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCabangChange: () => void;
}

export default function CabangManagementDialog({
  isOpen,
  onOpenChange,
  onCabangChange,
}: CabangManagementDialogProps) {
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCabang, setEditingCabang] = useState<Cabang | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cabangToDelete, setCabangToDelete] = useState<Cabang | null>(null);

  const [formData, setFormData] = useState({
    kode_cabang: "",
    nama_cabang: "",
    divisi_id: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchCabang();
      fetchDivisi();
    }
  }, [isOpen]);

  const fetchCabang = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cabang");
      const data = await response.json();
      if (data.success) {
        // Fetch divisi names
        const cabangWithDivisi = await Promise.all(
          data.data.map(async (cabang: Cabang) => {
            if (cabang.divisi_id) {
              const divisiRes = await fetch(`/api/divisi/${cabang.divisi_id}`);
              const divisiData = await divisiRes.json();
              return {
                ...cabang,
                divisi_name: divisiData.data?.nama_divisi || "-",
              };
            }
            return { ...cabang, divisi_name: "-" };
          })
        );
        setCabangList(cabangWithDivisi);
      }
    } catch (error) {
      console.error("Error fetching cabang:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisi = async () => {
    try {
      const response = await fetch("/api/divisi");
      const data = await response.json();
      if (data.success) {
        setDivisiList(data.data);
      }
    } catch (error) {
      console.error("Error fetching divisi:", error);
    }
  };

  const handleAdd = () => {
    setEditingCabang(null);
    setFormData({
      kode_cabang: "",
      nama_cabang: "",
      divisi_id: "",
    });
    setError("");
    setSuccess("");
  };

  const handleEdit = (cabang: Cabang) => {
    setEditingCabang(cabang);
    setFormData({
      kode_cabang: cabang.kode_cabang,
      nama_cabang: cabang.nama_cabang,
      divisi_id: cabang.divisi_id?.toString() || "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editingCabang
        ? `/api/cabang/${editingCabang.kode_cabang}`
        : "/api/cabang";

      const method = editingCabang ? "PUT" : "POST";

      const payload = editingCabang
        ? {
            nama_cabang: formData.nama_cabang,
            divisi_id: formData.divisi_id ? parseInt(formData.divisi_id) : null,
          }
        : {
            kode_cabang: formData.kode_cabang,
            nama_cabang: formData.nama_cabang,
            divisi_id: formData.divisi_id ? parseInt(formData.divisi_id) : null,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          editingCabang
            ? "Cabang berhasil diupdate!"
            : "Cabang berhasil ditambahkan!"
        );
        fetchCabang();
        onCabangChange();
        setTimeout(() => {
          setEditingCabang(null);
          setFormData({
            kode_cabang: "",
            nama_cabang: "",
            divisi_id: "",
          });
          setSuccess("");
        }, 1500);
      } else {
        setError(data.error || "Gagal menyimpan cabang");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat menyimpan cabang");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (cabang: Cabang) => {
    setCabangToDelete(cabang);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cabangToDelete) return;

    try {
      const response = await fetch(`/api/cabang/${cabangToDelete.kode_cabang}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Cabang berhasil dihapus!");
        fetchCabang();
        onCabangChange();
        setIsDeleteDialogOpen(false);
        setCabangToDelete(null);
      } else {
        setError(data.error || "Gagal menghapus cabang");
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      setError("Terjadi kesalahan saat menghapus cabang");
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manajemen Cabang</DialogTitle>
            <DialogDescription>
              Kelola cabang perusahaan. Tambah, edit, atau hapus cabang.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-900">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode_cabang" className="flex justify-between">Kode Cabang <span className="text-red-500 text-xs">Lihat Kode Cabang terakhir.</span></Label>
              <Input
                id="kode_cabang"
                value={formData.kode_cabang}
                onChange={(e) =>
                  setFormData({ ...formData, kode_cabang: e.target.value })
                }
                placeholder="Contoh: 01"
                required
                disabled={!!editingCabang}
                maxLength={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_cabang">Nama Cabang</Label>
              <Input
                id="nama_cabang"
                value={formData.nama_cabang}
                onChange={(e) =>
                  setFormData({ ...formData, nama_cabang: e.target.value })
                }
                placeholder="Contoh: Sukoharjo"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : editingCabang
                  ? "Update"
                  : "Tambah"}
              </Button>
              {editingCabang && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAdd}
                  disabled={isSubmitting}
                >
                  Batal Edit
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Daftar Cabang</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Cabang</TableHead>
                      <TableHead>Divisi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cabangList.length > 0 ? (
                      cabangList.map((cabang) => (
                        <TableRow key={cabang.kode_cabang}>
                          <TableCell className="font-mono text-sm">
                            {cabang.kode_cabang}
                          </TableCell>
                          <TableCell>{cabang.nama_cabang}</TableCell>
                          <TableCell>{cabang.divisi_name || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(cabang)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(cabang)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          Belum ada cabang
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Cabang</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus cabang{" "}
              <span className="font-semibold">{cabangToDelete?.nama_cabang}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}