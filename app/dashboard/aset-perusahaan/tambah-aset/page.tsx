"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  ArrowRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import LocationMapAP from "@/components/aset-perusahaan/LocationMap";
import CameraCaptureAP from "@/components/aset-perusahaan/CameraCapture";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface JenisAset {
  id: number;
  jenis_aset: string;
}

interface Divisi {
  kode_divisi: string;
  nama_divisi: string;
}

interface Cabang {
  id: number;
  kode_cabang: string;
  nama_cabang: string;
  divisi_id: string;
  kode_divisi?: string;
}

interface User {
  id: string;
  name: string;
  kode_pegawai: string;
  role: string;
  roleId: number;
}

interface UserList {
  kode_pegawai: string;
  name: string;
  divisi_kode: string;
  email?: string;
  cabang_id?: string;
  role_name?: string;
}

interface Aset {
  kode_aset: string;
  nama_aset: string;
  jenis_aset_id: number;
  jenis_aset: string;
  divisi_id: number;
  kode_divisi?: string;
  nama_divisi: string;
  kode_cabang?: number;
  nama_cabang?: string;
  luas_aset?: number;
  jumlah_aset?: number; // BARU
  status: string;
  tipe_penjualan?: string; // BARU
  foto_1?: string;
  foto_2?: string;
  foto_3?: string;
  foto_4?: string;
  foto_5?: string;
  foto_6?: string;
  foto_7?: string;
  foto_8?: string;
  foto_9?: string;
  foto_10?: string;
  tgl_transaksi: string;
  periode: string;
  nama_pegawai: string;
  kode_pegawai: string;
  penanggung_jawab?: string;
  nama_penanggung_jawab?: string;
  penanggung_jawab_sebelumnya?: string; // BARU
  nama_penanggung_jawab_sebelumnya?: string; // BARU
  keterangan?: string;
  latitude?: number;
  longitude?: number;
  alamat?: string;
}

// Asset List Component
function AssetList({
  asetList,
  isLoading,
  formatCurrency,
  onDelete,
  onEdit,
  onMutasi,
}: {
  asetList: Aset[];
  isLoading: boolean;
  formatCurrency: (value: number) => string;
  onDelete: (kodeAset: string) => void;
  onEdit: (aset: Aset) => void;
  onMutasi: (aset: Aset) => void;
}) {
  const router = useRouter();
  const [selectedAset, setSelectedAset] = useState<Aset | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 my-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="w-full p-2 animate-pulse">
            <CardContent className="p-2 flex flex-col gap-2 w-full">
              <div className="w-full h-48 bg-gray-200 rounded-md" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!asetList || asetList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tidak ada data aset ditemukan</p>
      </div>
    );
  }

  const getPhotoUrls = (aset: Aset): string[] => {
    const photos: string[] = [];
    if (aset.foto_1) photos.push(aset.foto_1);
    if (aset.foto_2) photos.push(aset.foto_2);
    if (aset.foto_3) photos.push(aset.foto_3);
    if (aset.foto_4) photos.push(aset.foto_4);
    if (aset.foto_5) photos.push(aset.foto_5);
    if (aset.foto_6) photos.push(aset.foto_6);
    if (aset.foto_7) photos.push(aset.foto_7);
    if (aset.foto_8) photos.push(aset.foto_8);
    if (aset.foto_9) photos.push(aset.foto_9);
    if (aset.foto_10) photos.push(aset.foto_10);
    return photos;
  };

  const handlePrevPhoto = () => {
    if (!selectedAset) return;
    const photos = getPhotoUrls(selectedAset);
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (!selectedAset) return;
    const photos = getPhotoUrls(selectedAset);
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleOpenDetail = (aset: Aset) => {
    setSelectedAset(aset);
    setCurrentPhotoIndex(0);
  };

  const handleOpenMap = (latitude?: number, longitude?: number) => {
    if (latitude && longitude) {
      window.open(
        `https://www.google.com/maps?q=${latitude},${longitude}`,
        "_blank"
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 my-6">
      {asetList.map((aset, index) => {
        const photos = getPhotoUrls(aset);
        const mainPhoto = photos[0] || "/images/blog1.svg";

        return (
          <Card key={aset.kode_aset} className="w-full p-2">
            <CardContent className="p-2 flex flex-col gap-2 w-full">
              <div className="relative w-full h-48">
                <Image
                  src={mainPhoto}
                  fill
                  alt={aset.nama_aset}
                  className="object-cover rounded-md"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="rounded-lg text-xs px-4 py-2"
                >
                  {aset.jenis_aset}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`${
                    aset.status === "Terjual"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-600"
                  } text-xs rounded-lg px-4 py-2`}
                >
                  {aset.status}
                </Badge>
              </div>

              <p className="text-xl font-normal">{aset.nama_aset}</p>
              <p className="text-xs">{aset.nama_divisi}</p>

              <div className="flex gap-2 mt-2">
                <Dialog>
                  <DialogTrigger
                    onClick={() => handleOpenDetail(aset)}
                    className="flex-1 dark:bg-white bg-black dark:text-black text-white text-sm cursor-pointer rounded-md py-2"
                  >
                    Detail Aset
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="shrink-0">
                      <DialogTitle>{selectedAset?.nama_aset}</DialogTitle>
                      <p className="text-sm text-gray-500">
                        {selectedAset?.kode_aset}
                      </p>
                    </DialogHeader>

                    {selectedAset && (
                      <div className="space-y-4">
                        {/* Photo Carousel */}
                        {getPhotoUrls(selectedAset).length > 0 && (
                          <div className="relative w-full max-w-full h-64 sm:h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={
                                getPhotoUrls(selectedAset)[currentPhotoIndex]
                              }
                              fill
                              alt={`${selectedAset.nama_aset} - Photo ${
                                currentPhotoIndex + 1
                              }`}
                              className="object-contain"
                              sizes="(max-width: 768px) 95vw, (max-width: 1200px) 50vw, 33vw"
                            />

                            {getPhotoUrls(selectedAset).length > 1 && (
                              <>
                                <button
                                  onClick={handlePrevPhoto}
                                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full z-10"
                                >
                                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                                </button>
                                <button
                                  onClick={handleNextPhoto}
                                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full z-10"
                                >
                                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                                </button>

                                {/* 🔥 TAMBAHKAN CAPTION TANGGAL DI SINI */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                    {currentPhotoIndex + 1} /{" "}
                                    {getPhotoUrls(selectedAset).length}
                                  </div>
                                  <div className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs">
                                    📅{" "}
                                    {new Date(
                                      selectedAset.tgl_transaksi
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Photo Thumbnails */}
                        {getPhotoUrls(selectedAset).length > 1 && (
                          <div className="grid grid-cols-4 gap-2">
                            {getPhotoUrls(selectedAset).map((photo, index) => {
                              // 🔥 Hitung foto key untuk menampilkan label
                              const photoKey = `foto_${index + 1}`;

                              return (
                                <button
                                  key={index}
                                  onClick={() => setCurrentPhotoIndex(index)}
                                  className={`relative w-full aspect-square rounded-md overflow-hidden border-2
                ${
                  currentPhotoIndex === index
                    ? "border-blue-500"
                    : "border-gray-200"
                }
              `}
                                >
                                  <Image
                                    src={photo}
                                    fill
                                    alt={`Thumbnail ${index + 1}`}
                                    className="object-cover"
                                  />

                                  {/* 🔥 TAMBAHKAN LABEL DI THUMBNAIL */}
                                  <div className="absolute bottom-1 left-1 right-1">
                                    <div className="bg-black/60 text-white text-xs px-1 py-0.5 rounded text-center">
                                      {photoKey.replace("_", " ").toUpperCase()}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Asset Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {selectedAset.luas_aset && (
                            <div>
                              <p className="text-sm text-gray-500">Luas Aset</p>
                              <p className="font-semibold">
                                {selectedAset.luas_aset} m²
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-500">Jenis Aset</p>
                            <p className="font-semibold">
                              {selectedAset.jenis_aset}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-semibold">
                              {selectedAset.status}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Divisi</p>
                            <p className="font-semibold">
                              {selectedAset.nama_divisi}
                            </p>
                          </div>
                          {selectedAset.nama_cabang && (
                            <div>
                              <p className="text-sm text-gray-500">Cabang</p>
                              <p className="font-semibold">
                                {selectedAset.nama_cabang}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-500">
                              Tanggal Transaksi
                            </p>
                            <p className="font-semibold">
                              {new Date(
                                selectedAset.tgl_transaksi
                              ).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Periode</p>
                            <p className="font-semibold">
                              {selectedAset.periode}
                            </p>
                          </div>
                          {/* Penanggung Jawab Section */}
                          <div className="space-y-3 pt-2 border-t">
                            <h3 className="font-semibold text-sm">
                              Informasi Penanggung Jawab
                            </h3>

                            {selectedAset.nama_penanggung_jawab_sebelumnya && (
                              <div>
                                <p className="text-sm text-gray-500">
                                  Penanggung Jawab Sebelumnya
                                </p>
                                <p className="font-semibold">
                                  {
                                    selectedAset.nama_penanggung_jawab_sebelumnya
                                  }
                                </p>
                              </div>
                            )}

                            {selectedAset.nama_penanggung_jawab ? (
                              <div>
                                <p className="text-sm text-gray-500">
                                  Penanggung Jawab Saat Ini
                                </p>
                                <p className="font-semibold">
                                  {selectedAset.nama_penanggung_jawab}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-gray-500">
                                  Penanggung Jawab
                                </p>
                                <p className="text-sm text-gray-400 italic">
                                  Belum ada penanggung jawab
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedAset.nama_penanggung_jawab && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Penanggung Jawab
                            </p>
                            <p className="font-semibold">
                              {selectedAset.nama_penanggung_jawab}
                            </p>
                          </div>
                        )}

                        {selectedAset.keterangan && (
                          <div>
                            <p className="text-sm text-gray-500">Keterangan</p>
                            <p className="text-sm mt-1">
                              {selectedAset.keterangan}
                            </p>
                          </div>
                        )}

                        {selectedAset.alamat && (
                          <div>
                            <p className="text-sm text-gray-500">Alamat</p>
                            <p className="text-sm mt-1">
                              {selectedAset.alamat}
                            </p>
                          </div>
                        )}

                        {selectedAset.latitude && selectedAset.longitude && (
                          <div>
                            <p className="text-sm text-gray-500 mb-2">
                              Koordinat Lokasi
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Button
                                onClick={() =>
                                  handleOpenMap(
                                    selectedAset.latitude,
                                    selectedAset.longitude
                                  )
                                }
                                variant="outline"
                                className="w-full cursor-pointer"
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Lihat Lokasi Aset di Google Maps
                              </Button>

                              <Button
                                onClick={() => {
                                  if (
                                    selectedAset.latitude &&
                                    selectedAset.longitude
                                  ) {
                                    const mapUrl = `https://www.google.com/maps?q=${selectedAset.latitude},${selectedAset.longitude}`;
                                    navigator.clipboard
                                      .writeText(mapUrl)
                                      .then(() => {
                                        toast.success(
                                          "Link Google Maps berhasil dicopy!",
                                          {
                                            description: (
                                              <span className="text-green-500">
                                                Anda dapat menempelkannya ke
                                                media lain
                                              </span>
                                            ),
                                          }
                                        );
                                      })
                                      .catch(() => {
                                        toast.error("Gagal menyalin link maps");
                                      });
                                  }
                                }}
                                variant="outline"
                                className="w-full cursor-pointer"
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Salin Link Maps
                              </Button>

                              <Button
                                onClick={() => {
                                  if (selectedAset) {
                                    setSelectedAset(null); // Close current dialog
                                    router.push(
                                      `/dashboard/aset-perusahaan/mutasi-aset?kode_aset=${selectedAset.kode_aset}`
                                    );
                                  }
                                }}
                                variant="default"
                                className="w-full cursor-pointer"
                              >
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Detail Mutasi
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={() => {
                    onMutasi(aset);
                  }}
                  className="cursor-pointer"
                >
                  Mutasi Aset
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleOpenMap(aset.latitude, aset.longitude)}
                  disabled={!aset.latitude || !aset.longitude}
                  className="cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                </Button>

                {/* Dropdown menu edit/delete - TANPA pengecekan role */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        onEdit(aset);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        onDelete(aset.kode_aset);
                      }}
                    >
                      <Trash className="h-4 w-4 mr-2 text-red-500" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogOpenJenis, setIsDialogOpenJenis] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoMetadata, setPhotoMetadata] = useState<{
    [key: string]: {
      timestamp: string;
      source: "camera" | "upload" | "existing";
    };
  }>({});

  // Data from API
  const [jenisAsetList, setJenisAsetList] = useState<JenisAset[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [asetList, setAsetList] = useState<Aset[]>([]);

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingAset, setIsLoadingAset] = useState(true);

  // Filter states
  const [filterDivisi, setFilterDivisi] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteKodeAset, setDeleteKodeAset] = useState<string | null>(null);

  const [jenisAsetName, setJenisAsetName] = useState<string>("");
  const [isSubmittingJenis, setIsSubmittingJenis] = useState<boolean>(false);
  const [editingJenisAsetId, setEditingJenisAsetId] = useState<number | null>(
    null
  );
  const [isEditingJenis, setIsEditingJenis] = useState(false);

  const [isMutasiDialogOpen, setIsMutasiDialogOpen] = useState(false);
  const [selectedAsetForMutasi, setSelectedAsetForMutasi] =
    useState<Aset | null>(null);
  const [showCameraForMutasi, setShowCameraForMutasi] = useState(false);
  const [capturedMutasiPhotos, setCapturedMutasiPhotos] = useState<File[]>([]);
  const [isSubmittingMutasi, setIsSubmittingMutasi] = useState(false);

  const [showDeleteJenisDialog, setShowDeleteJenisDialog] = useState(false);
  const [deleteJenisData, setDeleteJenisData] = useState<{
    id: number | null;
    nama: string;
  }>({
    id: null,
    nama: "",
  });

  // Tambahkan function ini sebelum return di component Page
  const needsLuasAset = (jenisAsetId: string) => {
    const jenis = jenisAsetList.find((j) => j.id.toString() === jenisAsetId);
    if (!jenis) return false;

    const luasAsetTypes = ["bangunan", "tanah", "properti", "gedung", "lahan"];
    return luasAsetTypes.some((type) =>
      jenis.jenis_aset.toLowerCase().includes(type)
    );
  };

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<{
    foto_1?: string | null;
    foto_2?: string | null;
    foto_3?: string | null;
    foto_4?: string | null;
    foto_5?: string | null;
    foto_6?: string | null;
    foto_7?: string | null;
    foto_8?: string | null;
    foto_9?: string | null;
    foto_10?: string | null;
  }>({});

  const [mutasiFormData, setMutasiFormData] = useState({
    tipe_mutasi: "",
    divisi_tujuan: "",
    cabang_tujuan: "",
    penanggung_jawab_tujuan: "",
    alasan_mutasi: "",
    keterangan: "",
  });

  const onMutasi = (aset: Aset) => {
    setSelectedAsetForMutasi(aset);

    setMutasiFormData({
      tipe_mutasi: "",
      divisi_tujuan: "",
      cabang_tujuan: "",
      penanggung_jawab_tujuan: "",
      alasan_mutasi: "",
      keterangan: "",
    });

    setCapturedMutasiPhotos([]);
    setShowCameraForMutasi(false);
    setIsMutasiDialogOpen(true);
  };

  const handleMutasiInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMutasiFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMutasiSelectChange = (name: string, value: string) => {
    setMutasiFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-set divisi untuk mutasi antar cabang
    if (
      name === "tipe_mutasi" &&
      value === "antar_cabang" &&
      selectedAsetForMutasi
    ) {
      // Cari kode_divisi dari divisi saat ini
      const currentDivisi = divisiList.find(
        (d) => d.kode_divisi === selectedAsetForMutasi.kode_divisi?.toString()
      );

      setMutasiFormData((prev) => ({
        ...prev,
        divisi_tujuan: currentDivisi?.kode_divisi || "",
        cabang_tujuan: "", // Reset cabang
        penanggung_jawab_tujuan: "", // Reset PJ
      }));
    }

    // 🔥 Reset cabang dan PJ jika divisi berubah (UNTUK SEMUA TIPE)
    if (name === "divisi_tujuan") {
      setMutasiFormData((prev) => ({
        ...prev,
        cabang_tujuan: "",
        penanggung_jawab_tujuan: "",
      }));
    }

    // 🔥 TAMBAHAN: Reset tipe mutasi jika user ubah dari antar_cabang
    if (name === "tipe_mutasi" && value === "antar_divisi") {
      setMutasiFormData((prev) => ({
        ...prev,
        cabang_tujuan: "",
      }));
    }
  };

  const handleMutasiPhotoCapture = (photos: File[]) => {
    setCapturedMutasiPhotos(photos);
  };

  // Submit mutasi
  const handleSubmitMutasi = async () => {
    if (!selectedAsetForMutasi || !currentUser) return;

    // Validasi
    if (!mutasiFormData.tipe_mutasi || !mutasiFormData.divisi_tujuan) {
      toast.error("Mohon lengkapi tipe mutasi dan divisi tujuan");
      return;
    }

    if (
      mutasiFormData.tipe_mutasi === "antar_cabang" &&
      !mutasiFormData.cabang_tujuan
    ) {
      toast.error("Cabang tujuan harus diisi untuk mutasi antar cabang");
      return;
    }

    // Cari kode divisi asal
    const divisiAsal = divisiList.find(
      (d) => d.kode_divisi === selectedAsetForMutasi.divisi_id.toString()
    )?.kode_divisi;

    // Validasi tidak mutasi ke tempat yang sama
    if (
      mutasiFormData.tipe_mutasi === "antar_divisi" &&
      mutasiFormData.divisi_tujuan === divisiAsal
    ) {
      toast.error("Divisi tujuan tidak boleh sama dengan divisi asal");
      return;
    }

    if (
      mutasiFormData.tipe_mutasi === "antar_cabang" &&
      mutasiFormData.divisi_tujuan === divisiAsal &&
      mutasiFormData.cabang_tujuan ===
        selectedAsetForMutasi.kode_cabang?.toString()
    ) {
      toast.error("Cabang tujuan tidak boleh sama dengan cabang asal");
      return;
    }

    try {
      setIsSubmittingMutasi(true);

      const submitData = new FormData();
      submitData.append("kode_aset", selectedAsetForMutasi.kode_aset);
      submitData.append("tipe_mutasi", mutasiFormData.tipe_mutasi);
      submitData.append("divisi_tujuan", mutasiFormData.divisi_tujuan);

      if (mutasiFormData.cabang_tujuan) {
        submitData.append("cabang_tujuan", mutasiFormData.cabang_tujuan);
      }

      if (mutasiFormData.penanggung_jawab_tujuan) {
        submitData.append(
          "penanggung_jawab_tujuan",
          mutasiFormData.penanggung_jawab_tujuan
        );
      }

      if (mutasiFormData.alasan_mutasi) {
        submitData.append("alasan_mutasi", mutasiFormData.alasan_mutasi);
      }

      if (mutasiFormData.keterangan) {
        submitData.append("keterangan", mutasiFormData.keterangan);
      }

      // Tambahkan foto bukti mutasi (maksimal 5)
      capturedMutasiPhotos.slice(0, 5).forEach((file, index) => {
        submitData.append(`foto_bukti_${index + 1}`, file);
      });

      const response = await fetch("/api/mutasi-aset", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Mutasi berhasil dilakukan!");
        resetMutasiForm();
        setIsMutasiDialogOpen(false);
        fetchAsetList(); // Refresh data aset
      } else {
        toast.error(result.message || "Gagal melakukan mutasi");
      }
    } catch (error) {
      console.error("Error submitting mutasi:", error);
      toast.error("Terjadi kesalahan saat melakukan mutasi");
    } finally {
      setIsSubmittingMutasi(false);
    }
  };

  // Reset form mutasi
  const resetMutasiForm = () => {
    setMutasiFormData({
      tipe_mutasi: "",
      divisi_tujuan: "",
      cabang_tujuan: "",
      penanggung_jawab_tujuan: "",
      alasan_mutasi: "",
      keterangan: "",
    });
    setSelectedAsetForMutasi(null);
    setCapturedMutasiPhotos([]);
    setShowCameraForMutasi(false);
  };

  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingKodeAset, setEditingKodeAset] = useState<string | null>(null);

  const [userList, setUserList] = useState<UserList[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserList[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    nama_aset: "",
    luas_aset: "",
    jumlah_aset: "", // BARU
    jenis_aset_id: "",
    divisi_id: "",
    kode_cabang: "",
    penanggung_jawab: "",
    keterangan: "",
    tgl_transaksi: new Date().toISOString().split("T")[0],
    periode: new Date().getFullYear().toString(),
    latitude: null as number | null,
    longitude: null as number | null,
    alamat: "",
    status: "Belum Terjual",
    tipe_penjualan: "tidak_dijual", // BARU
  });

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
    fetchAsetList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAsetList();
    }, 500);
    return () => clearTimeout(timer);
  }, [filterDivisi, searchQuery]);

  // Tambahkan useEffect khusus untuk edit mode
  useEffect(() => {
    if (isEditMode && formData.divisi_id) {
      const filtered = userList.filter(
        (user) =>
          user.divisi_kode === formData.divisi_id &&
          user.kode_pegawai &&
          user.kode_pegawai.trim() !== ""
      );
      setFilteredUsers(filtered);
    }
  }, [isEditMode, formData.divisi_id, userList]);

  useEffect(() => {
    if (formData.divisi_id) {
      const filtered = userList.filter(
        (user) =>
          user.divisi_kode === formData.divisi_id &&
          user.kode_pegawai &&
          user.kode_pegawai.trim() !== ""
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [formData.divisi_id, userList]);

  const fetchInitialData = async () => {
    try {
      setIsLoadingData(true);
      const [jenisRes, divisiRes, cabangRes, userRes, usersListRes] =
        await Promise.all([
          fetch("/api/jenis-aset"),
          fetch("/api/divisi"),
          fetch("/api/cabang"),
          fetch("/api/auth/user"),
          fetch("/api/users"),
        ]);

      const [jenisData, divisiData, cabangData, userData, usersListData] =
        await Promise.all([
          jenisRes.json(),
          divisiRes.json(),
          cabangRes.json(),
          userRes.json(),
          usersListRes.json(),
        ]);

      if (jenisData.success) setJenisAsetList(jenisData.data);
      if (divisiData.success) setDivisiList(divisiData.data);
      if (cabangData.success) setCabangList(cabangData.data);
      if (userData.success) setCurrentUser(userData.data);
      if (usersListData.success) setUserList(usersListData.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Error", {
        description: <span className="text-red-500">Gagal memuat data</span>,
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchJenisAsetList = async () => {
    try {
      const response = await fetch("/api/jenis-aset");
      const data = await response.json();

      if (data.success) {
        setJenisAsetList(data.data);
      } else {
        toast.error(data.message || "Gagal mengambil jenis aset");
      }
    } catch (error) {
      console.error("Error fetching jenis aset:", error);
      toast.error("Terjadi kesalahan, coba lagi.");
    }
  };

  const fetchAsetList = async () => {
    try {
      setIsLoadingAset(true);
      const params = new URLSearchParams();
      if (filterDivisi && filterDivisi !== "all") {
        params.append("divisi_id", filterDivisi);
      }
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/aset-perusahaan?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to fetch aset");
      }

      const data = await response.json();

      if (data.success) {
        setAsetList(data.data || []);
      } else {
        toast.error("Error", {
          description: (
            <span className="text-red-500">
              {data.message || "Gagal memuat data aset"}
            </span>
          ),
        });
        setAsetList([]);
      }
    } catch (error) {
      console.error("Error fetching aset:", error);
      toast.error("Error", {
        description: (
          <span className="text-red-500">
            Gagal memuat data aset. Silakan refresh halaman.
          </span>
        ),
      });
      setAsetList([]);
    } finally {
      setIsLoadingAset(false);
    }
  };

  const onDelete = (kode_aset: string) => {
    setDeleteKodeAset(kode_aset);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteKodeAset) return;

    try {
      const response = await fetch(
        `/api/aset-perusahaan?kode_aset=${deleteKodeAset}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Berhasil!", {
          description: (
            <span className="text-green-500">
              Aset dengan kode {deleteKodeAset} berhasil dihapus
            </span>
          ),
        });
        fetchAsetList();
      } else {
        toast.error("Error", {
          description: (
            <span className="text-red-500">
              {result.message || "Gagal menghapus aset"}
            </span>
          ),
        });
      }
    } catch (error) {
      console.error("Error deleting aset:", error);
      toast.error("Error", {
        description: <span className="text-red-500">Gagal menghapus aset</span>,
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteKodeAset(null);
    }
  };

  const confirmDeleteJenisAset = async () => {
    if (!deleteJenisData.id) return;

    try {
      const response = await fetch(`/api/jenis-aset?id=${deleteJenisData.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Tidak dapat menghapus jenis aset!", {
          description: (
            <span className="text-red-500">
              {result.message ||
                "Jenis aset sedang digunakan pada aset perusahaan."}
            </span>
          ),
        });

        setShowDeleteJenisDialog(false);
        return;
      }

      toast.success("Jenis aset berhasil dihapus!");
      fetchJenisAsetList();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus jenis aset.");
    } finally {
      setShowDeleteJenisDialog(false);
      setDeleteJenisData({ id: null, nama: "" });
    }
  };

  const handleEdit = (aset: Aset) => {
    setIsEditMode(true);
    setEditingKodeAset(aset.kode_aset);

    // 🔥 GUNAKAN kode_divisi LANGSUNG DARI API
    setFormData({
      nama_aset: aset.nama_aset,
      luas_aset: aset.luas_aset?.toString() || "",
      jumlah_aset: aset.jumlah_aset?.toString() || "",
      jenis_aset_id: aset.jenis_aset_id.toString(),
      divisi_id: aset.kode_divisi || "", // 🔥 FIX: gunakan kode_divisi dari API
      kode_cabang: aset.kode_cabang?.toString() || "",
      penanggung_jawab: aset.penanggung_jawab || "",
      keterangan: aset.keterangan || "",
      tgl_transaksi: aset.tgl_transaksi.split("T")[0],
      periode: aset.periode,
      latitude: aset.latitude || null,
      longitude: aset.longitude || null,
      alamat: aset.alamat || "",
      status: aset.status,
      tipe_penjualan: aset.tipe_penjualan || "tidak_dijual",
    });

    setExistingPhotos({
      foto_1: aset.foto_1,
      foto_2: aset.foto_2,
      foto_3: aset.foto_3,
      foto_4: aset.foto_4,
      foto_5: aset.foto_5,
      foto_6: aset.foto_6,
      foto_7: aset.foto_7,
      foto_8: aset.foto_8,
      foto_9: aset.foto_9,
      foto_10: aset.foto_10,
    });

    // Load metadata existing
    const existingMetadata: any = {};
    Object.entries({
      foto_1: aset.foto_1,
      foto_2: aset.foto_2,
      foto_3: aset.foto_3,
      foto_4: aset.foto_4,
      foto_5: aset.foto_5,
      foto_6: aset.foto_6,
      foto_7: aset.foto_7,
      foto_8: aset.foto_8,
      foto_9: aset.foto_9,
      foto_10: aset.foto_10,
    }).forEach(([key, value]) => {
      if (value) {
        existingMetadata[key] = {
          timestamp: aset.tgl_transaksi,
          source: "existing" as const,
        };
      }
    });

    setPhotoMetadata(existingMetadata);
    setPhotosToDelete([]);
    setIsDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    if (files.length > 10) {
      toast.error("Maksimal 10 file!");
      return;
    }

    setUploadedFiles(files);

    // 🔥 Tambah metadata
    const newMetadata: any = {};
    files.forEach((_, index) => {
      newMetadata[`upload_${index}`] = {
        timestamp: new Date().toISOString(),
        source: "upload" as const,
      };
    });

    setPhotoMetadata((prev) => ({ ...prev, ...newMetadata }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoCapture = (photos: File[]) => {
    setCapturedPhotos(photos);

    // 🔥 Tambah metadata
    const newMetadata: any = {};
    photos.forEach((_, index) => {
      newMetadata[`captured_${index}`] = {
        timestamp: new Date().toISOString(),
        source: "camera" as const,
      };
    });

    setPhotoMetadata((prev) => ({ ...prev, ...newMetadata }));
  };

  const handleLocationChange = async (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    setIsConverting(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );

      const data = await response.json();

      if (data && data.display_name) {
        setFormData((prev) => ({
          ...prev,
          alamat: data.display_name,
        }));
      }
    } catch (error) {
      console.error("Error converting coordinates:", error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSubmitJenisAset = async () => {
    if (!jenisAsetName) {
      toast.error("Nama jenis aset harus diisi!");
      return;
    }

    setIsSubmittingJenis(true);

    try {
      const url = isEditingJenis
        ? `/api/jenis-aset?id=${editingJenisAsetId}`
        : "/api/jenis-aset";

      const method = isEditingJenis ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: JSON.stringify({ jenis_aset: jenisAsetName }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Cek apakah response OK sebelum parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Cek apakah ada content di response
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response bukan JSON");
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          isEditingJenis
            ? "Jenis aset berhasil diperbarui!"
            : "Jenis aset berhasil ditambahkan!"
        );

        setJenisAsetName("");
        setIsEditingJenis(false);
        setEditingJenisAsetId(null);

        // Refresh list jenis aset
        await fetchJenisAsetList();
      } else {
        toast.error(result.message || "Gagal menyimpan jenis aset");
      }
    } catch (error) {
      console.error("Error saving jenis aset:", error);
      toast.error(
        "Terjadi kesalahan: " +
          (error instanceof Error ? error.message : "Coba lagi.")
      );
    } finally {
      setIsSubmittingJenis(false);
    }
  };

  // Fungsi untuk handle edit
  const handleEditJenisAset = (id: number, nama: string) => {
    setEditingJenisAsetId(id);
    setJenisAsetName(nama);
    setIsEditingJenis(true);
  };

  // Fungsi untuk handle delete
  const handleDeleteJenisAset = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jenis aset ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jenis-aset?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Jenis aset berhasil dihapus!");
        fetchJenisAsetList();
      } else {
        toast.error(result.message || "Gagal menghapus jenis aset");
      }
    } catch (error) {
      console.error("Error deleting jenis aset:", error);
      toast.error("Terjadi kesalahan, coba lagi.");
    }
  };

  // Fungsi untuk cancel edit
  const handleCancelEditJenis = () => {
    setJenisAsetName("");
    setIsEditingJenis(false);
    setEditingJenisAsetId(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.nama_aset ||
      !formData.jenis_aset_id ||
      !formData.divisi_id ||
      !formData.periode
    ) {
      toast.error("Validasi Error", {
        description: (
          <span className="text-red-500">
            Mohon lengkapi semua field yang wajib diisi
          </span>
        ),
      });
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error("Validasi Error", {
        description: (
          <span className="text-red-500">Lokasi harus diaktifkan</span>
        ),
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = new FormData();

      // Append semua field form ke FormData
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof typeof formData];
        if (value !== null && value !== "") {
          submitData.append(key, value.toString());
        }
      });

      if (formData.penanggung_jawab) {
        const pjUser = userList.find(
          (u) => u.kode_pegawai === formData.penanggung_jawab
        );
        if (pjUser) {
          submitData.append("nama_penanggung_jawab", pjUser.name);
        }
      }

      // Jika EDIT MODE → kirim kode_aset
      if (isEditMode && editingKodeAset) {
        submitData.append("kode_aset", editingKodeAset);

        // 🔥 Kirim existing foto ke backend (HANYA yang MASIH ADA saja)
        Object.entries(existingPhotos).forEach(([key, value]) => {
          if (value && value !== null && value !== undefined) {
            submitData.append(key, value); // foto_1, foto_2, dll
          }
          // ❌ JANGAN kirim "null" untuk yang dihapus, biarkan kosong saja
        });
      }

      // Gabungkan foto baru dari kamera dan upload (MAKSIMAL 10)
      const allPhotos = [...capturedPhotos, ...uploadedFiles].slice(0, 10);

      // Hitung total foto
      const totalExistingPhotos = Object.values(existingPhotos).filter(
        (p) => p !== null && p !== undefined
      ).length;
      const totalNewPhotos = allPhotos.length;
      const totalPhotos = totalExistingPhotos + totalNewPhotos;

      // Validasi total foto - WAJIB minimal 1 foto (baik create maupun edit)
      if (totalPhotos === 0) {
        toast.error("Validasi Error", {
          description: (
            <span className="text-red-500">
              Minimal harus ada 1 foto.{" "}
              {isEditMode
                ? "Tidak bisa menghapus semua foto."
                : "Silakan tambahkan foto."}
            </span>
          ),
        });
        return;
      }

      if (totalPhotos > 10) {
        toast.error("Maksimal 10 foto. Silakan hapus beberapa foto.");
        return;
      }

      // 🔥 Kirim foto baru dengan prefix "new_" agar tidak bentrok
      allPhotos.forEach((file, index) => {
        submitData.append(`new_foto_${index + 1}`, file);
      });

      // Tambahkan data user jika mode tambah
      if (!isEditMode && currentUser) {
        submitData.set("nama_pegawai", currentUser.name);
        submitData.set("kode_pegawai", currentUser.kode_pegawai);
      }

      // Tentukan method POST/PUT
      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch("/api/aset-perusahaan", {
        method: method,
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Berhasil!", {
          description: (
            <span className="text-green-500">
              {isEditMode
                ? `Aset ${editingKodeAset} berhasil diperbarui`
                : `Aset ${result.data.kode_aset} berhasil ditambahkan`}
            </span>
          ),
        });

        resetForm();
        setIsDialogOpen(false);
        fetchAsetList();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error", {
        description: (
          <span className="text-red-500">
            {error instanceof Error
              ? error.message
              : `Gagal ${isEditMode ? "memperbarui" : "menyimpan"} aset`}
          </span>
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_aset: "",
      luas_aset: "",
      jumlah_aset: "",
      jenis_aset_id: "",
      divisi_id: "",
      kode_cabang: "",
      penanggung_jawab: "",
      keterangan: "",
      tgl_transaksi: new Date().toISOString().split("T")[0],
      periode: new Date().getFullYear().toString(),
      latitude: null,
      longitude: null,
      alamat: "",
      status: "Belum Terjual",
      tipe_penjualan: "tidak_dijual",
    });
    setCapturedPhotos([]);
    setUploadedFiles([]);
    setIsEditMode(false);
    setEditingKodeAset(null);
    setExistingPhotos({});
    setPhotosToDelete([]);
    setPhotoMetadata({}); // 🔥 Tambahkan ini
  };

  const handleRemoveExistingPhoto = (photoKey: string) => {
    const photoUrl = existingPhotos[photoKey as keyof typeof existingPhotos];

    if (photoUrl) {
      // Tambahkan ke list foto yang akan dihapus
      setPhotosToDelete((prev) => [...prev, photoKey]);

      // Hapus dari existing photos
      setExistingPhotos((prev) => ({
        ...prev,
        [photoKey]: null,
      }));

      toast.info("Foto ditandai untuk dihapus", {
        description: "Foto akan dihapus setelah Anda klik Update Aset",
      });
    }
  };

  const handleRemoveCapturedPhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.info("Foto dari kamera dihapus");
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.info("File upload dihapus");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Component untuk preview existing photos saat edit
  const ExistingPhotosPreview = () => {
    const existingPhotosList = Object.entries(existingPhotos)
      .filter(([_, url]) => url !== null && url !== undefined)
      .map(([key, url]) => ({ key, url: url as string }));

    if (existingPhotosList.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label>Foto yang Sudah Ada ({existingPhotosList.length})</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {existingPhotosList.map(({ key, url }) => {
            const metadata = photoMetadata[key];
            return (
              <div key={key} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={url}
                    fill
                    alt={`Existing photo ${key}`}
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExistingPhoto(key)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                  </svg>
                </button>

                {/* 🔥 Caption Tanggal & Label */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {key.replace("_", " ").toUpperCase()}
                  </div>
                  {metadata && (
                    <div className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                      📅{" "}
                      {new Date(metadata.timestamp).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500">
          Klik tombol X untuk menghapus foto. Foto yang dihapus akan diganti
          dengan foto baru yang Anda upload/capture.
        </p>
      </div>
    );
  };

  // Component untuk preview captured photos
  const CapturedPhotosPreview = () => {
    if (capturedPhotos.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label>Foto dari Kamera ({capturedPhotos.length})</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {capturedPhotos.map((file, index) => {
            const metadata = photoMetadata[`captured_${index}`];
            return (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-200">
                  <Image
                    src={URL.createObjectURL(file)}
                    fill
                    alt={`Captured photo ${index + 1}`}
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCapturedPhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                  </svg>
                </button>

                {/* 🔥 Caption Label & Tanggal */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <div className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                    BARU #{index + 1}
                  </div>
                  {metadata && (
                    <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                      📸{" "}
                      {new Date(metadata.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Component untuk preview uploaded files
  const UploadedFilesPreview = () => {
    if (uploadedFiles.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label>File yang Diupload ({uploadedFiles.length})</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {uploadedFiles.map((file, index) => {
            const metadata = photoMetadata[`upload_${index}`];
            return (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-200">
                  <Image
                    src={URL.createObjectURL(file)}
                    fill
                    alt={`Uploaded file ${index + 1}`}
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveUploadedFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                  </svg>
                </button>

                {/* 🔥 Caption Label & Tanggal */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                    UPLOAD #{index + 1}
                  </div>
                  {metadata && (
                    <div className="bg-purple-500/80 text-white text-xs px-2 py-1 rounded">
                      📁{" "}
                      {new Date(metadata.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="@container mx-auto p-4 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-semibold">Kelola Aset Perusahaan</p>
          </div>

          <div className="w-full ">
            <div className="grid grid-cols-2 gap-2">
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    resetForm();
                  }
                  setIsDialogOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size={"lg"}
                    variant="default"
                    className="cursor-pointer w-full"
                    disabled={isLoadingData}
                  >
                    Tambah Aset
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="shrink-0">
                    <DialogTitle>
                      {isEditMode
                        ? "Edit Aset Perusahaan"
                        : "Tambah Aset Perusahaan"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode
                        ? `Edit data aset ${editingKodeAset}`
                        : "Lengkapi form berikut untuk menambahkan aset perusahaan baru"}
                    </DialogDescription>
                  </DialogHeader>
                  {isLoadingData ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-6 mt-4">
                      {/* Nama Aset */}
                      <div className="space-y-2">
                        <Label htmlFor="nama_aset">Nama Aset *</Label>
                        <Input
                          id="nama_aset"
                          name="nama_aset"
                          value={formData.nama_aset}
                          onChange={handleInputChange}
                          className="text-sm"
                          placeholder="Masukkan nama aset"
                          required
                        />
                      </div>

                      {/* Nilai Aset & Luas Aset */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* <div className="space-y-2">
                          <Label htmlFor="nilai_aset">Nilai Aset (Rp) *</Label>
                          <Input
                            id="nilai_aset"
                            name="nilai_aset"
                            type="text"
                            value={formData.nilai_aset}
                            onChange={handleInputChange}
                            placeholder="0"
                            required
                          />
                        </div> */}
                        <div className="space-y-2">
                          <Label htmlFor="jenis_aset_id">Jenis Aset *</Label>
                          <Select
                            value={formData.jenis_aset_id}
                            onValueChange={(value) =>
                              handleSelectChange("jenis_aset_id", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih Jenis Aset" />
                            </SelectTrigger>
                            <SelectContent>
                              {jenisAsetList.map((jenis) => (
                                <SelectItem
                                  key={jenis.id}
                                  value={jenis.id.toString()}
                                >
                                  {jenis.jenis_aset}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Conditional: Luas Aset atau Jumlah Aset berdasarkan Jenis */}
                        <div className="space-y-2">
                          {needsLuasAset(formData.jenis_aset_id) ? (
                            <>
                              <Label htmlFor="luas_aset">
                                Luas Aset (m²) (Opsional)
                              </Label>
                              <Input
                                id="luas_aset"
                                name="luas_aset"
                                type="number"
                                value={formData.luas_aset}
                                onChange={handleInputChange}
                                placeholder="0"
                                className="text-sm"
                              />
                            </>
                          ) : (
                            <>
                              <Label htmlFor="jumlah_aset">
                                Jumlah Aset (unit) (Opsional)
                              </Label>
                              <Input
                                id="jumlah_aset"
                                name="jumlah_aset"
                                type="number"
                                value={formData.jumlah_aset}
                                onChange={handleInputChange}
                                placeholder="0"
                                className="text-sm"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Jenis Aset & Divisi */}
                      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-4">
                        {/* Divisi - Disabled saat edit */}
                        <div className="space-y-2">
                          <Label htmlFor="divisi_id">
                            Divisi *
                            {isEditMode && (
                              <span className="text-xs text-orange-600 ml-2">
                                (Tidak dapat diubah, gunakan Mutasi)
                              </span>
                            )}
                          </Label>
                          <Select
                            value={formData.divisi_id}
                            onValueChange={(value) =>
                              handleSelectChange("divisi_id", value)
                            }
                            disabled={isEditMode}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih Divisi" />
                            </SelectTrigger>
                            <SelectContent>
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

                        {/* Cabang (Optional) */}
                        <div className="space-y-2">
                          <Label htmlFor="kode_cabang">Cabang (Opsional)</Label>
                          <Select
                            value={formData.kode_cabang}
                            onValueChange={(value) =>
                              handleSelectChange("kode_cabang", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder="Pilih Cabang"
                                className="text-sm"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {cabangList.map((cabang) => (
                                <SelectItem
                                  key={cabang.kode_cabang}
                                  value={cabang.kode_cabang.toString()}
                                >
                                  {cabang.nama_cabang}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />

                      {/* Tanggal Transaksi & Periode */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tgl_transaksi">
                            Tanggal Transaksi *
                          </Label>
                          <Input
                            id="tgl_transaksi"
                            name="tgl_transaksi"
                            type="date"
                            value={formData.tgl_transaksi}
                            onChange={handleInputChange}
                            required
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="periode">Periode *</Label>
                          <Input
                            id="periode"
                            name="periode"
                            value={formData.periode}
                            onChange={handleInputChange}
                            className="text-sm"
                            placeholder="Contoh: 2024-Q1 atau 2024-11"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="penanggung_jawab">
                          Penanggung Jawab (Opsional)
                          {isEditMode && (
                            <span className="text-xs text-orange-600 ml-2">
                              (Tidak dapat diubah, gunakan Mutasi)
                            </span>
                          )}
                        </Label>
                        <Select
                          value={formData.penanggung_jawab}
                          onValueChange={(value) =>
                            handleSelectChange("penanggung_jawab", value)
                          }
                          disabled={isEditMode}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Penanggung Jawab" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredUsers.length === 0 ? (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                {formData.divisi_id
                                  ? "Tidak ada penanggung jawab tersedia di divisi ini"
                                  : "Pilih divisi terlebih dahulu"}
                              </div>
                            ) : (
                              filteredUsers
                                .filter(
                                  (user) =>
                                    user.kode_pegawai &&
                                    user.kode_pegawai.trim() !== ""
                                )
                                .map((user) => (
                                  <SelectItem
                                    key={user.kode_pegawai}
                                    value={user.kode_pegawai}
                                  >
                                    {user.name} ({user.kode_pegawai})
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                        {isEditMode && (
                          <p className="text-xs text-gray-500">
                            Untuk mengubah penanggung jawab, lakukan mutasi aset
                          </p>
                        )}
                      </div>

                      {/* Data Pegawai (Read-only) */}
                      {currentUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nama_pegawai">
                              Nama Karyawan{" "}
                              <span className="text-xs font-semibold text-blue-500">
                                (Yang melakukan input)
                              </span>
                            </Label>
                            <Input
                              id="nama_pegawai"
                              value={currentUser.name}
                              disabled
                              className="text-sm"
                            />
                          </div>
                          {/* <div className="space-y-2">
                            <Label htmlFor="kode_pegawai">
                              Kode Karyawan{" "}
                              <span className="text-xs font-semibold text-blue-500">
                                (Yang melakukan input)
                              </span>
                            </Label>
                            <Input
                              id="kode_pegawai"
                              value={currentUser.kode_pegawai}
                              disabled
                              className="text-sm"
                            />
                          </div> */}
                        </div>
                      )}

                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            handleSelectChange("status", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Belum Terjual">
                              Belum Terjual
                            </SelectItem>
                            <SelectItem value="Terjual">Terjual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tipe Penjualan */}
                      <div className="space-y-2">
                        <Label htmlFor="tipe_penjualan">Tipe Penjualan *</Label>
                        <Select
                          value={formData.tipe_penjualan}
                          onValueChange={(value) =>
                            handleSelectChange("tipe_penjualan", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Tipe Penjualan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="harus_dijual">
                              Harus Dijual
                            </SelectItem>
                            <SelectItem value="tidak_dijual">
                              Tidak Dijual
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Keterangan */}
                      <div className="space-y-2">
                        <Label htmlFor="keterangan">Keterangan</Label>
                        <Textarea
                          id="keterangan"
                          name="keterangan"
                          value={formData.keterangan}
                          onChange={handleInputChange}
                          placeholder="Masukkan keterangan tambahan"
                          rows={3}
                          className="text-sm"
                        />
                      </div>

                      <Separator />

                      {/* Existing Photos (only in edit mode) */}
                      {isEditMode && <ExistingPhotosPreview />}

                      {isEditMode &&
                        Object.values(existingPhotos).filter((p) => p !== null)
                          .length > 0 && <Separator />}

                      {/* Captured Photos Preview */}
                      <CapturedPhotosPreview />

                      {/* Uploaded Files Preview */}
                      <UploadedFilesPreview />

                      {/* Info total photos */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Total Foto: </span>
                          {Object.values(existingPhotos).filter(
                            (p) => p !== null
                          ).length +
                            capturedPhotos.length +
                            uploadedFiles.length}{" "}
                          / 10
                        </p>
                        {Object.values(existingPhotos).filter((p) => p !== null)
                          .length +
                          capturedPhotos.length +
                          uploadedFiles.length >
                          10 && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Maksimal 10 foto. Hapus beberapa foto untuk
                            melanjutkan.
                          </p>
                        )}
                      </div>

                      {/* Camera Capture Section */}
                      <div className="space-y-2">
                        <Label>
                          {isEditMode
                            ? "Tambah Foto Baru dari Kamera"
                            : "Foto Aset (Maksimal 10 foto) *"}
                        </Label>
                        <div className="border rounded-lg p-4">
                          <CameraCaptureAP
                            onCapture={handlePhotoCapture}
                            maxPhotos={
                              10 -
                              Object.values(existingPhotos).filter(
                                (p) => p !== null
                              ).length
                            }
                          />
                        </div>
                        {isEditMode && (
                          <p className="text-xs text-gray-500">
                            Anda dapat menambah foto baru melalui kamera. Foto
                            lama yang tidak dihapus akan tetap tersimpan.
                          </p>
                        )}
                      </div>

                      {/* <div className="space-y-2">
                        <Label>
                          {isEditMode
                            ? "Atau Upload Foto Baru"
                            : "Upload Foto (Opsional, Maks 10)"}
                        </Label>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileInput}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          {isEditMode
                            ? "Upload file baru untuk menambah atau mengganti foto yang dihapus."
                            : "Jika tidak ingin menggunakan kamera, bisa upload file di sini."}
                        </p>
                      </div> */}

                      <Separator />

                      {/* Location Map Section */}
                      <div className="space-y-2">
                        <Label>Lokasi Aset *</Label>
                        <div className="border rounded-lg p-4">
                          <LocationMapAP
                            onLocationChange={handleLocationChange}
                          />
                        </div>
                      </div>

                      {/* Alamat Field */}
                      <div className="space-y-2">
                        <Label htmlFor="alamat">Alamat Lengkap</Label>
                        <div className="relative">
                          <Textarea
                            id="alamat"
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleInputChange}
                            placeholder="Alamat akan terisi otomatis dari koordinat lokasi"
                            rows={3}
                            className="pr-10 text-sm"
                          />
                          {isConverting && (
                            <div className="absolute right-3 top-3">
                              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Alamat akan diisi otomatis berdasarkan koordinat GPS.
                          Anda dapat mengeditnya jika diperlukan.
                        </p>
                      </div>

                      <Separator />

                      {/* Submit Buttons */}
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isSubmitting}
                          className="cursor-pointer"
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isEditMode ? "Memperbarui..." : "Menyimpan..."}
                            </>
                          ) : isEditMode ? (
                            "Update Aset"
                          ) : (
                            "Simpan Aset"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog
                open={isDialogOpenJenis}
                onOpenChange={setIsDialogOpenJenis}
              >
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={isLoadingData}
                  >
                    Tambah Jenis Aset
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Kelola Jenis Aset</DialogTitle>
                    <DialogDescription>
                      {isEditingJenis
                        ? "Edit jenis aset yang sudah ada"
                        : "Tambahkan jenis aset baru ke dalam sistem"}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Form untuk menambah/edit jenis aset */}
                    <div className="space-y-2">
                      <Label htmlFor="jenis_aset">
                        {isEditingJenis
                          ? "Edit Nama Jenis Aset"
                          : "Nama Jenis Aset Baru"}
                      </Label>
                      <Input
                        id="jenis_aset"
                        value={jenisAsetName}
                        onChange={(e) => setJenisAsetName(e.target.value)}
                        placeholder="Masukkan nama jenis aset..."
                        className="text-sm"
                      />
                    </div>

                    {/* Tombol Simpan Jenis Aset */}
                    <div className="flex justify-end gap-2">
                      {isEditingJenis && (
                        <Button
                          variant="outline"
                          onClick={handleCancelEditJenis}
                          disabled={isSubmittingJenis}
                          className="cursor-pointer"
                        >
                          Batal Edit
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmitJenisAset}
                        disabled={isSubmittingJenis || !jenisAsetName}
                        className="cursor-pointer"
                      >
                        {isSubmittingJenis ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditingJenis
                              ? "Memperbarui..."
                              : "Menambahkan..."}
                          </>
                        ) : isEditingJenis ? (
                          "Update Jenis Aset"
                        ) : (
                          "Simpan Jenis Aset"
                        )}
                      </Button>
                    </div>

                    <Separator />

                    {/* Tabel untuk menampilkan jenis aset */}
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold mb-3">
                        Daftar Jenis Aset
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full table-auto border-collapse">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium border-b">
                                No
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium border-b">
                                Jenis Aset
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium border-b">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {jenisAsetList.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-4 py-8 text-center text-sm"
                                >
                                  Belum ada data jenis aset
                                </td>
                              </tr>
                            ) : (
                              jenisAsetList.map((jenisAset, index) => (
                                <tr
                                  key={jenisAset.id}
                                  className={`${
                                    editingJenisAsetId === jenisAset.id
                                      ? "bg-blue-50"
                                      : ""
                                  }`}
                                >
                                  <td className="px-4 py-3 text-sm">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {jenisAset.jenis_aset}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex justify-start gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleEditJenisAset(
                                            jenisAset.id,
                                            jenisAset.jenis_aset
                                          )
                                        }
                                        className="cursor-pointer"
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          setDeleteJenisData({
                                            id: jenisAset.id,
                                            nama: jenisAset.jenis_aset,
                                          });
                                          setShowDeleteJenisDialog(true);
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Trash className="h-3 w-3 mr-1" />
                                        Hapus
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex gap-2">
          <Select value={filterDivisi} onValueChange={setFilterDivisi}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Pilih Divisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Divisi</SelectItem>
              {divisiList.map((divisi) => (
                <SelectItem
                  key={divisi.kode_divisi}
                  value={divisi.kode_divisi} // Gunakan kode_divisi
                >
                  {divisi.nama_divisi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm bg-white"
          />
        </div>

        {/* Asset List Component */}
        <AssetList
          asetList={asetList}
          isLoading={isLoadingAset}
          formatCurrency={formatCurrency}
          onDelete={onDelete}
          onEdit={handleEdit}
          onMutasi={onMutasi}
        />

        {/* Dialog Mutasi Aset */}
        <Dialog open={isMutasiDialogOpen} onOpenChange={setIsMutasiDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Mutasi Aset</DialogTitle>
              <DialogDescription>
                Lakukan mutasi untuk aset: {selectedAsetForMutasi?.nama_aset}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Info Aset Saat Ini */}
              {selectedAsetForMutasi && (
                <Card>
                  <CardContent className="p-4">
                    <p className="font-semibold mb-2">Data Aset Saat Ini</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Kode Aset:</p>
                        <p className="font-medium">
                          {selectedAsetForMutasi.kode_aset}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Divisi:</p>
                        <p className="font-medium">
                          {selectedAsetForMutasi.nama_divisi}
                        </p>
                      </div>
                      {selectedAsetForMutasi.nama_cabang && (
                        <div>
                          <p className="text-gray-600">Cabang:</p>
                          <p className="font-medium">
                            {selectedAsetForMutasi.nama_cabang}
                          </p>
                        </div>
                      )}
                      {selectedAsetForMutasi.nama_penanggung_jawab && (
                        <div>
                          <p className="text-gray-600">Penanggung Jawab:</p>
                          <p className="font-medium">
                            {selectedAsetForMutasi.nama_penanggung_jawab}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tipe Mutasi */}
              <div className="space-y-2">
                <Label htmlFor="tipe_mutasi">Tipe Mutasi *</Label>
                <Select
                  value={mutasiFormData.tipe_mutasi}
                  onValueChange={(value) =>
                    handleMutasiSelectChange("tipe_mutasi", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tipe Mutasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antar_divisi">Antar Divisi</SelectItem>
                    <SelectItem value="antar_cabang">
                      Antar Cabang (Dalam 1 Divisi)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Divisi Tujuan */}
              <div className="space-y-2">
                <Label htmlFor="divisi_tujuan">Divisi Tujuan *</Label>
                <Select
                  value={mutasiFormData.divisi_tujuan}
                  onValueChange={(value) =>
                    handleMutasiSelectChange("divisi_tujuan", value)
                  }
                  disabled={mutasiFormData.tipe_mutasi === "antar_cabang"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Divisi Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
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
                {mutasiFormData.tipe_mutasi === "antar_cabang" && (
                  <p className="text-xs text-gray-500">
                    Untuk mutasi antar cabang, divisi harus sama dengan divisi
                    asal
                  </p>
                )}
              </div>

              {/* 🔥 CABANG TUJUAN - TAMPILKAN UNTUK SEMUA TIPE */}
              {mutasiFormData.divisi_tujuan && (
                <div className="space-y-2">
                  <Label htmlFor="cabang_tujuan">
                    Cabang Tujuan
                    {mutasiFormData.tipe_mutasi === "antar_cabang"
                      ? " *"
                      : " (Opsional)"}
                  </Label>
                  <Select
                    value={mutasiFormData.cabang_tujuan}
                    onValueChange={(value) =>
                      handleMutasiSelectChange("cabang_tujuan", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Cabang Tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabangList
                        .filter((c) => {
                          // 🔥 PERBAIKI FILTER - gunakan kode_divisi
                          console.log("Filtering cabang:", {
                            cabangDivisiId: c.divisi_id,
                            cabangKodeDivisi: c.kode_divisi,
                            targetDivisi: mutasiFormData.divisi_tujuan,
                          });

                          // Coba match dengan divisi_id atau kode_divisi
                          return (
                            c.kode_divisi === mutasiFormData.divisi_tujuan ||
                            c.divisi_id === mutasiFormData.divisi_tujuan
                          );
                        })
                        .map((cabang) => (
                          <SelectItem
                            key={cabang.kode_cabang}
                            value={cabang.kode_cabang}
                          >
                            {cabang.nama_cabang}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* 🔥 TAMBAHKAN INFO JIKA TIDAK ADA CABANG */}
                  {cabangList.filter(
                    (c) =>
                      c.kode_divisi === mutasiFormData.divisi_tujuan ||
                      c.divisi_id === mutasiFormData.divisi_tujuan
                  ).length === 0 && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Divisi ini tidak memiliki cabang
                    </p>
                  )}

                  {mutasiFormData.tipe_mutasi === "antar_cabang" && (
                    <p className="text-xs text-gray-500">
                      Wajib pilih cabang untuk mutasi antar cabang
                    </p>
                  )}

                  {mutasiFormData.tipe_mutasi === "antar_divisi" && (
                    <p className="text-xs text-gray-500">
                      Opsional - Pilih jika divisi tujuan memiliki cabang
                    </p>
                  )}
                </div>
              )}

              {/* Penanggung Jawab Tujuan */}
              <div className="space-y-2">
                <Label htmlFor="penanggung_jawab_tujuan">
                  Penanggung Jawab Baru (Opsional)
                </Label>
                <Select
                  value={mutasiFormData.penanggung_jawab_tujuan}
                  onValueChange={(value) =>
                    handleMutasiSelectChange("penanggung_jawab_tujuan", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Penanggung Jawab" />
                  </SelectTrigger>
                  <SelectContent>
                    {userList
                      .filter(
                        (user) =>
                          user.divisi_kode === mutasiFormData.divisi_tujuan &&
                          user.kode_pegawai &&
                          user.kode_pegawai.trim() !== ""
                      )
                      .map((user) => (
                        <SelectItem
                          key={user.kode_pegawai}
                          value={user.kode_pegawai}
                        >
                          {user.name} ({user.kode_pegawai})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Alasan Mutasi */}
              <div className="space-y-2">
                <Label htmlFor="alasan_mutasi">Alasan Mutasi</Label>
                <Textarea
                  id="alasan_mutasi"
                  name="alasan_mutasi"
                  value={mutasiFormData.alasan_mutasi}
                  onChange={handleMutasiInputChange}
                  placeholder="Jelaskan alasan dilakukannya mutasi..."
                  rows={3}
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                <Textarea
                  id="keterangan"
                  name="keterangan"
                  value={mutasiFormData.keterangan}
                  onChange={handleMutasiInputChange}
                  placeholder="Keterangan tambahan (opsional)..."
                  rows={3}
                />
              </div>

              <Separator />

              {/* Foto Bukti Mutasi */}
              <div className="space-y-2">
                <Label>Foto Bukti Mutasi (Opsional, Maks 5 foto)</Label>

                {!showCameraForMutasi ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCameraForMutasi(true)}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Foto Bukti Mutasi
                  </Button>
                ) : (
                  <div className="border rounded-lg p-4">
                    <CameraCaptureAP
                      onCapture={handleMutasiPhotoCapture}
                      maxPhotos={5}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCameraForMutasi(false)}
                      className="w-full mt-2"
                    >
                      Tutup Kamera
                    </Button>
                  </div>
                )}

                {capturedMutasiPhotos.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {capturedMutasiPhotos.length} foto sudah diambil
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMutasiDialogOpen(false);
                    resetMutasiForm();
                  }}
                  disabled={isSubmittingMutasi}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitMutasi}
                  disabled={isSubmittingMutasi}
                  className="cursor-pointer"
                >
                  {isSubmittingMutasi ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Simpan Mutasi"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus aset dengan kode{" "}
                <span className="font-semibold text-black">
                  {deleteKodeAset}
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteKodeAset(null);
                }}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Hapus
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showDeleteJenisDialog}
          onOpenChange={setShowDeleteJenisDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus jenis aset{" "}
                <span className="font-semibold text-black">
                  {deleteJenisData.nama}
                </span>
                ? <br />
                <span className="text-red-500 font-medium">
                  Tindakan ini tidak dapat dibatalkan.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteJenisDialog(false)}
              >
                Batal
              </Button>

              <Button
                variant="destructive"
                onClick={confirmDeleteJenisAset}
                className="bg-red-500 hover:bg-red-600"
              >
                Hapus
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
