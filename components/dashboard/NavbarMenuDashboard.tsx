"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Menu } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Types
interface NavbarMenuItem {
  id: number;
  parent_id: number | null;
  title: string;
  href: string;
  description: string;
  icon: string;
  is_mobile: boolean;
  is_dropdown: boolean;
  is_visible: boolean;
  position: number;
}

interface FormData {
  id?: number;
  parent_id: number | null;
  title: string;
  href: string;
  description: string;
  icon: string;
  is_mobile: boolean;
  is_dropdown: boolean;
  is_visible: boolean;
  position: number;
}

const NavbarMenuDashboard = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<NavbarMenuItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavbarMenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    parent_id: null,
    title: "",
    href: "",
    description: "",
    icon: "",
    is_mobile: false,
    is_dropdown: false,
    is_visible: true,
    position: 0,
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/navbar-menu/all");
      if (!response.ok) throw new Error("Failed to fetch menu items");
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data menu",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      parent_id: null,
      title: "",
      href: "",
      description: "",
      icon: "",
      is_mobile: false,
      is_dropdown: false,
      is_visible: true,
      position: 0,
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: NavbarMenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        id: item.id,
        parent_id: item.parent_id,
        title: item.title,
        href: item.href,
        description: item.description || "",
        icon: item.icon || "",
        is_mobile: item.is_mobile,
        is_dropdown: item.is_dropdown,
        is_visible: item.is_visible,
        position: item.position,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(resetForm, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingItem
        ? `/api/navbar-menu/update`
        : `/api/navbar-menu/create`;

      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save menu item");
      }

      await fetchMenuItems();
      handleCloseDialog();
      toast({
        title: "Success",
        description: editingItem
          ? "Menu berhasil diupdate!"
          : "Menu berhasil ditambahkan!",
      });
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan menu: " + (error as Error).message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (item: NavbarMenuItem) => {
    try {
      const response = await fetch("/api/navbar-menu/toggle-visibility", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: item.id }),
      });

      if (!response.ok) throw new Error("Failed to toggle visibility");

      await fetchMenuItems();
      toast({
        title: "Success",
        description: item.is_visible
          ? "Menu berhasil disembunyikan!"
          : "Menu berhasil ditampilkan!",
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengubah visibility menu",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch("/api/navbar-menu/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deleteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete menu item");
      }

      await fetchMenuItems();
      toast({
        title: "Success",
        description: "Menu berhasil dihapus!",
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus menu: " + (error as Error).message,
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getParentMenus = () => {
    return menuItems.filter((item) => item.parent_id === null);
  };

  const getChildMenus = (parentId: number) => {
    return menuItems.filter((item) => item.parent_id === parentId);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigation Menu</h1>
          <p className="text-muted-foreground mt-2">
            Kelola navigation menu atau navbar untuk semua halaman website
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Menu
        </Button>
      </div>

      {/* Table */}
      <div className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Href</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : menuItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Tidak ada data menu. Klik "Tambah Menu" untuk membuat menu
                  baru.
                </TableCell>
              </TableRow>
            ) : (
              getParentMenus().map((parent) => (
                <React.Fragment key={parent.id}>
                  {/* Parent Menu */}
                  <TableRow
                    className={
                      !parent.is_visible ? "opacity-50 bg-muted/50" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Menu className="h-4 w-4 text-muted-foreground" />
                        <span>{parent.title}</span>
                        {parent.is_dropdown && (
                          <Badge variant="secondary">Dropdown</Badge>
                        )}
                        {parent.is_mobile ? <Badge>Mobile</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {parent.href}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Parent Menu
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {parent.position}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={parent.is_visible ? "default" : "destructive"}
                      >
                        {parent.is_visible ? "Visible" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-start gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(parent)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleVisibility(parent)}
                          title={
                            parent.is_visible ? "Hide (Soft Delete)" : "Show"
                          }
                        >
                          {parent.is_visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(parent.id)}
                          title="Delete Permanently (Hard Delete)"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Child Menus */}
                  {getChildMenus(parent.id).map((child) => (
                    <TableRow
                      key={child.id}
                      className={
                        !child.is_visible ? "opacity-50 bg-muted/50" : ""
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 pl-8">
                          <span className="text-muted-foreground">└─</span>
                          <span>{child.title}</span>
                          {child.is_mobile && (
                            <Badge variant="outline">Mobile</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {child.href}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Sub Menu
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {child.position}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={child.is_visible ? "default" : "destructive"}
                        >
                          {child.is_visible ? "Visible" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-start gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(child)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleVisibility(child)}
                            title={
                              child.is_visible ? "Hide (Soft Delete)" : "Show"
                            }
                          >
                            {child.is_visible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(child.id)}
                            title="Delete Permanently (Hard Delete)"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl! max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu" : "Tambah Menu Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update informasi menu yang sudah ada"
                : "Tambahkan menu baru ke navigation bar"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="parent_id">Parent Menu</Label>
                <Select
                  value={formData.parent_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parent_id: value === "none" ? null : parseInt(value),
                      is_dropdown:
                        value === "none" ? formData.is_dropdown : false,
                    })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih parent menu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Parent Menu)</SelectItem>
                    {getParentMenus().map((parent) => (
                      <SelectItem key={parent.id} value={parent.id.toString()}>
                        {parent.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih parent menu jika ini adalah sub menu
                </p>
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Menu title"
                  disabled={submitting}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="href">
                  Href <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="href"
                  required
                  value={formData.href}
                  onChange={(e) =>
                    setFormData({ ...formData, href: e.target.value })
                  }
                  placeholder="/path atau # untuk dropdown"
                  disabled={submitting}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Menu description (opsional)"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="Icon name (opsional)"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="number"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Urutan menu (ascending)
                </p>
              </div>

              <div className="col-span-2 space-y-4 pt-2">
                {!formData.parent_id && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_dropdown"
                      checked={formData.is_dropdown}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          is_dropdown: checked as boolean,
                        })
                      }
                      disabled={submitting}
                    />
                    <Label
                      htmlFor="is_dropdown"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Is Dropdown (menu ini memiliki sub menu)
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_mobile"
                    checked={formData.is_mobile}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_mobile: checked as boolean,
                      })
                    }
                    disabled={submitting}
                  />
                  <Label
                    htmlFor="is_mobile"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Show in Mobile Menu
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_visible: checked as boolean,
                      })
                    }
                    disabled={submitting}
                  />
                  <Label
                    htmlFor="is_visible"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Visible (tampilkan menu)
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : editingItem ? (
                  "Update"
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menu ini akan dihapus secara
              permanen dari database. Jika menu memiliki sub-menu, Anda harus
              menghapus atau memindahkan sub-menu terlebih dahulu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NavbarMenuDashboard;
