"use client";

import { useEffect, useState } from "react";
import {
  Edit2,
  Search,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RoleManagementDialog from "@/components/portal-karyawan/RoleManagementDialog";
import DivisiManagementDialog from "@/components/portal-karyawan/DivisiManagementDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CabangManagementDialog from "@/components/portal-karyawan/CabangManagementDialog";

interface User {
  id: number;
  name: string;
  kode_pegawai: string;
  password: string;
  role_id: number;
  role_name: string;
  status: string;
  created_at: string;
  tanggal_nonaktif: string | null;
  divisi_kode: string;
  divisi_name: string;
  cabang_id: string | null;
  cabang_name: string | null;
}

interface Cabang {
  kode_cabang: string;
  nama_cabang: string;
  divisi_id?: number;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface Divisi {
  kode_divisi: string;
  nama_divisi: string;
}

interface FormData {
  name: string;
  kode_pegawai: string;
  role_id: number;
  status: string;
  password: string;
  divisi_kode: string;
  cabang_id: string;
}

function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("edit");
  const [roleFilterSearch, setRoleFilterSearch] = useState("");
  const filteredRolesForFilter = roles.filter((role) =>
    role.name.toLowerCase().includes(roleFilterSearch.toLowerCase())
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    kode_pegawai: "",
    role_id: 0,
    status: "active",
    password: "",
    divisi_kode: "",
    cabang_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [sortField, setSortField] = useState<"name" | "created_at">("name");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDivisiDialogOpen, setIsDivisiDialogOpen] = useState(false);

  // Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [divisiFilter, setDivisiFilter] = useState<string>("all");
  const [cabangFilter, setCabangFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [roleSearch, setRoleSearch] = useState("");

  const [isCabangDialogOpen, setIsCabangDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDivisi();
    fetchCabang();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, roleFilter, divisiFilter, cabangFilter, sortOrder]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
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

  const fetchCabang = async () => {
    try {
      const response = await fetch("/api/cabang");
      const data = await response.json();
      if (data.success) {
        setCabangList(data.data);
      }
    } catch (error) {
      console.error("Error fetching cabang:", error);
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.kode_pegawai.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.divisi_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.cabang_name?.toLowerCase().includes(searchQuery.toLowerCase()) // TAMBAH INI
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(
        (user) => user.role_id.toString() === roleFilter
      );
    }

    // Divisi filter
    if (divisiFilter !== "all") {
      filtered = filtered.filter((user) => user.divisi_kode === divisiFilter);
    }

    if (cabangFilter !== "all") {
      filtered = filtered.filter((user) => user.cabang_id === cabangFilter);
    }

    filtered.sort((a, b) => {
      if (sortField === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "created_at") {
        return sortOrder === "asc"
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    setFilteredUsers(filtered);
    // DIHAPUS: setCurrentPage(1); - ini yang menyebabkan pagination reset
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset ke halaman 1 saat search
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1); // Reset ke halaman 1 saat filter role
  };

  const handleDivisiFilterChange = (value: string) => {
    setDivisiFilter(value);
    setCurrentPage(1); // Reset ke halaman 1 saat filter divisi
  };

  const handleCabangFilterChange = (value: string) => {
    setCabangFilter(value);
    setCurrentPage(1);
  };

  const toggleSortOrder = (field: "name" | "created_at") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset ke halaman 1 saat sort
  };

  const handleAdd = () => {
    setDialogMode("add");
    setEditingUser(null);
    setFormData({
      name: "",
      kode_pegawai: "",
      role_id: 0,
      status: "active",
      password: "",
      divisi_kode: "",
      cabang_id: "",
    });
    setError("");
    setSuccess("");
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setDialogMode("edit");
    setEditingUser(user);
    setFormData({
      name: user.name,
      kode_pegawai: user.kode_pegawai,
      role_id: user.role_id || 0,
      status: user.status,
      password: "",
      divisi_kode: user.divisi_kode || "",
      cabang_id: user.cabang_id || "",
    });
    setError("");
    setSuccess("");
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setRoleSearch("");
    setTimeout(() => {
      setEditingUser(null);
      setDialogMode("edit");
      setFormData({
        name: "",
        kode_pegawai: "",
        role_id: 0,
        status: "active",
        password: "",
        divisi_kode: "",
        cabang_id: "",
      });
      setError("");
      setSuccess("");
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url =
        dialogMode === "add" ? "/api/users" : `/api/users/${editingUser?.id}`;

      const method = dialogMode === "add" ? "POST" : "PUT";

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
          dialogMode === "add"
            ? "User berhasil ditambahkan!"
            : "User berhasil diupdate!"
        );
        fetchUsers();
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(
          data.error ||
            `Gagal ${dialogMode === "add" ? "menambahkan" : "mengupdate"} user`
        );
      }
    } catch (error) {
      setError(
        `Terjadi kesalahan saat ${
          dialogMode === "add" ? "menambahkan" : "mengupdate"
        } user`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("User berhasil dihapus!");
        setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        setError(data.error || "Gagal menghapus user");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menghapus user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="@container mx-auto p-4 px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Manajemen Karyawan</h1>
          <p className="text-gray-500 mt-2">
            Tambah, ubah, atau hapus karyawan sesuai peran mereka.
          </p>
        </header>

        <div className="border rounded-lg shadow-none overflow-hidden">
          <div className="flex flex-col p-4 gap-4 border-b">
            <div className="flex flex-col lg:flex-row w-full gap-3 items-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex w-full sm:w-64 cursor-pointer text-sm items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleAdd}
                      className="flex w-full cursor-pointer items-center gap-2 text-sm px-2 py-1.5 hover:bg-accent rounded-sm"
                    >
                      Tambah Karyawan
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => setIsRoleDialogOpen(true)}
                      className="flex w-full cursor-pointer text-sm items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm"
                    >
                      Tambah Posisi/Jabatan
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => setIsDivisiDialogOpen(true)}
                      className="flex w-full cursor-pointer text-sm items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm"
                    >
                      Tambah Divisi
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => setIsCabangDialogOpen(true)}
                      className="flex w-full cursor-pointer text-sm items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm"
                    >
                      Tambah Cabang
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="Cari nama, posisi/jabatan, atau divisi..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full sm:max-w-sm text-sm bg-white"
              />
              {/* Filter Container */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* Role Filter */}
                <div>
                  <Select
                    value={roleFilter}
                    onValueChange={handleRoleFilterChange}
                  >
                    <SelectTrigger className="w-full bg-white capitalize">
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Search Input */}
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Cari posisi / jabatan..."
                          value={roleFilterSearch}
                          onChange={(e) => setRoleFilterSearch(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* List Role */}
                      <SelectItem value="all" className="capitalize w-full">
                        Semua Posisi
                      </SelectItem>
                      {filteredRolesForFilter.length > 0 ? (
                        filteredRolesForFilter.map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.id.toString()}
                            className="capitalize w-full"
                          >
                            {role.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty" disabled>
                          Tidak ditemukan
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Divisi Filter */}
                <div>
                  <Select
                    value={divisiFilter}
                    onValueChange={handleDivisiFilterChange}
                  >
                    <SelectTrigger className="w-full bg-white capitalize">
                      <SelectValue placeholder="Filter by Divisi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="capitalize w-full">
                        Semua Divisi
                      </SelectItem>
                      {divisiList.map((divisi) => (
                        <SelectItem
                          key={divisi.kode_divisi}
                          value={divisi.kode_divisi}
                          className="capitalize w-full"
                        >
                          {divisi.nama_divisi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={cabangFilter}
                    onValueChange={handleCabangFilterChange}
                  >
                    <SelectTrigger className="w-full bg-white capitalize">
                      <SelectValue placeholder="Filter by Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="capitalize w-full">
                        Semua Cabang
                      </SelectItem>
                      {cabangList.map((cabang) => (
                        <SelectItem
                          key={cabang.kode_cabang}
                          value={cabang.kode_cabang}
                          className="capitalize w-full"
                        >
                          {cabang.nama_cabang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-4 bg-white dark:bg-transparent overflow-x-auto max-w-full">
            <Table>
              <TableHeader>
                <TableRow className="transition-colors">
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSortOrder("name")}
                      className="flex items-center cursor-pointer gap-2 font-medium"
                    >
                      Nama Karyawan
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </TableHead>
                  <TableHead>Kode Karyawan</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Posisi/Jabatan</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Cabang</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSortOrder("created_at")}
                      className="flex items-center cursor-pointer gap-2 font-medium"
                    >
                      Tanggal Dibuat
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </TableHead>
                  <TableHead>Tanggal Nonaktif</TableHead>

                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="py-6">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.kode_pegawai}</TableCell>
                      <TableCell>
                        {showPassword[user.id] ? user.password : "••••••"}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              [user.id]: !prev[user.id],
                            }))
                          }
                        >
                          {showPassword[user.id] ? "Hide" : "Show"}
                        </Button>
                      </TableCell>
                      <TableCell className="capitalize">
                        {user.role_name || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="px-4 py-2 text-xs font-semibold rounded-sm bg-amber-100 text-amber-800">
                          {user.divisi_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">
                        {user.cabang_name || "-"}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.tanggal_nonaktif
                          ? formatDate(user.tanggal_nonaktif)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            variant="outline"
                            title="Edit"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            title="Hapus"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-gray-500">
                        Tidak ada data yang ditemukan
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
                  {Math.min(endIndex, filteredUsers.length)}
                </span>{" "}
                dari <span className="font-medium">{filteredUsers.length}</span>{" "}
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

        {/* Dialog Add/Edit User */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "add" ? "Tambah User Baru" : "Edit User"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "add"
                  ? "Isi informasi user baru dan tentukan posisi/jabatan akses. Klik simpan untuk menambahkan user."
                  : "Ubah informasi user dan posisi/jabatan akses. Klik simpan untuk menyimpan perubahan."}
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
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kode_pegawai">Kode Karyawan</Label>
                  <Input
                    id="kode_pegawai"
                    value={formData.kode_pegawai}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_pegawai: e.target.value })
                    }
                    placeholder={"Masukkan kode karyawan"}
                    required={dialogMode === "add"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Posisi/Jabatan</Label>

                  <Select
                    value={
                      formData.role_id && formData.role_id !== 0
                        ? formData.role_id.toString()
                        : ""
                    }
                    onValueChange={(value) =>
                      setFormData({ ...formData, role_id: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Pilih Posisi/Jabatan"
                        className="capitalize"
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {/* Search Input */}
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Cari posisi / jabatan..."
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* List Role */}
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.id.toString()}
                            className="capitalize"
                          >
                            {role.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empty" disabled>
                          Tidak ditemukan
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="divisi">Divisi</Label>
                  <Select
                    value={formData.divisi_kode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, divisi_kode: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Pilih Divisi"
                        className="capitalize"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {divisiList.map((divisi) => (
                        <SelectItem
                          key={divisi.kode_divisi}
                          value={divisi.kode_divisi}
                          className="capitalize"
                        >
                          {divisi.nama_divisi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cabang">Cabang</Label>
                  <Select
                    value={formData.cabang_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cabang_id: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Pilih Cabang"
                        className="capitalize"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cabangList.map((cabang) => (
                        <SelectItem
                          key={cabang.kode_cabang}
                          value={cabang.kode_cabang}
                          className="capitalize"
                        >
                          {cabang.nama_cabang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {dialogMode === "add" ? "Password" : "Password Baru"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      dialogMode === "add"
                        ? "Masukkan password"
                        : "Kosongkan jika tidak ingin mengubah"
                    }
                    required={dialogMode === "add"}
                  />
                  {dialogMode === "edit" && (
                    <p className="text-xs text-muted-foreground">
                      Kosongkan jika tidak ingin mengubah password
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Konfirmasi Delete */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus User</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus user{" "}
                <span className="font-semibold">{userToDelete?.name}</span>?
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

        <RoleManagementDialog
          isOpen={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          roles={roles}
          onRolesChange={fetchRoles}
        />

        <DivisiManagementDialog
          isOpen={isDivisiDialogOpen}
          onOpenChange={setIsDivisiDialogOpen}
          onDivisiChange={fetchDivisi}
        />

        <CabangManagementDialog
          isOpen={isCabangDialogOpen}
          onOpenChange={setIsCabangDialogOpen}
          onCabangChange={fetchCabang}
        />
      </div>
    </>
  );
}

export default Page;
