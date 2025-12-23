"use client";
import React, { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Type definitions
interface Role {
  id: number;
  name: string;
}
interface Cabang {
  kode_cabang: string;
  nama_cabang: string;
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
  status: "active" | "inactive";
  cabang_id: string;
  divisi_kode: string;
  role_name?: string;
  cabang_name?: string;
  divisi_name?: string;
}
interface AlertState {
  type: "success" | "error";
  message: string;
}
interface FormData {
  name: string;
  kode_pegawai: string;
  password: string;
  role_id: string;
  status: "active" | "inactive";
  cabang_id: string;
  divisi_kode: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cabang, setCabang] = useState<Cabang[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [kodePegawaiError, setKodePegawaiError] = useState<string>("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    kode_pegawai: "",
    password: "",
    role_id: "",
    status: "active",
    cabang_id: "",
    divisi_kode: "",
  });

  const [editFormData, setEditFormData] = useState<FormData>({
    name: "",
    kode_pegawai: "",
    password: "",
    role_id: "",
    status: "active",
    cabang_id: "",
    divisi_kode: "",
  });

  // Fetch data
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCabang();
    fetchDivisi();
  }, []);

  useEffect(() => {
    // Auto-set divisi ke GMART saat component mount atau divisi berubah
    if (divisi.length > 0) {
      const gmartDivisi = divisi.find(
        (d) =>
          d.nama_divisi.toUpperCase() === "GMART" ||
          d.kode_divisi.toUpperCase() === "GMART"
      );

      if (gmartDivisi && !formData.divisi_kode) {
        setFormData((prev) => ({
          ...prev,
          divisi_kode: gmartDivisi.kode_divisi,
        }));
      }
    }
  }, [divisi]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/gmart/tambah-karyawan");
      const data = await response.json();
      if (data.success) setUsers(data.data);
    } catch {
      showAlert("error", "Gagal mengambil data users");
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await fetch("/api/roles").then((res) => res.json());
      const allowedRoles = [
        "ASS KEPALA TOKO GMART",
        "HELPER GMART",
        "HRD GMART",
        "PERSONALIA",
        "KASIR GMART",
        "KEPALA TOKO GMART",
        "MANAGER GMART",
        "MERCHANDISING GMART",
        "PRAMU-KASIR GMART",
        "KASIR  GMART",
        "PRAMUNIAGA GMART",
        "SPV CABANG GMART",
        "SPV LOGISTIK GMART",
        "SPV KEUANGAN GMART",
        "STAFF KEUANGAN GMART",
        "SPV PENGUNJUNG GMART",
      ];

      const filteredRoles = data.filter((role: Role) =>
        allowedRoles.includes(role.name)
      );

      setRoles(filteredRoles);
    } catch (error) {
      console.error("Gagal mengambil data roles", error);
    }
  };

  const fetchCabang = async () => {
    try {
      const response = await fetch("/api/cabang");
      const data = await response.json();
      if (data.success) setCabang(data.data);
    } catch (error) {
      console.error("Gagal mengambil data cabang", error);
    }
  };

  const fetchDivisi = async () => {
    try {
      const response = await fetch("/api/divisi");
      const data = await response.json();
      if (data.success) {
        setDivisi(data.data);
      } else if (Array.isArray(data)) {
        setDivisi(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data divisi", error);
    }
  };

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "kode_pegawai") {
      setKodePegawaiError("");
    }
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      kode_pegawai: "",
      password: "",
      role_id: "",
      status: "active",
      cabang_id: "",
      divisi_kode: "",
    });
    setKodePegawaiError("");
  };

  const handleSubmit = async () => {
    setKodePegawaiError("");

    if (
      !formData.name ||
      !formData.kode_pegawai ||
      !formData.role_id ||
      !formData.cabang_id ||
      !formData.divisi_kode
    ) {
      showAlert("error", "Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    if (!formData.password) {
      showAlert("error", "Password wajib diisi untuk user baru");
      return;
    }

    const gmartDivisi = divisi.find(
      (d) =>
        d.nama_divisi.toUpperCase() === "GMART" ||
        d.kode_divisi.toUpperCase() === "GMART"
    );

    if (!formData.divisi_kode && gmartDivisi) {
      setFormData((prev) => ({
        ...prev,
        divisi_kode: gmartDivisi.kode_divisi,
      }));
    }

    setLoading(true);
    try {
      const response = await fetch("/api/gmart/tambah-karyawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          divisi_kode: formData.divisi_kode || gmartDivisi?.kode_divisi,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showAlert("success", "User berhasil ditambahkan");
        fetchUsers();
        resetForm();

        if (gmartDivisi) {
          setFormData((prev) => ({
            ...prev,
            divisi_kode: gmartDivisi.kode_divisi,
          }));
        }
      } else {
        if (data.error === "Kode karyawan sudah digunakan") {
          setKodePegawaiError(data.error);
        }
        showAlert("error", data.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error detail:", error);
      showAlert("error", "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    const gmartDivisi = divisi.find(
      (d) =>
        d.nama_divisi.toUpperCase() === "GMART" ||
        d.kode_divisi.toUpperCase() === "GMART"
    );

    setEditingUser(user);
    setEditFormData({
      name: user.name,
      kode_pegawai: user.kode_pegawai,
      password: "",
      role_id: user.role_id.toString(),
      status: user.status,
      cabang_id: user.cabang_id,
      divisi_kode: user.divisi_kode || gmartDivisi?.kode_divisi || "",
    });
    setOpenEditDialog(true);
  };

  const handleUpdateSubmit = async () => {
    if (
      !editFormData.name ||
      !editFormData.role_id ||
      !editFormData.cabang_id ||
      !editFormData.divisi_kode
    ) {
      showAlert("error", "Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const gmartDivisi = divisi.find(
      (d) =>
        d.nama_divisi.toUpperCase() === "GMART" ||
        d.kode_divisi.toUpperCase() === "GMART"
    );

    setLoading(true);
    try {
      const response = await fetch(
        `/api/gmart/tambah-karyawan/${editingUser?.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editFormData,
            divisi_kode: editFormData.divisi_kode || gmartDivisi?.kode_divisi,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showAlert("success", "User berhasil diupdate");
        fetchUsers();
        setOpenEditDialog(false);
        setEditingUser(null);
      } else {
        showAlert("error", data.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error detail:", error);
      showAlert("error", "Gagal mengupdate data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/gmart/tambah-karyawan/${deleteId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        showAlert("success", "User berhasil dihapus");
        fetchUsers();

        const totalPagesAfterDelete = Math.ceil(
          (users.length - 1) / itemsPerPage
        );
        if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
          setCurrentPage(totalPagesAfterDelete);
        }
      } else {
        showAlert("error", data.error || "Gagal menghapus user");
      }

      setOpenDeleteDialog(false);
      setDeleteId(null);
    } catch {
      showAlert("error", "Gagal menghapus user");
      setOpenDeleteDialog(false);
      setDeleteId(null);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Tambah Karyawan Gmart</h1>
        <p className="text-gray-500 mt-2">
          Masukkan detail karyawan baru dengan data yang valid dan lengkap
        </p>
      </header>

      {alert && (
        <Alert
          className={`mb-6 ${
            alert.type === "error"
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <AlertDescription
            className={
              alert.type === "error" ? "text-red-800" : "text-green-800"
            }
          >
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Section */}
      <div className="rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Tambah Karyawan Baru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              className="text-sm bg-white"
              onChange={handleInputChange}
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kode_pegawai">Kode Karyawan</Label>
            <Input
              id="kode_pegawai"
              name="kode_pegawai"
              type="text"
              className={`text-sm bg-white ${
                kodePegawaiError ? "border-red-500 focus:ring-red-500" : ""
              }`}
              value={formData.kode_pegawai}
              onChange={handleInputChange}
              placeholder="Masukkan kode karyawan"
            />
            {kodePegawaiError && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{kodePegawaiError}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Masukkan password"
              className="text-sm bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role_id">Posisi/Jabatan</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: "role_id", value },
                } as any)
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Pilih Posisi/Jabatan" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="divisi_kode">
              Divisi{" "}
              <span className="text-xs text-gray-500">(Otomatis: GMART)</span>
            </Label>
            <Select
              value={formData.divisi_kode}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: "divisi_kode", value },
                } as any)
              }
              disabled // 👈 Disabled agar tidak bisa diubah
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="GMART" />
              </SelectTrigger>
              <SelectContent>
                {divisi
                  .filter(
                    (d) =>
                      d.nama_divisi.toUpperCase().includes("GMART") ||
                      d.kode_divisi.toUpperCase() === "GMART"
                  )
                  .map((d) => (
                    <SelectItem key={d.kode_divisi} value={d.kode_divisi}>
                      {d.nama_divisi}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cabang_id">Cabang</Label>
            <Select
              value={formData.cabang_id}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: "cabang_id", value },
                } as any)
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Pilih Cabang" />
              </SelectTrigger>
              <SelectContent className="uppercase">
                {cabang.map((c) => (
                  <SelectItem key={c.kode_cabang} value={c.kode_cabang}>
                    {c.nama_cabang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: "status", value },
                } as any)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
          <div className="md:col-span-2 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="cursor-pointer rounded-lg flex-1"
            >
              {loading ? "Menyimpan..." : "Tambah Karyawan"}
            </Button>

            <Button onClick={resetForm} variant="outline" className="flex-1">
              Reset Form
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="border rounded-lg shadow-none overflow-hidden">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  No
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Nama
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Kode Karyawan
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Posisi/Jabatan
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Divisi
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Cabang
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y">
              {currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    Data karyawan tidak tersedia.
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.name}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.kode_pegawai}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-4 py-2 text-xs font-semibold rounded-sm bg-blue-100 text-blue-800">
                        {user.role_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-4 py-2 text-xs font-semibold rounded-sm bg-purple-100 text-purple-800">
                        {user.divisi_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.cabang_name || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-4 py-2 text-xs uppercase font-semibold rounded-sm ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                          variant="outline"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteId(user.id);
                            setOpenDeleteDialog(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                          variant="outline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {users.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-center sm:justify-between">
            <div className="text-xs hidden sm:block">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, users.length)}{" "}
              dari {users.length} data
            </div>
            <div className="flex gap-2">
              <Button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
              <div className="flex items-center px-3 text-xs">
                Halaman {currentPage} dari {totalPages}
              </div>
              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="rounded-lg sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Data Karyawan</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nama Lengkap</Label>
              <Input
                id="edit_name"
                name="name"
                type="text"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="Masukkan nama lengkap"
                className="bg-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_kode_pegawai">Kode Karyawan</Label>
              <Input
                id="edit_kode_pegawai"
                name="kode_pegawai"
                type="text"
                value={editFormData.kode_pegawai}
                placeholder="Kode karyawan"
                disabled
                className="bg-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_password">
                Password{" "}
                <span className="text-gray-500 text-xs">
                  (kosongkan jika tidak diubah)
                </span>
              </Label>
              <Input
                id="edit_password"
                name="password"
                type="password"
                value={editFormData.password}
                onChange={handleEditInputChange}
                placeholder="Masukkan password baru"
                className="bg-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role_id">Posisi/Jabatan</Label>
              <Select
                value={editFormData.role_id}
                onValueChange={(value) =>
                  handleEditInputChange({
                    target: { name: "role_id", value },
                  } as any)
                }
              >
                <SelectTrigger className="w-full bg-white text-sm">
                  <SelectValue placeholder="Pilih Posisi/Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_divisi_kode">
                Divisi{" "}
                <span className="text-xs text-gray-500">(Otomatis: GMART)</span>
              </Label>
              <Select
                value={editFormData.divisi_kode}
                onValueChange={(value) =>
                  handleEditInputChange({
                    target: { name: "divisi_kode", value },
                  } as any)
                }
                disabled // 👈 Disabled agar tidak bisa diubah
              >
                <SelectTrigger className="w-full bg-white text-sm">
                  <SelectValue placeholder="GMART" />
                </SelectTrigger>
                <SelectContent>
                  {divisi
                    .filter(
                      (d) =>
                        d.nama_divisi.toUpperCase().includes("GMART") ||
                        d.kode_divisi.toUpperCase() === "GMART"
                    )
                    .map((d) => (
                      <SelectItem key={d.kode_divisi} value={d.kode_divisi}>
                        {d.nama_divisi}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_cabang_id">Cabang</Label>
              <Select
                value={editFormData.cabang_id}
                onValueChange={(value) =>
                  handleEditInputChange({
                    target: { name: "cabang_id", value },
                  } as any)
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Pilih Cabang" />
                </SelectTrigger>
                <SelectContent className="uppercase">
                  {cabang.map((c) => (
                    <SelectItem key={c.kode_cabang} value={c.kode_cabang}>
                      {c.nama_cabang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  handleEditInputChange({
                    target: { name: "status", value },
                  } as any)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditDialog(false);
                setEditingUser(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateSubmit} disabled={loading}>
              {loading ? "Menyimpan..." : "Update Karyawan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600">Konfirmasi Hapus</DialogTitle>
          </DialogHeader>

          <p className="text-sm">
            Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat
            dibatalkan.
          </p>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenDeleteDialog(false);
                setDeleteId(null);
              }}
            >
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
