"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/portal-karyawan-tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import TableCuti from "@/components/portal-karyawan/TableCuti";
import { toast } from "sonner";
import SuccessSubmitDialog from "@/components/portal-karyawan/SuccessSubmitDialog";
import { useSearchParams } from "next/navigation";

interface Role {
  id: number;
  name: string;
}

interface Divisi {
  id: number;
  kode_divisi: string;
  nama_divisi: string;
}

interface Approver {
  id: number;
  approver_id: number;
  approver_name: string;
  approver_role_name: string;
  kode_pegawai: string;
  divisi_kode: string;
  nama_divisi: string;
}

interface JenisCutiIzin {
  id: number;
  kode_jenis: string;
  nama_jenis: string;
  deskripsi: string | null;
  is_active: number;
}

function Page() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisi, setDivisi] = useState<Divisi[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [jenisCutiIzin, setJenisCutiIzin] = useState<JenisCutiIzin[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    id: number;
    status: string;
    pdf_path: string;
    jumlah_hari?: number;
  } | null>(null);
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "formulir");
  const [searchRole, setSearchRole] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    role_id: "",
    divisi_kode: "",
    jenis_izin: "",
    tanggal_izin: undefined as Date | undefined,
    tanggal_cuti_mulai: undefined as Date | undefined,
    tanggal_cuti_selesai: undefined as Date | undefined,
    alasan: "",
    pic_pengganti: "",
    pic_phone: "",
    nomor_telepon_karyawan: "",
    bukti_file_path: "",
    selected_approver_id: "",
  });

  // Popover states
  const [openTanggalIzin, setOpenTanggalIzin] = useState(false);
  const [openTanggalCutiMulai, setOpenTanggalCutiMulai] = useState(false);
  const [openTanggalCutiSelesai, setOpenTanggalCutiSelesai] = useState(false);

  const [datePengajuan] = useState<Date>(new Date());

  useEffect(() => {
    fetchRoles();
    fetchDivisi();
    fetchJenisCutiIzin();

    // Pre-fill user data from session
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        nama_lengkap: session.user.name || "",
        role_id: session.user.roleId?.toString() || "",
        divisi_kode: session.user.divisi_kode || "",
      }));
    }
  }, [session]);

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchRole.toLowerCase())
  );

  const fetchJenisCutiIzin = async () => {
    try {
      const response = await fetch("/api/jenis-cuti-izin?active_only=true");
      const result = await response.json();
      if (result.success) {
        setJenisCutiIzin(result.data);
      }
    } catch (error) {
      console.error("Error fetching jenis cuti izin:", error);
      toast.error("Gagal memuat jenis cuti/izin");
    }
  };

  // Fetch approvers when divisi and role selected
  useEffect(() => {
    if (formData.divisi_kode && formData.role_id) {
      const currentRole = roles.find(
        (r) => r.id === parseInt(formData.role_id)
      );
      const roleName = currentRole?.name.toUpperCase() || "";

      // Jika Direktur, tidak perlu fetch approvers
      if (roleName.includes("DIREKTUR") || roleName.includes("DIRECTOR")) {
        setApprovers([]); // Kosongkan approvers
        return; // Skip fetch
      }

      fetchApprovers(formData.divisi_kode, parseInt(formData.role_id));
    }
  }, [formData.divisi_kode, formData.role_id]);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  const fetchDivisi = async () => {
    try {
      const response = await fetch("/api/divisi");
      const result = await response.json();
      if (result.success) {
        setDivisi(result.data);
      }
    } catch (error) {
      console.error("Error fetching divisi:", error);
    }
  };

  const fetchApprovers = async (divisiKode: string, roleId: number) => {
    try {
      const response = await fetch(
        `/api/approvers/divisi?divisi_kode=${divisiKode}&role_id=${roleId}`
      );
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setApprovers(result.data);
      } else {
        setApprovers([]);
        toast.warning(
          `Belum ada approver untuk divisi ini. Silakan hubungi admin untuk menambahkan approver.`
        );
      }
    } catch (error) {
      console.error("Error fetching approvers:", error);
      setApprovers([]);
      toast.error("Gagal memuat data approver");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi file
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/bukti-cuti", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        handleInputChange("bukti_file_path", result.filepath);
        toast.success("File berhasil diupload");
      } else {
        toast.error(result.error || "Gagal upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Terjadi kesalahan saat upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const formatDateForSubmit = (date: Date | undefined): string | null => {
    if (!date) return null;

    // Get local date components (respects user's timezone)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi basic fields
    if (
      !formData.nama_lengkap ||
      !formData.role_id ||
      !formData.divisi_kode ||
      !formData.jenis_izin ||
      !formData.alasan ||
      !formData.nomor_telepon_karyawan
    ) {
      toast.error("Semua field wajib harus diisi");
      return;
    }

    // ✅ CEK APAKAH USER ADALAH DIREKTUR
    const currentRole = roles.find((r) => r.id === parseInt(formData.role_id));
    const roleName = currentRole?.name.toUpperCase() || "";
    const isDirektur =
      roleName.includes("DIREKTUR") || roleName.includes("DIRECTOR");

    // ✅ Validasi approver - SKIP untuk Direktur
    if (!isDirektur && !formData.selected_approver_id) {
      toast.error("Pemeriksa izin harus dipilih");
      return;
    }

    if (formData.jenis_izin === "cuti") {
      if (!formData.tanggal_cuti_mulai || !formData.tanggal_cuti_selesai) {
        toast.error("Tanggal cuti harus diisi untuk jenis cuti");
        return;
      }
      if (!formData.pic_pengganti) {
        toast.error("PIC Pengganti harus diisi untuk jenis cuti");
        return;
      }
    } else {
      if (!formData.tanggal_izin) {
        toast.error("Tanggal izin harus diisi");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        role_id: parseInt(formData.role_id),
        // ✅ Untuk Direktur, approver_id bisa null (akan di-handle backend)
        approver_id: isDirektur
          ? null
          : parseInt(formData.selected_approver_id),
        tanggal_izin: formatDateForSubmit(formData.tanggal_izin),
        tanggal_cuti_mulai: formatDateForSubmit(formData.tanggal_cuti_mulai),
        tanggal_cuti_selesai: formatDateForSubmit(
          formData.tanggal_cuti_selesai
        ),
      };

      console.log("📅 Submitting dates:", {
        tanggal_izin: payload.tanggal_izin,
        tanggal_cuti_mulai: payload.tanggal_cuti_mulai,
        tanggal_cuti_selesai: payload.tanggal_cuti_selesai,
        isDirektur: isDirektur,
        approver_id: payload.approver_id,
      });

      const response = await fetch("/api/cuti-izin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        handleReset();

        // Set data untuk dialog
        setSubmitResult(result.data);
        setShowSuccessDialog(true);

        // ✅ Toast message berbeda untuk Direktur
        if (isDirektur) {
          toast.success("Permohonan berhasil dikirim ke HRD!", {
            description:
              "Sebagai Direktur, permohonan Anda langsung diproses HRD.",
          });
        } else {
          toast.success("Permohonan berhasil dikirim!");
        }

        // Refresh table
        setRefreshTable((prev) => prev + 1);
      } else {
        toast.error(result.error || "Gagal mengajukan permohonan");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Terjadi kesalahan saat mengajukan permohonan");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRiwayat = () => {
    setShowSuccessDialog(false);
    setActiveTab("riwayat");
  };

  const handleReset = () => {
    setFormData({
      nama_lengkap: session?.user?.name || "",
      role_id: session?.user?.roleId?.toString() || "",
      divisi_kode: session?.user?.divisi_kode || "",
      jenis_izin: "",
      tanggal_izin: undefined,
      tanggal_cuti_mulai: undefined,
      tanggal_cuti_selesai: undefined,
      alasan: "",
      pic_pengganti: "",
      pic_phone: "",
      nomor_telepon_karyawan: "",
      bukti_file_path: "",
      selected_approver_id: "",
    });
  };

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Permohonan Izin & Cuti</h1>
        <p className="text-gray-500 mt-2">
          Lengkapi formulir dan ajukan permohonan izin dan cuti
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="formulir">Formulir Izin & Cuti</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat Izin & Cuti</TabsTrigger>
        </TabsList>

        <TabsContent value="formulir">
          <Card className="shadow-none">
            <CardContent>
              <div className="mb-8">
                <p className="text-xl font-medium">
                  Formulir Permohonan Izin & Cuti
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Baris 1: Nama & Jabatan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="nama">Nama Lengkap</Label>
                      <Input
                        id="nama"
                        type="text"
                        className="text-sm bg-gray-50"
                        placeholder="Masukkan nama lengkap..."
                        value={formData.nama_lengkap}
                        onChange={(e) =>
                          handleInputChange("nama_lengkap", e.target.value)
                        }
                        required
                        readOnly
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="jabatan">Posisi/Jabatan</Label>
                      <Input
                        id="jabatan"
                        type="text"
                        className="text-sm bg-gray-50"
                        value={
                          roles.find((r) => r.id === parseInt(formData.role_id))
                            ?.name || "" // ✅ Menampilkan NAMA jabatan, bukan ID
                        }
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Baris 2: Divisi & Jenis Izin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="divisi">Divisi</Label>
                      <Input
                        id="divisi"
                        type="text"
                        className="text-sm bg-gray-50"
                        value={
                          divisi.find(
                            (d) => d.kode_divisi === formData.divisi_kode
                          )?.nama_divisi || "" // ✅ Menampilkan NAMA divisi, bukan kode
                        }
                        readOnly
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="jenis">Jenis Izin</Label>
                      <Select
                        value={formData.jenis_izin}
                        onValueChange={(value) =>
                          handleInputChange("jenis_izin", value)
                        }
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih jenis izin..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Jenis Izin</SelectLabel>
                            {jenisCutiIzin.length > 0 ? (
                              jenisCutiIzin.map((jenis) => (
                                <SelectItem
                                  key={jenis.id}
                                  value={jenis.kode_jenis}
                                >
                                  {jenis.nama_jenis}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="loading" disabled>
                                Memuat data...
                              </SelectItem>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {jenisCutiIzin.length === 0 && (
                        <p className="text-xs text-amber-600">
                          ⚠️ Belum ada jenis cuti/izin yang tersedia. Hubungi
                          admin.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Baris 3: Tanggal Izin & Tanggal Pengajuan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="tanggal">
                        Tanggal Izin
                        {formData.jenis_izin === "cuti" && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Tidak diperlukan untuk cuti)
                          </span>
                        )}
                      </Label>
                      <Popover
                        open={openTanggalIzin}
                        onOpenChange={setOpenTanggalIzin}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                            disabled={formData.jenis_izin === "cuti"}
                          >
                            <span className="text-gray-500">
                              {formData.tanggal_izin
                                ? formData.tanggal_izin.toLocaleDateString(
                                    "id-ID"
                                  )
                                : "Tentukan tanggal izin..."}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.tanggal_izin}
                            captionLayout="dropdown"
                            onSelect={(d) => {
                              handleInputChange("tanggal_izin", d);
                              setOpenTanggalIzin(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label>Tanggal Pengajuan</Label>
                      <Input
                        type="text"
                        className="text-sm"
                        value={datePengajuan.toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Baris 4: Tanggal Cuti Mulai & Selesai */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <Label>
                        Tanggal Cuti Mulai
                        {formData.jenis_izin !== "cuti" && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Hanya untuk cuti)
                          </span>
                        )}
                      </Label>
                      <Popover
                        open={openTanggalCutiMulai}
                        onOpenChange={setOpenTanggalCutiMulai}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                            disabled={formData.jenis_izin !== "cuti"}
                          >
                            <span className="text-gray-500 text-sm">
                              {formData.tanggal_cuti_mulai
                                ? formData.tanggal_cuti_mulai.toLocaleDateString(
                                    "id-ID"
                                  )
                                : "Tanggal mulai..."}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.tanggal_cuti_mulai}
                            captionLayout="dropdown"
                            onSelect={(d) => {
                              handleInputChange("tanggal_cuti_mulai", d);
                              setOpenTanggalCutiMulai(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label>
                        Tanggal Cuti Selesai
                        {formData.jenis_izin !== "cuti" && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Hanya untuk cuti)
                          </span>
                        )}
                      </Label>
                      <Popover
                        open={openTanggalCutiSelesai}
                        onOpenChange={setOpenTanggalCutiSelesai}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                            disabled={formData.jenis_izin !== "cuti"}
                          >
                            <span className="text-gray-500 text-sm">
                              {formData.tanggal_cuti_selesai
                                ? formData.tanggal_cuti_selesai.toLocaleDateString(
                                    "id-ID"
                                  )
                                : "Tanggal selesai..."}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.tanggal_cuti_selesai}
                            captionLayout="dropdown"
                            onSelect={(d) => {
                              handleInputChange("tanggal_cuti_selesai", d);
                              setOpenTanggalCutiSelesai(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Baris 5: PIC Pengganti & Nomor PIC */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <Label>
                        PIC Pengganti
                        {formData.jenis_izin !== "cuti" && (
                          <span className="text-xs text-gray-500 ml-1">
                            (Hanya untuk cuti)
                          </span>
                        )}
                      </Label>
                      <Input
                        className="text-sm"
                        placeholder="Masukkan nama PIC yang menggantikan..."
                        value={formData.pic_pengganti}
                        onChange={(e) =>
                          handleInputChange("pic_pengganti", e.target.value)
                        }
                        disabled={formData.jenis_izin !== "cuti"}
                        required={formData.jenis_izin === "cuti"}
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label>
                        Nomor Telepon PIC
                        {formData.jenis_izin !== "cuti" && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Hanya untuk cuti)
                          </span>
                        )}
                      </Label>
                      <Input
                        className="text-sm"
                        placeholder="Masukkan nomor telepon PIC..."
                        value={formData.pic_phone}
                        onChange={(e) =>
                          handleInputChange("pic_phone", e.target.value)
                        }
                        disabled={formData.jenis_izin !== "cuti"}
                      />
                    </div>
                  </div>

                  {/* Baris 6: Nomor Telepon Karyawan & Upload File */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-2">
                      <Label>Nomor Yang Dapat Dihubungi</Label>
                      <Input
                        className="text-sm"
                        placeholder="Masukkan nomor telepon Anda..."
                        value={formData.nomor_telepon_karyawan}
                        onChange={(e) =>
                          handleInputChange(
                            "nomor_telepon_karyawan",
                            e.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label>Upload Bukti Izin/Cuti</Label>
                      <Input
                        className="text-sm"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                      />
                      {uploadingFile && (
                        <p className="text-xs text-blue-600">Uploading...</p>
                      )}
                      {formData.bukti_file_path && (
                        <p className="text-xs text-green-600">
                          ✓ File terupload
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Format: JPG, PNG, PDF (Max 5MB)
                      </p>
                    </div>
                  </div>

                  {/* Info Pemeriksa - Hanya tampil jika BUKAN Direktur */}
                  {formData.divisi_kode &&
                    formData.role_id &&
                    (() => {
                      const currentRole = roles.find(
                        (r) => r.id === parseInt(formData.role_id)
                      );
                      const roleName = currentRole?.name.toUpperCase() || "";
                      const isDirektur =
                        roleName.includes("DIREKTUR") ||
                        roleName.includes("DIRECTOR");

                      // ⭐ JIKA DIREKTUR: Tampilkan info bahwa akan langsung ke HRD
                      if (isDirektur) {
                        return (
                          <div className="flex flex-col space-y-2">
                            <Label className="font-medium">
                              Pemeriksa Izin
                            </Label>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircle className="h-5 w-5" />
                                <div>
                                  <p className="font-semibold">
                                    Persetujuan Langsung ke HRD
                                  </p>
                                  <p className="text-sm text-blue-600 mt-1">
                                    Sebagai Direktur, permohonan Anda akan
                                    langsung diproses oleh HRD tanpa melalui
                                    Manager.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // ⭐ JIKA BUKAN DIREKTUR: Tampilkan dropdown seperti biasa
                      return (
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="pemeriksa" className="font-medium">
                            Pemeriksa Izin
                            <p className="text-xs text-blue-600 text-justify">
                              (Pemeriksa ditentukan berdasarkan divisi dan
                              jabatan)
                            </p>
                          </Label>

                          {approvers.length > 0 ? (
                            <>
                              <Select
                                value={formData.selected_approver_id}
                                onValueChange={(value) =>
                                  handleInputChange(
                                    "selected_approver_id",
                                    value
                                  )
                                }
                                required
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih pemeriksa izin..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>
                                      Pemeriksa yang Tersedia
                                    </SelectLabel>
                                    {approvers.map((approver) => (
                                      <SelectItem
                                        key={approver.id}
                                        value={approver.approver_id.toString()}
                                      >
                                        {approver.approver_name} -{" "}
                                        {approver.approver_role_name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-700">
                                ⚠️ Belum ada pemeriksa yang tersedia untuk
                                divisi Anda.
                                <br />
                                Silakan hubungi admin untuk menambahkan
                                approver.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* Alasan Izin - Full Width */}
                  <div className="flex flex-col space-y-2">
                    <Label>Alasan Izin</Label>
                    <Textarea
                      className="text-sm"
                      rows={4}
                      placeholder="Tuliskan alasan izin..."
                      value={formData.alasan}
                      onChange={(e) =>
                        handleInputChange("alasan", e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Buttons - Full Width */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto"
                      disabled={loading || uploadingFile}
                    >
                      {loading ? "Mengirim..." : "Submit"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat">
          <Card className="shadow-none">
            <CardContent>
              <TableCuti key={refreshTable} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <SuccessSubmitDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        data={submitResult}
        onViewRiwayat={handleViewRiwayat}
      />
    </div>
  );
}

export default Page;
