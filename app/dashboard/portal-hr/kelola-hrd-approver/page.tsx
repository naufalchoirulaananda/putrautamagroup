"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";

// shadcn UI
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HRDApprover {
  id: number;
  user_id: number;
  user_name: string;
  kode_pegawai: string;
  role_name: string;
  is_active: number;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  kode_pegawai: string;
  role_id: number;
  role_name: string;
  status: string;
}

export default function HRDApproverManagement() {
  const [hrdApprovers, setHrdApprovers] = useState<HRDApprover[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(hrdApprovers.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedApprovers = hrdApprovers.slice(startIndex, endIndex);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [hrdApprovers.length]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const approversRes = await fetch("/api/approvers/hrd");
      const approversData = await approversRes.json();
      if (approversData.success) {
        setHrdApprovers(approversData.data);
      }

      const usersRes = await fetch("/api/approvers/users?type=hrd");
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.data);
      }
    } catch {
      setAlertMessage("Gagal memuat data.");
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setAlertMessage("Pilih user terlebih dahulu.");
      setAlertOpen(true);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/approvers/hrd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(selectedUserId) }),
      });

      const result = await res.json();

      if (result.success) {
        setAlertMessage("HRD approver berhasil ditambahkan.");
        setAlertOpen(true);
        setDialogOpen(false);
        setSelectedUserId("");
        fetchData();
      } else {
        setAlertMessage(result.error || "Gagal menambahkan approver.");
        setAlertOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/approvers/hrd?id=${deleteId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        setAlertMessage("HRD approver berhasil dihapus.");
        setAlertOpen(true);
        fetchData();
      } else {
        setAlertMessage(result.error || "Gagal menghapus approver.");
        setAlertOpen(true);
      }
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
      setLoading(false);
    }
  };

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Kelola HRD Approver</h1>
        <p className="text-sm text-muted-foreground">
          Atur siapa yang menjadi approver dari sisi HRD
        </p>
      </header>

      <Alert className="bg-amber-50 border-amber-300 dark:bg-white dark:border-none mb-6">
        <AlertCircle className="h-5 w-5 dark:text-black" />
        <AlertTitle className="font-medium dark:text-black">
          Tentang HRD Approver
        </AlertTitle>
        <AlertDescription>
          <ul className="list-disc ml-3 sm:ml-5 mt-2 space-y-1">
            <li>Approval final Level 2</li>
            <li>Setelah SPV/Manager/Direktur approve → HRD</li>
            <li>HRD akan generate PDF final dengan Barcode</li>
            <li>Minimal 1 HRD approver aktif harus ada</li>
            <li>
              Hanya user dengan role HRD, Personalia, atau Direktur yang bisa
              ditambahkan
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg shadow-none overflow-hidden">
        <div className="flex flex-col p-4 gap-4 border-b">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Tambah HRD Approver
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah HRD Approver</DialogTitle>
                <DialogDescription>
                  Pilih user yang memiliki role HRD, Personalia, atau Direktur.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Pilih User</Label>

                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Tidak ada user HRD/Personalia/Direktur tersedia
                        </div>
                      ) : (
                        users.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name} - {u.role_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-muted-foreground">
                    Hanya user dengan role HRD, Personalia, atau Direktur yang
                    ditampilkan.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="p-4 bg-white dark:bg-transparent overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Posisi/Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ditambahkan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedApprovers.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="py-6">{startIndex + i + 1}</TableCell>
                  <TableCell>{item.user_name}</TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="rounded-lg px-4 py-2 text-xs"
                    >
                      {item.role_name}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className="rounded-lg px-4 py-2 text-xs"
                      variant={item.is_active ? "default" : "outline"}
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={hrdApprovers.length === 1}
                      onClick={() => openDeleteConfirm(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {hrdApprovers.length === 1 && (
                      <p className="text-xs text-amber-500 mt-1">
                        Minimal 1 approver
                      </p>
                    )}
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
              Menampilkan <span className="font-medium">{startIndex + 1}</span>{" "}
              sampai{" "}
              <span className="font-medium">
                {Math.min(endIndex, hrdApprovers.length)}
              </span>{" "}
              dari <span className="font-medium">{hrdApprovers.length}</span>{" "}
              hasil
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
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
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG: ALERT */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Informasi</DialogTitle>
          </DialogHeader>

          <p className="py-4">{alertMessage}</p>

          <DialogFooter>
            <Button onClick={() => setAlertOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFIRM DELETE */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus HRD approver ini?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
