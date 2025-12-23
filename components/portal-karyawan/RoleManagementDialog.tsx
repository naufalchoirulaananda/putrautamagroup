"use client";

import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "../ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface RoleManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onRolesChange: () => void;
}

export default function RoleManagementDialog({
  isOpen,
  onOpenChange,
  roles,
  onRolesChange,
}: RoleManagementDialogProps) {
  const [formData, setFormData] = useState({ name: "" });
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  /** =====================
   * SEARCH FILTER
   ====================== */
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          editingRole
            ? "Role berhasil diupdate!"
            : "Role berhasil ditambahkan!"
        );
        setFormData({ name: "" });
        setEditingRole(null);
        onRolesChange();

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Gagal menyimpan role");
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name });
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setFormData({ name: "" });
  };

  const openDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Role berhasil dihapus!");
        onRolesChange();
      } else {
        setError(data.error || "Gagal menghapus role");
      }
    } catch {
      setError("Terjadi kesalahan saat menghapus role");
    } finally {
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manajemen Posisi/Jabatan</DialogTitle>
            <DialogDescription>
              Tambah, ubah, atau hapus posisi/jabatan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* FORM */}
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-4">
                {editingRole ? "Edit Posisi/Jabatan" : "Tambah Posisi/Jabatan"}
              </h3>

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
                <Label>Nama Posisi/Jabatan</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ name: e.target.value })
                  }
                  placeholder="Contoh: Manager, Admin"
                />
              </div>

              <div className="flex gap-2 mt-4">
                {editingRole && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Batal
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingRole
                    ? "Update"
                    : "Tambah"}
                </Button>
              </div>
            </div>

            {/* TABLE */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Daftar Posisi/Jabatan
              </h3>

              <Input
                placeholder="Cari posisi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
              />

              <ScrollArea className="h-64 rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-right">Opsi</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredRoles.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Data tidak ditemukan
                        </TableCell>
                      </TableRow>
                    )}

                    {filteredRoles.map((role, index) => (
                      <TableRow key={role.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="capitalize">
                          {role.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(role)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(role)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Role</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus{" "}
              <span className="font-semibold capitalize">
                {roleToDelete?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
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
