// app/dashboard/website/hero-section/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Trash2, Eye, EyeOff, Edit, Plus, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface HeroSection {
  id: number;
  type: "image" | "video";
  file_name: string;
  title: string;
  subtitle: string | null;
  cta: string | null;
  button_link: string;
  queue: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
}

export default function HeroSectionPage() {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    type: "image" as "image" | "video",
    file: null as File | null,
    file_name: "",
    title: "",
    subtitle: "",
    cta: "",
    button_link: "",
    queue: "",
  });

  // Fetch hero sections
  const fetchHeroSections = async () => {
    try {
      const response = await fetch("/api/hero-section");
      const result = await response.json();
      if (result.success) {
        setHeroSections(result.data);
      }
    } catch (error) {
      console.error("Error fetching:", error);
      toast.error("Gagal memuat data hero section");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroSections();
  }, []);

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran
      const maxSize =
        formData.type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(
          `File terlalu besar. Ukuran maksimal ${
            formData.type === "image" ? "5MB" : "50MB"
          }`
        );
        return;
      }

      setFormData({ ...formData, file });

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload file
  const uploadFile = async (file: File, type: string): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("type", type);

    const response = await fetch("/api/hero-section/upload", {
      method: "POST",
      body: uploadFormData,
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return result.filename;
  };

  // Submit form (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const loadingToast = toast.loading(
      editMode ? "Mengupdate hero section..." : "Menambahkan hero section..."
    );

    try {
      let fileName = formData.file_name;

      // Upload file jika ada file baru
      if (formData.file) {
        fileName = await uploadFile(formData.file, formData.type);
      }

      const payload = {
        type: formData.type,
        file_name: fileName,
        title: formData.title,
        subtitle: formData.subtitle || null,
        cta: formData.cta || null,
        button_link: formData.button_link,
        queue: formData.queue ? parseInt(formData.queue) : null,
      };

      let response;
      if (editMode && currentId) {
        // Update
        response = await fetch(`/api/hero-section/${currentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        response = await fetch("/api/hero-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();
      if (result.success) {
        toast.success(
          editMode
            ? "Hero section berhasil diupdate!"
            : "Hero section berhasil ditambahkan!",
          {
            id: loadingToast,
          }
        );
        setShowModal(false);
        resetForm();
        fetchHeroSections();
      } else {
        toast.error(result.error || "Gagal menyimpan data", {
          id: loadingToast,
        });
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Gagal menyimpan data", {
        id: loadingToast,
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    const loadingToast = toast.loading("Menghapus hero section...");

    try {
      const response = await fetch(`/api/hero-section/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Hero section berhasil dihapus!", {
          id: loadingToast,
        });
        fetchHeroSections();
      } else {
        toast.error(result.error || "Gagal menghapus", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus hero section", {
        id: loadingToast,
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Toggle visibility
  const handleToggleVisibility = async (
    id: number,
    currentVisibility: number
  ) => {
    const loadingToast = toast.loading(
      currentVisibility ? "Menyembunyikan..." : "Menampilkan..."
    );

    try {
      const response = await fetch(`/api/hero-section/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: currentVisibility ? 0 : 1 }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(
          currentVisibility
            ? "Hero section berhasil disembunyikan"
            : "Hero section berhasil ditampilkan",
          { id: loadingToast }
        );
        fetchHeroSections();
      } else {
        toast.error(result.error || "Gagal mengubah visibility", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Toggle visibility error:", error);
      toast.error("Gagal mengubah visibility", {
        id: loadingToast,
      });
    }
  };

  // Edit
  const handleEdit = (hero: HeroSection) => {
    setEditMode(true);
    setCurrentId(hero.id);
    setFormData({
      type: hero.type,
      file: null,
      file_name: hero.file_name,
      title: hero.title,
      subtitle: hero.subtitle || "",
      cta: hero.cta || "",
      button_link: hero.button_link,
      queue: hero.queue.toString(),
    });
    setFilePreview(hero.file_name);
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      type: "image",
      file: null,
      file_name: "",
      title: "",
      subtitle: "",
      cta: "",
      button_link: "",
      queue: "",
    });
    setFilePreview(null);
    setEditMode(false);
    setCurrentId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Section</h1>
          <p className="text-muted-foreground mt-2">
            Kelola semua konten di halaman Hero Section
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="border rounded-lg shadow-none overflow-hidden">
        <div className="flex flex-col p-4 gap-4 border-b">
          <div className="flex flex-col lg:flex-row w-full gap-3 items-start">
            <Button
              onClick={openAddModal}
              size="default"
              className="max-w-44 cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Hero
            </Button>
          </div>

          <div className="p-4 overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-24">Preview</TableHead>
                  <TableHead className="w-24">Tipe</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Ringkasan</TableHead>
                  <TableHead className="w-20">Posisi Antrian</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {heroSections.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Belum ada hero section. Klik tombol "Tambah Hero" untuk
                      memulai.
                    </TableCell>
                  </TableRow>
                ) : (
                  heroSections.map((hero) => (
                    <TableRow key={hero.id}>
                      <TableCell>
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                          {hero.type === "image" ? (
                            <img
                              src={hero.file_name}
                              alt={hero.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="relative w-full h-full">
                              <video
                                src={hero.file_name}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="px-4 py-2 rounded-lg capitalize"
                        >
                          {hero.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs font-medium truncate">
                        {hero.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {hero.subtitle || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="px-4 py-2 rounded-lg"
                        >
                          {hero.queue}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hero.is_visible ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-500 px-4 py-2 rounded-lg"
                          >
                            Visible
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className=" px-4 py-2 rounded-lg"
                          >
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            onClick={() =>
                              handleToggleVisibility(hero.id, hero.is_visible)
                            }
                            variant="secondary"
                            size="icon"
                            className="cursor-pointer"
                            title={
                              hero.is_visible ? "Sembunyikan" : "Tampilkan"
                            }
                          >
                            {hero.is_visible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleEdit(hero)}
                            variant="secondary"
                            size="icon"
                            title="Edit"
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => confirmDelete(hero.id)}
                            variant="secondary"
                            size="icon"
                            title="Hapus"
                            className="cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-4xl! max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Hero Section" : "Tambah Hero Section"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Perbarui informasi hero section"
                : "Tambahkan hero section baru ke halaman utama"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Media *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "image" | "video") =>
                    setFormData({
                      ...formData,
                      type: value,
                      file: null,
                      file_name: "",
                    })
                  }
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="col-span-3 space-y-2">
                <Label htmlFor="file">
                  File {formData.type === "image" ? "Gambar" : "Video"}
                  {editMode ? " (kosongkan jika tidak ingin mengubah)" : " *"}
                </Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      id="file"
                      type="file"
                      accept={formData.type === "image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.type === "image"
                      ? "Format: JPEG, PNG, WEBP, SVG. Maksimal 5MB"
                      : "Format: MP4, WEBM, OGG. Maksimal 50MB"}
                  </p>
                  {filePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
                      {formData.type === "image" ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <video
                          src={filePreview}
                          className="w-full h-full object-contain"
                          controls
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Judul *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Masukkan judul hero section"
                required
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subjudul</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Masukkan subjudul (opsional)"
              />
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <Label htmlFor="cta">Teks Tombol (CTA)</Label>
              <Input
                id="cta"
                type="text"
                value={formData.cta}
                onChange={(e) =>
                  setFormData({ ...formData, cta: e.target.value })
                }
                placeholder="Contoh: Selengkapnya, Lihat Detail"
              />
            </div>

            {/* Button Link */}
            <div className="space-y-2">
              <Label htmlFor="button_link">Link Tombol *</Label>
              <Input
                id="button_link"
                type="text"
                value={formData.button_link}
                onChange={(e) =>
                  setFormData({ ...formData, button_link: e.target.value })
                }
                placeholder="Contoh: /about atau https://example.com"
                required
              />
            </div>

            {/* Queue */}
            <div className="space-y-2">
              <Label htmlFor="queue">Urutan (Queue)</Label>
              <Input
                id="queue"
                type="number"
                value={formData.queue}
                onChange={(e) =>
                  setFormData({ ...formData, queue: e.target.value })
                }
                placeholder="Kosongkan untuk urutan otomatis"
              />
              <p className="text-xs text-muted-foreground">
                Urutan tampilan hero section (angka kecil muncul duluan)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? "Menyimpan..." : editMode ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Hero section akan dihapus
              permanen dari database beserta file-nya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
