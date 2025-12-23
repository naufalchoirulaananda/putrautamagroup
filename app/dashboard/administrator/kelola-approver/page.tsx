"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Approver {
  id: number;
  divisi_kode: string;
  nama_divisi: string;
  approver_id: number;
  approver_name: string;
  kode_pegawai: string;
  approver_role_id: number;
  approver_role_name: string;
  cabang_id: string;
  cabang_name: string;
  is_active: number;
  created_at: string;
}

interface Divisi {
  id: number;
  kode_divisi: string;
  nama_divisi: string;
}

interface User {
  id: number;
  name: string;
  kode_pegawai: string;
  role_id: number;
  role_name: string;
  divisi_kode: string;
  divisi_name: string;
  cabang_id: string;
  cabang_name: string;
  status: string;
}

export default function ApproverManagement() {
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog States
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "error">(
    "success"
  );

  const [selectedIdDelete, setSelectedIdDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    divisi_kode: "",
    approver_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Filter users when divisi changes
  useEffect(() => {
    if (formData.divisi_kode) {
      const filtered = allUsers.filter((u) => {
        const roleName = u.role_name.toUpperCase();

        // Direktur bisa approve semua divisi (tidak difilter)
        const isDirektur =
          roleName.includes("DIREKTUR") || roleName.includes("DIRECTOR");

        if (isDirektur) {
          return true;
        }

        // Selain Direktur, harus dari divisi yang sama
        return u.divisi_kode === formData.divisi_kode;
      });
      setFilteredUsers(filtered);
      // Reset approver selection when divisi changes
      setFormData((prev) => ({ ...prev, approver_id: "" }));
    } else {
      setFilteredUsers([]);
      setFormData((prev) => ({ ...prev, approver_id: "" }));
    }
  }, [formData.divisi_kode, allUsers]);

  // Calculate pagination
  const totalPages = Math.ceil(approvers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApprovers = approvers.slice(startIndex, endIndex);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [approvers.length]);

  const openAlert = (
    title: string,
    msg: string,
    variant: "success" | "error"
  ) => {
    setAlertTitle(title);
    setAlertMessage(msg);
    setAlertVariant(variant);
    setShowAlertDialog(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [approversRes, divisiRes, usersRes] = await Promise.all([
        fetch("/api/approvers/divisi"),
        fetch("/api/divisi"),
        fetch("/api/approvers/users"),
      ]);

      const approversData = await approversRes.json();
      const divisiData = await divisiRes.json();
      const usersData = await usersRes.json();

      if (approversData.success) setApprovers(approversData.data);
      if (divisiData.success) setDivisi(divisiData.data);
      if (usersData.success) setAllUsers(usersData.data);
    } catch {
      openAlert(
        "Gagal Memuat",
        "Tidak dapat memuat data, silakan refresh.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.divisi_kode || !formData.approver_id) {
      openAlert("Validasi Gagal", "Semua field wajib diisi.", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/approvers/divisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisi_kode: formData.divisi_kode,
          approver_id: parseInt(formData.approver_id),
        }),
      });

      const result = await response.json();

      if (result.success) {
        openAlert("Berhasil", "Approver berhasil ditambahkan.", "success");
        setShowAddDialog(false);
        setFormData({ divisi_kode: "", approver_id: "" });
        fetchData();
      } else {
        openAlert(
          "Gagal",
          result.error || "Tidak dapat menambahkan approver.",
          "error"
        );
      }
    } catch {
      openAlert("Error", "Terjadi kesalahan saat menambah approver.", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: number) => {
    setSelectedIdDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedIdDelete) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/approvers/divisi?id=${selectedIdDelete}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        openAlert("Berhasil", "Approver berhasil dihapus.", "success");
        fetchData();
      } else {
        openAlert(
          "Gagal",
          result.error || "Tidak dapat menghapus approver.",
          "error"
        );
      }
    } catch {
      openAlert("Error", "Terjadi kesalahan saat menghapus approver.", "error");
    } finally {
      setShowDeleteDialog(false);
      setLoading(false);
    }
  };

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Kelola Approver Divisi</h1>
        <p className="text-gray-500 mt-2">
          Atur siapa yang menjadi approver untuk masing-masing divisi
        </p>
      </header>

      <Alert className="bg-amber-50 border-amber-300 dark:bg-white dark:border-none mb-6">
        <AlertCircle className="h-5 w-5 dark:text-black" />
        <AlertTitle className="font-medium dark:text-black">
          Aturan Approver
        </AlertTitle>
        <AlertDescription>
          <ul className="list-disc ml-3 sm:ml-5 mt-2 space-y-1">
            <li>
              <span className="font-bold">Staff</span> →
              Koordinator/Manager/SPV/Direktur
            </li>
            <li>
              <span className="font-bold">Koordinator</span> →
              Manager/SPV/Direktur
            </li>
            <li>
              <span className="font-bold">Manager/SPV</span> → Direktur
            </li>
            <li>
              Approver <span className="font-bold">(kecuali Direktur)</span>{" "}
              harus dari divisi yang sama
            </li>
            <li>Direktur dapat menjadi approver untuk semua divisi</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg shadow-none overflow-hidden">
        <div className="flex flex-col p-4 gap-4 border-b">
          <Button onClick={() => setShowAddDialog(true)} className="cursor-pointer">
            <Plus className="w-4 h-4" /> Tambah Approver
          </Button>
        </div>

        <div className="p-4 bg-white dark:bg-transparent overflow-x-auto max-w-full">
          <Table className="p-4">
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Cabang</TableHead>
                <TableHead>Posisi/Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentApprovers.map((ap, i) => (
                <TableRow key={ap.id}>
                  <TableCell className="py-6">{startIndex + i + 1}</TableCell>
                  <TableCell>{ap.approver_name}</TableCell>
                  <TableCell>
                    <div className="font-medium">{ap.nama_divisi}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {ap.cabang_name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-lg px-4 py-2 text-xs" variant={"secondary"}>
                      {ap.approver_role_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="rounded-lg px-4 py-2 text-xs"
                      variant={ap.is_active ? "default" : "outline"}
                    >
                      {ap.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(ap.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-center sm:justify-between">
            <div className="hidden sm:block text-xs">
              Menampilkan{" "}
              <span className="font-medium">{startIndex + 1}</span> sampai{" "}
              <span className="font-medium">
                {Math.min(endIndex, approvers.length)}
              </span>{" "}
              dari <span className="font-medium">{approvers.length}</span>{" "}
              hasil
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="text-xs">
                Page {currentPage} dari {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ADD DIALOG */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="p-4">
          <DialogHeader>
            <DialogTitle>Tambah Approver</DialogTitle>
            <DialogDescription>
              Pilih divisi terlebih dahulu, kemudian pilih approver dari divisi
              tersebut.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Divisi */}
            <div>
              <p className="text-sm font-medium mb-1">Divisi</p>

              <Select
                value={formData.divisi_kode}
                onValueChange={(v) =>
                  setFormData({ ...formData, divisi_kode: v })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisi.map((d) => (
                    <SelectItem key={d.id} value={d.kode_divisi}>
                      {d.nama_divisi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approver */}
            <div>
              <p className="text-sm font-medium mb-1">Approver</p>

              <Select
                value={formData.approver_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, approver_id: v })
                }
                disabled={!formData.divisi_kode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      formData.divisi_kode
                        ? "Pilih Approver"
                        : "Pilih divisi terlebih dahulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Tidak ada approver tersedia untuk divisi ini
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} - {u.role_name} {u.cabang_name ? `(${u.cabang_name})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Menampilkan approver dari divisi yang dipilih + semua Direktur
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ divisi_kode: "", approver_id: "" });
              }}
            >
              Batal
            </Button>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Approver akan dihapus permanen dari daftar. Lanjutkan?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT MESSAGE */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertTitle}</DialogTitle>
            <DialogDescription>{alertMessage}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setShowAlertDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}