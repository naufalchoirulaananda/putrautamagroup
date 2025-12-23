"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import {
  Camera,
  Save,
  Loader2,
  User,
  Eye,
  EyeOff,
  Calendar as CalendarIcon,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: number;
  name: string;
  kode_pegawai: string;
  tanggal_lahir: string | null;
  foto_profil: string | null;
  password: string;
  role_id: number;
  role_name: string;
  status: string;
  cabang_id: string | null;
}

// Helper function untuk create image dari URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

// Helper function untuk mendapatkan rotated image
async function getRotatedImage(
  imageSrc: string,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const orientationChanged =
    rotation === 90 || rotation === -90 || rotation === 270 || rotation === -270;
  if (orientationChanged) {
    canvas.width = image.height;
    canvas.height = image.width;
  } else {
    canvas.width = image.width;
    canvas.height = image.height;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      }
    }, "image/jpeg");
  });
}

// Helper function untuk crop image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
}

export default function SettingsProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tanggalLahir, setTanggalLahir] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: "",
    kode_pegawai: "",
    password: "",
    foto_profil: null as File | null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Crop states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.data);

        if (data.data.tanggal_lahir) {
          const dateStr = data.data.tanggal_lahir.split("T")[0];
          const [year, month, day] = dateStr.split("-");
          setTanggalLahir(
            new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          );
        }

        setFormData({
          name: data.data.name || "",
          kode_pegawai: data.data.kode_pegawai || "",
          password: "",
          foto_profil: null,
        });

        if (data.data.foto_profil) {
          setPreviewImage(data.data.foto_profil);
        }
      } else {
        setError("Gagal memuat profil");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Terjadi kesalahan saat memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran foto maksimal 5MB");
        return;
      }

      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      // Baca file untuk cropping
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropDialog(true);
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels,
        rotation
      );

      if (croppedBlob) {
        // Convert blob to file
        const croppedFile = new File([croppedBlob], "profile.jpg", {
          type: "image/jpeg",
        });

        setFormData({ ...formData, foto_profil: croppedFile });

        // Preview image
        const previewUrl = URL.createObjectURL(croppedBlob);
        setPreviewImage(previewUrl);
      }

      setShowCropDialog(false);
      setImageToCrop(null);
    } catch (error) {
      console.error("Error cropping image:", error);
      setError("Gagal memotong gambar");
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setImageToCrop(null);
    setZoom(1);
    setRotation(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("kode_pegawai", formData.kode_pegawai);

      if (tanggalLahir) {
        const formattedDate = format(tanggalLahir, "yyyy-MM-dd");
        submitData.append("tanggal_lahir", formattedDate);
      } else {
        submitData.append("tanggal_lahir", "");
      }

      if (formData.password) {
        submitData.append("password", formData.password);
      }

      if (formData.foto_profil) {
        submitData.append("foto_profil", formData.foto_profil);
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Profil berhasil diupdate");
        setProfile(data.data);
        setFormData({ ...formData, password: "" });

        const event = new CustomEvent("profileUpdated", {
          detail: { foto_profil: data.data.foto_profil },
        });
        window.dispatchEvent(event);

        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(data.error || "Gagal mengupdate profil");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengupdate profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Pengaturan Profil</h1>
        <p className="text-gray-500 mt-2">
          Lengkapi data profil dan sesuaikan pengaturan akun
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-4xl! space-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Crop Foto Profil</DialogTitle>
            <DialogDescription>
              Sesuaikan posisi dan ukuran foto Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Zoom</Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rotasi</Label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCropCancel}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Batal
              </Button>
              <Button
                onClick={handleCropConfirm}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Terapkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Foto Profil Section */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Foto Profil</h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-lg overflow-hidden border-4">
                {previewImage ? (
                  previewImage.startsWith("data:") ||
                  previewImage.startsWith("blob:") ? (
                    <img
                      src={previewImage}
                      alt="Foto Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={previewImage}
                      alt="Foto Profil"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              <label
                htmlFor="foto_profil"
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-lg cursor-pointer shadow-lg transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  id="foto_profil"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <h3 className="font-medium mb-1">Upload Foto Profil</h3>
              <p className="text-sm text-gray-500 mb-2">
                Format: JPG, PNG, atau GIF. Maksimal 5MB.
              </p>
              <p className="text-xs text-gray-400">
                Foto akan dipotong menjadi persegi (1:1) dan ditampilkan di seluruh sistem.
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Pribadi Section */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Informasi Pribadi</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Nama Lengkap
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 text-sm py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Kode Karyawan
              </Label>
              <Input
                type="text"
                value={formData.kode_pegawai}
                disabled
                onChange={(e) =>
                  setFormData({ ...formData, kode_pegawai: e.target.value })
                }
                className="w-full px-4 text-sm py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Tanggal Lahir
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !tanggalLahir && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tanggalLahir ? (
                      format(tanggalLahir, "dd MMMM yyyy", { locale: id })
                    ) : (
                      <span>Pilih tanggal lahir</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tanggalLahir}
                    onSelect={setTanggalLahir}
                    initialFocus
                    locale={id}
                    defaultMonth={tanggalLahir || new Date(2000, 0, 1)}
                    captionLayout="dropdown"
                    fromYear={1950}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 mt-1">
                Format: Tanggal Bulan Tahun
              </p>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Posisi/Jabatan
              </Label>
              <Input
                type="text"
                value={profile?.role_name || "-"}
                disabled
                className="w-full px-4 text-sm py-2 border rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Posisi/Jabatan tidak dapat diubah sendiri
              </p>
            </div>
          </div>
        </div>

        {/* Keamanan Section */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Keamanan</h2>

          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Password Lama
              </Label>
              <div className="relative">
                <Input
                  type={showOldPassword ? "text" : "password"}
                  value={profile?.password || ""}
                  disabled
                  placeholder="••••••••"
                  className="w-full text-sm px-4 py-2 pr-10 border rounded-lg cursor-not-allowed"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showOldPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password saat ini (hanya untuk referensi)
              </p>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Masukkan password baru..."
                  className="w-full px-4 text-sm py-2 pr-10 border rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Kosongkan jika tidak ingin mengubah password.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="lg"
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg"
          >
            Batal
          </Button>
          <Button
            variant="default"
            size="lg"
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                Menyimpan...
              </>
            ) : (
              <>
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}