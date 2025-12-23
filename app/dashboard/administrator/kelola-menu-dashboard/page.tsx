"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  ChevronLeft,
  List,
  Edit2,
  Trash2,
  EyeOff,
  Eye,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  name: string;
  kode_pegawai: string;
  role_id: number;
  status: string;
  role_name: string;
  divisi_kode?: string;
  divisi_name?: string;
}

interface SubMenu {
  id: number;
  name: string;
  route: string;
  parent_menu_id: number;
  is_active: boolean;
}

interface Menu {
  id: number;
  name: string;
  route: string;
  icon: string;
  parent_id: number | null;
  is_active: boolean;
  subMenus: SubMenu[];
}

interface Divisi {
  id: number;
  kode_divisi: string;
  nama_divisi: string;
}

interface SubMenuInput {
  id?: number;
  name: string;
  route: string;
}

export default function KelolaAksesMenuPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
  const [selectedSubMenus, setSelectedSubMenus] = useState<number[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMenuDialogOpen, setIsAddMenuDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const { toast } = useToast();

  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [selectedDivisi, setSelectedDivisi] = useState<string>("all");

  // Form state untuk tambah menu
  const [menuName, setMenuName] = useState("");
  const [menuRoute, setMenuRoute] = useState("");
  const [menuIcon, setMenuIcon] = useState("");
  const [subMenus, setSubMenus] = useState<SubMenuInput[]>([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [isMenuListDialogOpen, setIsMenuListDialogOpen] = useState(false);
  const [isEditMenuDialogOpen, setIsEditMenuDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [editMenuName, setEditMenuName] = useState<string>("");
  const [editMenuRoute, setEditMenuRoute] = useState<string>("");
  const [editMenuIcon, setEditMenuIcon] = useState<string>("");
  const [editSubMenus, setEditSubMenus] = useState<SubMenuInput[]>([]); // SUDAH INCLUDE id

  const [isTogglingVisibility, setIsTogglingVisibility] = useState<
    number | null
  >(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await fetchDivisi();
      await fetchMenus();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const fetchDivisi = async () => {
    try {
      const response = await fetch("/api/divisi");
      if (!response.ok) throw new Error("Failed to fetch divisi");
      const result = await response.json();

      if (Array.isArray(result)) {
        setDivisiList(result);
      } else if (result.data && Array.isArray(result.data)) {
        setDivisiList(result.data);
      } else {
        console.error("Unexpected divisi data format:", result);
        setDivisiList([]);
      }
    } catch (error) {
      console.error("Error fetching divisi:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data divisi",
        variant: "destructive",
      });
      setDivisiList([]);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.kode_pegawai.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDivisi =
      selectedDivisi === "all" || user.divisi_kode === selectedDivisi;

    return matchesSearch && matchesDivisi;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDivisi]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const result = await response.json();

      if (Array.isArray(result)) {
        setUsers(result);
      } else if (result.data && Array.isArray(result.data)) {
        setUsers(result.data);
      } else if (result.users && Array.isArray(result.users)) {
        setUsers(result.users);
      } else {
        console.error("Unexpected data format:", result);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data users",
        variant: "destructive",
      });
      setUsers([]);
    }
  };

  const fetchMenus = async () => {
    try {
      const response = await fetch("/api/menus/all");
      if (!response.ok) throw new Error("Failed to fetch menus");
      const result = await response.json();

      if (Array.isArray(result)) {
        setMenus(result);
      } else if (result.data && Array.isArray(result.data)) {
        setMenus(result.data);
      } else if (result.menus && Array.isArray(result.menus)) {
        setMenus(result.menus);
      } else {
        console.error("Unexpected menu data format:", result);
        setMenus([]);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data menu",
        variant: "destructive",
      });
      setMenus([]);
    }
  };

  const fetchUserAccess = async (userId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/menu-access`);
      if (!response.ok) throw new Error("Failed to fetch user access");
      const data = await response.json();
      setSelectedMenus(data.menuIds || []);
      setSelectedSubMenus(data.subMenuIds || []);

      const menusToExpand =
        data.subMenuIds
          ?.map((subMenuId: number) => {
            const menu = menus.find((m) =>
              m.subMenus.some((sm) => sm.id === subMenuId)
            );
            return menu?.id;
          })
          .filter((id: number | undefined): id is number => id !== undefined) ||
        [];

      setExpandedMenus(menusToExpand);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat akses menu user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAccess = async (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
    await fetchUserAccess(user.id);
  };

  const handleToggleVisibility = async (menu: Menu) => {
    setIsTogglingVisibility(menu.id);
    try {
      const response = await fetch(`/api/menus/${menu.id}/toggle-visibility`, {
        method: "PATCH",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to toggle visibility");
      }

      toast({
        title: "Berhasil",
        description: result.message,
      });

      fetchMenus();
    } catch (error: any) {
      console.error("Error toggling visibility:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah status menu",
        variant: "destructive",
      });
    } finally {
      setIsTogglingVisibility(null);
    }
  };

  const handleMenuToggle = (menuId: number) => {
    setSelectedMenus((prev) => {
      const newMenus = prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId];

      if (!newMenus.includes(menuId)) {
        const menu = menus.find((m) => m.id === menuId);
        if (menu) {
          const subMenuIds = menu.subMenus.map((sm) => sm.id);
          setSelectedSubMenus((prevSubs) =>
            prevSubs.filter((id) => !subMenuIds.includes(id))
          );
        }
      }

      return newMenus;
    });
  };

  const handleSubMenuToggle = (subMenuId: number, parentMenuId: number) => {
    setSelectedSubMenus((prev) => {
      const newSubMenus = prev.includes(subMenuId)
        ? prev.filter((id) => id !== subMenuId)
        : [...prev, subMenuId];

      if (newSubMenus.includes(subMenuId)) {
        setSelectedMenus((prevMenus) =>
          prevMenus.includes(parentMenuId)
            ? prevMenus
            : [...prevMenus, parentMenuId]
        );
      }

      return newSubMenus;
    });
  };

  const toggleMenuExpansion = (menuId: number) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSaveAccess = async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/users/${selectedUser.id}/menu-access`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            menuIds: selectedMenus,
            subMenuIds: selectedSubMenus,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save access");

      toast({
        title: "Berhasil",
        description: "Akses menu berhasil diperbarui",
      });

      setIsDialogOpen(false);
      setSelectedUser(null);
      setSelectedMenus([]);
      setSelectedSubMenus([]);
      setExpandedMenus([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan akses menu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDialog = () => {
    if (!isSaving) {
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSelectedMenus([]);
      setSelectedSubMenus([]);
      setExpandedMenus([]);
    }
  };

  // Fungsi untuk form tambah menu
  const handleOpenAddMenuDialog = () => {
    setMenuName("");
    setMenuRoute("");
    setMenuIcon("");
    setSubMenus([]);
    setIsAddMenuDialogOpen(true);
  };

  const handleCloseAddMenuDialog = () => {
    if (!isSaving) {
      setIsAddMenuDialogOpen(false);
      setMenuName("");
      setMenuRoute("");
      setMenuIcon("");
      setSubMenus([]);
    }
  };

  const addSubMenuField = () => {
    setSubMenus([...subMenus, { name: "", route: "" }]);
  };

  const removeSubMenuField = (index: number) => {
    setSubMenus(subMenus.filter((_, i) => i !== index));
  };

  const updateSubMenu = (
    index: number,
    field: "name" | "route",
    value: string
  ) => {
    const updated = [...subMenus];
    updated[index][field] = value;
    setSubMenus(updated);
  };

  const handleSubmitMenu = async () => {
    if (!menuName.trim()) {
      toast({
        title: "Error",
        description: "Nama menu harus diisi",
        variant: "destructive",
      });
      return;
    }

    const validSubMenus = subMenus.filter(
      (sm) => sm.name.trim() && sm.route.trim()
    );

    setIsSaving(true);
    try {
      const response = await fetch("/api/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuName: menuName.trim(),
          menuRoute: menuRoute.trim() || "",
          menuIcon: menuIcon.trim() || "LayoutDashboard",
          subMenus: validSubMenus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create menu");
      }

      toast({
        title: "Berhasil",
        description: "Menu berhasil ditambahkan",
      });

      handleCloseAddMenuDialog();
      fetchMenus();
    } catch (error: any) {
      console.error("Error creating menu:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan menu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler untuk membuka dialog daftar menu
  const handleOpenMenuListDialog = () => {
    setIsMenuListDialogOpen(true);
  };

  // Handler untuk membuka dialog edit
  const handleOpenEditDialog = (menu: Menu) => {
    setSelectedMenu(menu);
    setEditMenuName(menu.name || "");
    setEditMenuRoute(menu.route || "");
    setEditMenuIcon(menu.icon || "");
    // PENTING: Sertakan id submenu agar bisa di-update, bukan delete+insert
    setEditSubMenus(
      menu.subMenus.map((sm) => ({
        id: sm.id,
        name: sm.name || "",
        route: sm.route || "",
      }))
    );
    setIsEditMenuDialogOpen(true);
  };

  // Handler untuk menutup dialog edit
  const handleCloseEditDialog = () => {
    if (!isSaving) {
      setIsEditMenuDialogOpen(false);
      setSelectedMenu(null);
      setEditMenuName("");
      setEditMenuRoute("");
      setEditMenuIcon("");
      setEditSubMenus([]);
    }
  };

  // Handler untuk update submenu saat edit
  const updateEditSubMenu = (
    index: number,
    field: "name" | "route",
    value: string
  ) => {
    const updated = [...editSubMenus];
    updated[index] = { ...updated[index], [field]: value };
    setEditSubMenus(updated);
  };

  // Handler untuk menambah submenu baru saat edit
  const addEditSubMenuField = () => {
    // Submenu baru tidak punya id, akan di-INSERT
    setEditSubMenus([...editSubMenus, { name: "", route: "" }]);
  };

  // Handler untuk remove submenu saat edit
  const removeEditSubMenuField = (index: number) => {
    setEditSubMenus(editSubMenus.filter((_, i) => i !== index));
  };

  // Handler untuk submit edit menu
  const handleSubmitEditMenu = async () => {
    if (!selectedMenu || !editMenuName.trim()) {
      toast({
        title: "Error",
        description: "Nama menu harus diisi",
        variant: "destructive",
      });
      return;
    }

    const validSubMenus = editSubMenus.filter(
      (sm) => sm.name.trim() && sm.route.trim()
    );

    setIsSaving(true);
    try {
      const response = await fetch(`/api/menus/${selectedMenu.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuName: editMenuName.trim(),
          menuRoute: editMenuRoute.trim() || "",
          menuIcon: editMenuIcon.trim() || "LayoutDashboard",
          subMenus: validSubMenus, // ✅ Kirim dengan id jika ada
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update menu");
      }

      toast({
        title: "Berhasil",
        description: "Menu berhasil diperbarui",
      });

      handleCloseEditDialog();
      fetchMenus();
    } catch (error: any) {
      console.error("Error updating menu:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui menu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler untuk membuka dialog konfirmasi hapus
  const handleOpenDeleteDialog = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsDeleteDialogOpen(true);
  };

  // Handler untuk menutup dialog hapus
  const handleCloseDeleteDialog = () => {
    if (!isSaving) {
      setIsDeleteDialogOpen(false);
      setSelectedMenu(null);
    }
  };

  // Handler untuk konfirmasi hapus menu
  const handleConfirmDelete = async () => {
    if (!selectedMenu) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/menus/${selectedMenu.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete menu");
      }

      toast({
        title: "Berhasil",
        description: "Menu berhasil dihapus",
      });

      handleCloseDeleteDialog();
      fetchMenus();
    } catch (error: any) {
      console.error("Error deleting menu:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus menu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDivisi("all");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-10">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Kelola Menu Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Tetapkan hak akses dan peran pengguna untuk memastikan setiap tim
          bekerja sesuai tanggung jawabnya
        </p>
      </header>

      <div className="dark:bg-transparent border rounded-lg shadow-none overflow-hidden">
        <div className="flex flex-col gap-4 p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleOpenAddMenuDialog}
              className="text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Menu
            </Button>
            <Button
              onClick={handleOpenMenuListDialog}
              className="text-sm cursor-pointer"
            >
              <List className="h-4 w-4" />
              Daftar Menu
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau kode karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm bg-white"
              />
            </div>
            <div className="sm:w-64">
              <Select value={selectedDivisi} onValueChange={setSelectedDivisi}>
                <SelectTrigger className="text-sm w-full bg-white">
                  <SelectValue placeholder="Filter Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {divisiList.map((divisi) => (
                    <SelectItem
                      key={divisi.kode_divisi}
                      value={divisi.kode_divisi}
                    >
                      {divisi.nama_divisi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || selectedDivisi !== "all") && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {(searchQuery || selectedDivisi !== "all") && (
            <div className="flex gap-2 flex-wrap">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Pencarian: "{searchQuery}"
                </Badge>
              )}
              {selectedDivisi !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Divisi:{" "}
                  {
                    divisiList.find((d) => d.kode_divisi === selectedDivisi)
                      ?.nama_divisi
                  }
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-transparent overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Kode Karyawan</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Posisi/Jabatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!currentUsers || currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    {searchQuery
                      ? "Tidak ada data yang ditemukan"
                      : "Tidak ada data users"}
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell className="py-6">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.kode_pegawai}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className="text-xs px-4 py-2 rounded-lg"
                      >
                        {user.divisi_name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {user.role_name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className="rounded-sm px-4 py-1.5 capitalize"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleEditAccess(user)}
                      >
                        Edit Akses
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-center sm:justify-between">
            <div className="hidden sm:block text-xs">
              Menampilkan <span className="font-medium">{startIndex + 1}</span>{" "}
              sampai{" "}
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

      {/* Dialog Edit Akses Menu User */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Edit Akses Menu</DialogTitle>
            <DialogDescription asChild>
              <div>
                {selectedUser && (
                  <div className="mt-3 space-y-1.5 text-sm text-left">
                    <div className="flex">
                      <span className="font-semibold w-32">Nama </span>
                      <span>{selectedUser.name}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-32">Kode Pegawai</span>
                      <span>{selectedUser.kode_pegawai}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold w-32">Role</span>
                      <span className="capitalize">
                        {selectedUser.role_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Pilih Menu yang Dapat Diakses
                </Label>
                <span className="text-sm text-muted-foreground">
                  {selectedMenus.length} menu dipilih
                </span>
              </div>

              <div className="space-y-2">
                {menus.map((menu) => (
                  <div key={menu.id} className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg transition-colors">
                      {menu.subMenus.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 "
                          onClick={() => toggleMenuExpansion(menu.id)}
                        >
                          {expandedMenus.includes(menu.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Checkbox
                        id={`menu-${menu.id}`}
                        checked={selectedMenus.includes(menu.id)}
                        onCheckedChange={() => handleMenuToggle(menu.id)}
                      />
                      <Label
                        htmlFor={`menu-${menu.id}`}
                        className="flex-1 cursor-pointer font-medium text-sm"
                      >
                        {menu.name}
                      </Label>
                      {menu.subMenus.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {
                            menu.subMenus.filter((sm) =>
                              selectedSubMenus.includes(sm.id)
                            ).length
                          }
                          /{menu.subMenus.length}
                        </Badge>
                      )}
                    </div>

                    {menu.subMenus.length > 0 &&
                      expandedMenus.includes(menu.id) && (
                        <div className="ml-8 space-y-2 pl-4 border-l-2">
                          {menu.subMenus.map((subMenu) => (
                            <div
                              key={subMenu.id}
                              className="flex items-center space-x-2 p-2.5 border rounded transition-colors"
                            >
                              <Checkbox
                                id={`submenu-${subMenu.id}`}
                                checked={selectedSubMenus.includes(subMenu.id)}
                                onCheckedChange={() =>
                                  handleSubMenuToggle(subMenu.id, menu.id)
                                }
                                disabled={!selectedMenus.includes(menu.id)}
                              />
                              <Label
                                htmlFor={`submenu-${subMenu.id}`}
                                className={`flex-1 cursor-pointer text-sm ${
                                  !selectedMenus.includes(menu.id)
                                    ? "text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {subMenu.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveAccess}
              disabled={isSaving || isLoading}
              className="cursor-pointer"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Menu Baru */}
      <Dialog
        open={isAddMenuDialogOpen}
        onOpenChange={handleCloseAddMenuDialog}
      >
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Tambah Menu Baru</DialogTitle>
            <DialogDescription>
              Tambahkan menu baru beserta submenu (opsional)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-sm">Informasi Menu</h3>

              <div className="space-y-2">
                <Label htmlFor="menuName">Nama Menu</Label>
                <Input
                  id="menuName"
                  placeholder="Contoh: Data Master"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="menuRoute">Route Menu</Label>
                <Input
                  id="menuRoute"
                  placeholder="Contoh: /dashboard/master (boleh dikosongkan)"
                  value={menuRoute}
                  onChange={(e) => setMenuRoute(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Route harus diawali dengan / jika diisi, dan unik
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="menuIcon">Icon (Opsional)</Label>
                <Input
                  id="menuIcon"
                  placeholder="Contoh: Database"
                  value={menuIcon}
                  onChange={(e) => setMenuIcon(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Nama icon dari lucide-react
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Submenu (Opsional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubMenuField}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Submenu
                </Button>
              </div>

              {subMenus.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Belum ada submenu. Klik tombol di atas untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {subMenus.map((subMenu, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Submenu #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubMenuField(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`subMenuName-${index}`}>
                          Nama Submenu
                        </Label>
                        <Input
                          id={`subMenuName-${index}`}
                          placeholder="Contoh: Kelola User"
                          value={subMenu.name}
                          onChange={(e) =>
                            updateSubMenu(index, "name", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`subMenuRoute-${index}`}>
                          Route Submenu
                        </Label>
                        <Input
                          id={`subMenuRoute-${index}`}
                          placeholder="Contoh: /dashboard/master/users"
                          value={subMenu.route}
                          onChange={(e) =>
                            updateSubMenu(index, "route", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseAddMenuDialog}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitMenu}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isMenuListDialogOpen}
        onOpenChange={setIsMenuListDialogOpen}
      >
        <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftar Menu Dashboard</DialogTitle>
            <DialogDescription>
              Kelola menu dan submenu dashboard. Menu yang disembunyikan
              ditampilkan dengan warna abu-abu.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] hidden sm:table-cell">
                    No
                  </TableHead>
                  <TableHead>Nama Menu</TableHead>
                  <TableHead className="hidden sm:table-cell">Route</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="text-center hidden sm:table-cell">
                    Submenu
                  </TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Belum ada menu
                    </TableCell>
                  </TableRow>
                ) : (
                  menus.map((menu, index) => (
                    <React.Fragment key={menu.id}>
                      <TableRow
                        className={`${!menu.is_active ? "opacity-60" : ""}`}
                      >
                        <TableCell className="font-medium hidden sm:table-cell">
                          {index + 1}
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            !menu.is_active ? "line-through" : ""
                          }`}
                        >
                          {menu.name}
                        </TableCell>
                        <TableCell
                          className={`text-sm hidden sm:table-cell ${
                            !menu.is_active ? "" : "text-muted-foreground"
                          }`}
                        >
                          {menu.route || "-"}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Badge
                            variant={menu.is_active ? "default" : "secondary"}
                            className={`${
                              menu.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {menu.is_active ? "Aktif" : "Disembunyikan"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Badge variant="secondary">
                            {menu.subMenus.length} submenu
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleVisibility(menu)}
                              disabled={isTogglingVisibility === menu.id}
                              title={
                                menu.is_active ? "Sembunyikan" : "Tampilkan"
                              }
                            >
                              {isTogglingVisibility === menu.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : menu.is_active ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDialog(menu)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(menu)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {menu.subMenus.length > 0 &&
                        menu.subMenus.map((subMenu) => (
                          <TableRow
                            key={`sub-${subMenu.id}`}
                            className={`${
                              !subMenu.is_active || !menu.is_active
                                ? "opacity-60"
                                : ""
                            }`}
                          >
                            <TableCell className="hidden sm:table-cell"></TableCell>
                            <TableCell
                              className={`pl-8 text-sm ${
                                !subMenu.is_active || !menu.is_active
                                  ? "text-gray-400 line-through"
                                  : ""
                              }`}
                            >
                              <span className="text-muted-foreground">↳</span>{" "}
                              {subMenu.name}
                            </TableCell>
                            <TableCell
                              className={`text-sm hidden sm:table-cell ${
                                !subMenu.is_active || !menu.is_active
                                  ? "text-gray-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {subMenu.route}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell"></TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  !subMenu.is_active || !menu.is_active
                                    ? "bg-gray-200 text-gray-600"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {subMenu.is_active && menu.is_active
                                  ? "Aktif"
                                  : "Disembunyikan"}
                              </Badge>
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              className="hidden sm:table-cell"
                            ></TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMenuListDialogOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Menu */}
      <Dialog open={isEditMenuDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>
              Ubah informasi menu dan submenu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-sm">Informasi Menu</h3>

              <div className="space-y-2">
                <Label htmlFor="editMenuName">
                  Nama Menu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editMenuName"
                  placeholder="Contoh: Data Master"
                  value={editMenuName}
                  onChange={(e) => setEditMenuName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMenuRoute">Route Menu</Label>
                <Input
                  id="editMenuRoute"
                  placeholder="Contoh: /dashboard/master"
                  value={editMenuRoute}
                  onChange={(e) => setEditMenuRoute(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMenuIcon">Icon</Label>
                <Input
                  id="editMenuIcon"
                  placeholder="Contoh: Database"
                  value={editMenuIcon}
                  onChange={(e) => setEditMenuIcon(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Submenu</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditSubMenuField}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Submenu
                </Button>
              </div>

              {editSubMenus.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Belum ada submenu
                </div>
              ) : (
                <div className="space-y-3">
                  {editSubMenus.map((subMenu, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {subMenu.id
                            ? `Submenu (ID: ${subMenu.id})`
                            : `Submenu Baru #${index + 1}`}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEditSubMenuField(index)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`editSubMenuName-${index}`}>
                          Nama Submenu
                        </Label>
                        <Input
                          id={`editSubMenuName-${index}`}
                          placeholder="Contoh: Kelola User"
                          value={subMenu.name}
                          onChange={(e) =>
                            updateEditSubMenu(index, "name", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`editSubMenuRoute-${index}`}>
                          Route Submenu
                        </Label>
                        <Input
                          id={`editSubMenuRoute-${index}`}
                          placeholder="Contoh: /dashboard/master/users"
                          value={subMenu.route}
                          onChange={(e) =>
                            updateEditSubMenu(index, "route", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseEditDialog}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitEditMenu} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Menu</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>Apakah Anda yakin ingin menghapus menu ini?</p>
                {selectedMenu && (
                  <div className="p-3 rounded-lg space-y-1">
                    <p className="font-semibold">{selectedMenu.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Route: {selectedMenu.route || "-"}
                    </p>
                    {selectedMenu.subMenus.length > 0 && (
                      <p className="text-sm text-red-600 font-medium">
                        ⚠️ Memiliki {selectedMenu.subMenus.length} submenu yang
                        akan ikut terhapus
                      </p>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
