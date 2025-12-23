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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit2, Trash2, Plus } from "lucide-react";

interface Divisi {
  id?: number;
  kode_divisi: string;
  nama_divisi: string;
}

interface DivisiManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDivisiChange?: () => void;
}

export default function DivisiManagementDialog({
  isOpen,
  onOpenChange,
  onDivisiChange,
}: DivisiManagementDialogProps) {
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDivisi, setEditingDivisi] = useState<Divisi | null>(null);
  const [divisiToDelete, setDivisiToDelete] = useState<Divisi | null>(null);
  const [formData, setFormData] = useState({
    kode_divisi: "",
    nama_divisi: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchDivisi();
    }
  }, [isOpen]);

  const fetchDivisi = async () => {
    try {
      const response = await fetch("/api/divisi");
      const data = await response.json();
      if (data.success) {
        setDivisiList(data.data);
      }
    } catch (error) {
      console.error("Error fetching divisi:", error);
      setError("Gagal memuat data divisi");
    }
  };

  const handleAdd = () => {
    setEditingDivisi(null);
    setFormData({
      kode_divisi: "",
      nama_divisi: "",
    });
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleEdit = (divisi: Divisi) => {
    setEditingDivisi(divisi);
    setFormData({
      kode_divisi: divisi.kode_divisi,
      nama_divisi: divisi.nama_divisi,
    });
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editingDivisi
        ? `/api/divisi/${editingDivisi.kode_divisi}`
        : "/api/divisi";
      const method = editingDivisi ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          editingDivisi
            ? "Divisi berhasil diupdate!"
            : "Divisi berhasil ditambahkan!"
        );
        fetchDivisi();
        if (onDivisiChange) {
          onDivisiChange();
        }
        setTimeout(() => {
          setIsFormOpen(false);
          setFormData({ kode_divisi: "", nama_divisi: "" });
          setEditingDivisi(null);
          setSuccess("");
        }, 1500);
      } else {
        setError(data.error || "Gagal menyimpan divisi");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat menyimpan divisi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (divisi: Divisi) => {
    setDivisiToDelete(divisi);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!divisiToDelete) return;

    try {
      const response = await fetch(
        `/api/divisi/${divisiToDelete.kode_divisi}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Divisi berhasil dihapus!");
        fetchDivisi();
        if (onDivisiChange) {
          onDivisiChange();
        }
        setIsDeleteDialogOpen(false);
        setDivisiToDelete(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Gagal menghapus divisi");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat menghapus divisi");
    }
  };

  return (
    <>
      {/* Main Dialog - Divisi List */}
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Manajemen Divisi</DialogTitle>
            <DialogDescription>
              Kelola daftar divisi perusahaan. Tambah, edit, atau hapus divisi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex">
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Divisi
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Kode Divisi</TableHead>
                    <TableHead>Nama Divisi</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisiList.length > 0 ? (
                    divisiList.map((divisi, index) => (
                      <TableRow key={divisi.kode_divisi}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {divisi.kode_divisi}
                        </TableCell>
                        <TableCell>{divisi.nama_divisi}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(divisi)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(divisi)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="text-gray-500">
                          Belum ada data divisi
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog - Add/Edit Divisi */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDivisi ? "Edit Divisi" : "Tambah Divisi Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingDivisi
                ? "Ubah informasi divisi yang ada"
                : "Isi informasi divisi baru"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
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

              <div className="space-y-2">
                <Label htmlFor="kode_divisi">Kode Divisi</Label>
                <Input
                  id="kode_divisi"
                  value={formData.kode_divisi}
                  onChange={(e) =>
                    setFormData({ ...formData, kode_divisi: e.target.value })
                  }
                  placeholder="Contoh: 001"
                  disabled={!!editingDivisi}
                  className={
                    editingDivisi ? "bg-gray-100 cursor-not-allowed" : ""
                  }
                  required
                />
                {editingDivisi && (
                  <p className="text-xs text-muted-foreground">
                    Kode divisi tidak dapat diubah
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama_divisi">Nama Divisi</Label>
                <Input
                  id="nama_divisi"
                  value={formData.nama_divisi}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_divisi: e.target.value })
                  }
                  placeholder="Masukkan nama divisi"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingDivisi(null);
                  setFormData({ kode_divisi: "", nama_divisi: "" });
                  setError("");
                  setSuccess("");
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Divisi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus divisi{" "}
              <span className="font-semibold">
                {divisiToDelete?.nama_divisi}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDivisiToDelete(null);
              }}
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