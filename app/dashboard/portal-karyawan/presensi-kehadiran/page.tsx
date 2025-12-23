"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import LocationMap from "@/components/portal-karyawan/LocationMap";
import CameraCapture from "@/components/portal-karyawan/CameraCapture";
import TableKehadiran from "@/components/portal-karyawan/TableKehadiran";

interface Attendance {
  id: number;
  jam_masuk: string | null;
  jam_pulang: string | null;
  durasi: number | null;
}

export default function PortalPegawaiPage() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0);

  const [alreadyClockInDialog, setAlreadyClockInDialog] = useState(false);
  const [alreadyClockOutDialog, setAlreadyClockOutDialog] = useState(false);
  const [successClockInDialog, setSuccessClockInDialog] = useState(false);
  const [successClockOutDialog, setSuccessClockOutDialog] = useState(false);
  const [durasiFormatted, setDurasiFormatted] = useState("");

  // State presensi masuk
  const [subjekMasuk, setSubjekMasuk] = useState("");
  const [keteranganMasuk, setKeteranganMasuk] = useState("");
  const [photosMasuk, setPhotosMasuk] = useState<File[]>([]);
  const [locationMasuk, setLocationMasuk] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // State presensi pulang
  const [subjekPulang, setSubjekPulang] = useState("");
  const [keteranganPulang, setKeteranganPulang] = useState("");
  const [photosPulang, setPhotosPulang] = useState<File[]>([]);
  const [locationPulang, setLocationPulang] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Validation errors
  const [subjekError, setSubjekError] = useState("");
  const [photosError, setPhotosError] = useState("");

  // Alerts
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Fungsi tanggal hari ini
  const getTodayDate = () => {
    const jakartaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    });
    const date = new Date(jakartaTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = getTodayDate();

      // Langsung fetch tanpa cek localStorage
      const response = await fetch(`/api/attendance/today?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      const data = await response.json();

      setAttendance(data.attendance || null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (alertState.show) {
      const timer = setTimeout(
        () => setAlertState({ ...alertState, show: false }),
        5000
      );
      return () => clearTimeout(timer);
    }
  }, [alertState.show]);

  const getClockInCardColor = () => {
    if (!attendance?.jam_masuk) return "bg-gray-200";
    const [h, m] = attendance.jam_masuk.split(":").map(Number);
    return h * 60 + m <= 7 * 60 + 50 ? "bg-[#10b981]" : "bg-[#f43f5e]";
  };

  const getClockOutCardColor = () => {
    if (!attendance?.jam_pulang) return "bg-gray-200";
    const [h, m] = attendance.jam_pulang.split(":").map(Number);
    return h * 60 + m >= 16 * 60 + 30 ? "bg-[#10b981]" : "bg-[#f43f5e]";
  };

  const getClockInStatus = () => {
    if (!attendance?.jam_masuk) return "";
    const [h, m] = attendance.jam_masuk.split(":").map(Number);
    const late = h * 60 + m - 470;
    return late <= 0
      ? "Tepat Waktu"
      : late >= 60
      ? `Terlambat ${Math.floor(late / 60)} jam ${late % 60} menit`
      : `Terlambat ${late} menit`;
  };

  const getClockOutStatus = () => {
    if (!attendance?.jam_pulang) return "";
    const [h, m] = attendance.jam_pulang.split(":").map(Number);
    const early = 990 - (h * 60 + m);
    return early <= 0
      ? "Sesuai Jadwal"
      : early >= 60
      ? `Pulang Cepat ${Math.floor(early / 60)} jam ${early % 60} menit`
      : `Pulang Cepat ${early} menit`;
  };

  const handleClockIn = async () => {
    if (!subjekMasuk.trim()) {
      setSubjekError("Subjek harus diisi");
      return;
    }
    if (photosMasuk.length === 0) {
      setPhotosError("Ambil minimal 1 foto");
      return;
    }
    if (!locationMasuk || locationMasuk.lat === 0 || locationMasuk.lng === 0) {
      setAlertState({
        show: true,
        type: "error",
        message:
          "Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subjek_masuk", subjekMasuk);
      formData.append("keterangan_masuk", keteranganMasuk);
      formData.append("latitude", locationMasuk.lat.toString());
      formData.append("longitude", locationMasuk.lng.toString());
      photosMasuk.forEach((photo, i) =>
        formData.append(`foto_${i + 1}`, photo)
      );

      const response = await fetch("/api/attendance/clock-in", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        // Update state langsung dari response
        setAttendance({
          id: 0,
          jam_masuk: data.jamMasuk,
          jam_pulang: null,
          durasi: null,
        });

        setIsDialogOpen(false);
        setSuccessClockInDialog(true);

        // Delay sebelum fetch ulang
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Fetch ulang untuk data lengkap dari database
        await fetchTodayAttendance();

        setRefreshTable((prev) => prev + 1);
        setSubjekMasuk("");
        setKeteranganMasuk("");
        setPhotosMasuk([]);
        setLocationMasuk(null);
      } else {
        if (data.error === "Anda sudah melakukan presensi masuk hari ini") {
          setIsDialogOpen(false);
          setAlreadyClockInDialog(true);
          return;
        }

        setAlertState({
          show: true,
          type: "error",
          message: data.error || "Terjadi kesalahan saat presensi masuk",
        });
      }
    } catch (err) {
      setAlertState({
        show: true,
        type: "error",
        message: "Terjadi kesalahan koneksi. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!subjekPulang.trim()) {
      setSubjekError("Subjek harus diisi");
      return;
    }
    if (photosPulang.length === 0) {
      setPhotosError("Ambil minimal 1 foto");
      return;
    }
    if (
      !locationPulang ||
      locationPulang.lat === 0 ||
      locationPulang.lng === 0
    ) {
      setAlertState({
        show: true,
        type: "error",
        message:
          "Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("subjek_pulang", subjekPulang);
      formData.append("keterangan_pulang", keteranganPulang);
      formData.append("latitude", locationPulang.lat.toString());
      formData.append("longitude", locationPulang.lng.toString());
      photosPulang.forEach((photo, i) =>
        formData.append(`foto_${i + 1}`, photo)
      );

      const response = await fetch("/api/attendance/clock-out", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        if (attendance) {
          setAttendance({
            ...attendance,
            jam_pulang: data.jamPulang,
            durasi: data.durasi,
          });
        }

        setDurasiFormatted(data.durasiFormatted);
        setIsDialogOpen(false);
        setSuccessClockOutDialog(true);

        await new Promise((resolve) => setTimeout(resolve, 800));

        await fetchTodayAttendance();

        setRefreshTable((prev) => prev + 1);
        setSubjekPulang("");
        setKeteranganPulang("");
        setPhotosPulang([]);
        setLocationPulang(null);
      } else {
        if (data.error === "Anda sudah melakukan presensi pulang hari ini") {
          setIsDialogOpen(false);
          setAlreadyClockOutDialog(true);
          return;
        }

        setAlertState({
          show: true,
          type: "error",
          message: data.error || "Terjadi kesalahan saat presensi pulang",
        });
      }
    } catch (err) {
      setAlertState({
        show: true,
        type: "error",
        message: "Terjadi kesalahan koneksi. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubjekMasuk("");
    setKeteranganMasuk("");
    setPhotosMasuk([]);
    setLocationMasuk(null);
    setSubjekPulang("");
    setKeteranganPulang("");
    setPhotosPulang([]);
    setLocationPulang(null);
    setSubjekError("");
    setPhotosError("");
  };

  const isClockIn = !attendance?.jam_masuk;
  const buttonText = isClockIn ? "Presensi Masuk" : "Presensi Pulang";
  const dialogTitle = isClockIn ? "Presensi Masuk" : "Presensi Pulang";
  const dialogDescription = isClockIn
    ? "Lakukan pencatatan waktu masuk kerja di halaman ini."
    : "Lakukan pencatatan waktu pulang kerja di halaman ini.";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="@container mx-auto p-4 px-4">
      {alertState.show && (
        <div className="fixed top-4 right-4 z-9999 w-96 animate-in slide-in-from-top-2">
          <Alert
            variant={alertState.type === "success" ? "default" : "destructive"}
            className={
              alertState.type === "success"
                ? "border-green-500 bg-green-50"
                : ""
            }
          >
            {alertState.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription
              className={alertState.type === "success" ? "text-green-800" : ""}
            >
              {alertState.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold">Presensi Kehadiran</h1>
        <p className="text-gray-500 mt-2">
          Pencatatan presensi dan riwayat kehadiran karyawan
        </p>
      </header>

      <div className="w-full dark:bg-transparent bg-white rounded-lg flex flex-col gap-4">
        <section className="grid gap-6 border p-4 rounded-xl">
          <div className="p-4 rounded-lg border text-center space-y-4">
            <p className="font-semibold text-lg">
              Jadwal Kehadiran Anda Hari Ini
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`${getClockInCardColor()} shadow rounded-lg p-4 transition-colors duration-300`}
              >
                <p
                  className={`text-sm cursor-pointer mb-1 ${
                    attendance?.jam_masuk ? "text-white" : "text-gray-600"
                  }`}
                >
                  Presensi Masuk
                </p>
                <p
                  className={`text-xl font-bold ${
                    attendance?.jam_masuk ? "text-white" : "text-gray-600"
                  }`}
                >
                  {attendance?.jam_masuk
                    ? attendance.jam_masuk.substring(0, 5)
                    : "__.__"}
                </p>
                {attendance?.jam_masuk && (
                  <p className="text-xs text-white mt-1 font-medium">
                    {getClockInStatus()}
                  </p>
                )}
              </div>
              <div
                className={`${getClockOutCardColor()} shadow rounded-lg p-4 transition-colors duration-300`}
              >
                <p
                  className={`text-sm mb-1 ${
                    attendance?.jam_pulang ? "text-white" : "text-gray-600"
                  }`}
                >
                  Presensi Pulang
                </p>
                <p
                  className={`text-xl font-bold ${
                    attendance?.jam_pulang ? "text-white" : "text-gray-600"
                  }`}
                >
                  {attendance?.jam_pulang
                    ? attendance.jam_pulang.substring(0, 5)
                    : "__.__"}
                </p>
                {attendance?.jam_pulang && (
                  <p className="text-xs text-white mt-1 font-medium">
                    {getClockOutStatus()}
                  </p>
                )}
              </div>
            </div>

            {attendance?.durasi != null && (
              <div className="bg-blue-500 shadow rounded-lg p-4">
                <p className="text-sm text-white mb-1">Total Durasi Kerja</p>
                <p className="text-xl text-white font-bold">
                  {Math.floor(attendance.durasi / 60)} jam{" "}
                  {attendance.durasi % 60} menit
                </p>
              </div>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full cursor-pointer">{buttonText}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDescription}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subjek">
                    {isClockIn ? "Subjek Masuk" : "Subjek Pulang"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subjek"
                    value={isClockIn ? subjekMasuk : subjekPulang}
                    onChange={(e) => {
                      if (isClockIn) setSubjekMasuk(e.target.value);
                      else setSubjekPulang(e.target.value);
                      if (e.target.value.trim()) setSubjekError("");
                    }}
                    placeholder={
                      isClockIn
                        ? "Contoh: Masuk Kantor"
                        : "Contoh: Selesai Kantor"
                    }
                    className={subjekError ? "border-red-500" : ""}
                  />
                  {subjekError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {subjekError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan">
                    {isClockIn ? "Keterangan Masuk" : "Keterangan Pulang"}
                  </Label>
                  <Textarea
                    id="keterangan"
                    value={isClockIn ? keteranganMasuk : keteranganPulang}
                    onChange={(e) => {
                      if (isClockIn) setKeteranganMasuk(e.target.value);
                      else setKeteranganPulang(e.target.value);
                    }}
                    placeholder={
                      isClockIn
                        ? "Tambahkan keterangan masuk (opsional)"
                        : "Tambahkan keterangan pulang (opsional)"
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Foto <span className="text-red-500">*</span> (Maksimal 3
                    kali)
                  </Label>
                  {photosError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{photosError}</AlertDescription>
                    </Alert>
                  )}
                  <CameraCapture
                    onCapture={(files) => {
                      if (isClockIn) setPhotosMasuk(files);
                      else setPhotosPulang(files);
                      if (files.length > 0) setPhotosError("");
                    }}
                    maxPhotos={3}
                  />
                </div>

                <div className="space-y-2">
                  <LocationMap
                    onLocationChange={(lat, lng) => {
                      if (isClockIn) setLocationMasuk({ lat, lng });
                      else setLocationPulang({ lat, lng });
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  onClick={isClockIn ? handleClockIn : handleClockOut}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {isClockIn ? "Presensi Masuk" : "Presensi Pulang"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Success Presensi Masuk */}
          <Dialog
            open={successClockInDialog}
            onOpenChange={setSuccessClockInDialog}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex justify-center items-center gap-2">
                  <DialogTitle>
                    Presensi Masuk Berhasil!
                  </DialogTitle>
                </div>
                <DialogDescription>
                  Presensi masuk Anda telah berhasil dicatat dalam sistem.
                  <br />
                  Selamat bekerja dan semangat!
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                variant={"default"}
                  onClick={() => setSuccessClockInDialog(false)}
                  className="w-full cursor-pointer"
                >
                  Mengerti
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Success Presensi Pulang */}
          <Dialog
            open={successClockOutDialog}
            onOpenChange={setSuccessClockOutDialog}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex justify-center items-center gap-2">
                  <DialogTitle>
                    Presensi Pulang Berhasil!
                  </DialogTitle>
                </div>
                <DialogDescription>
                  Presensi pulang Anda telah berhasil dicatat.
                  <br />
                  Durasi kerja hari ini: <strong>{durasiFormatted}</strong>
                  <br />
                  Terima kasih atas kerja keras Anda!
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                variant={"default"}
                  onClick={() => setSuccessClockOutDialog(false)}
                  className="w-full cursor-pointer"
                >
                  Mengerti
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Already Clock In */}
          <Dialog
            open={alreadyClockInDialog}
            onOpenChange={setAlreadyClockInDialog}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  Presensi Sudah Dilakukan
                </DialogTitle>
                <DialogDescription>
                  Anda sudah melakukan presensi masuk hari ini.
                  <br />
                  Silakan lakukan presensi pulang sesuai jadwal kerja.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  onClick={() => setAlreadyClockInDialog(false)}
                  className="cursor-pointer"
                >
                  Mengerti
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Already Clock Out */}
          <Dialog
            open={alreadyClockOutDialog}
            onOpenChange={setAlreadyClockOutDialog}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  Presensi Pulang Sudah Dilakukan
                </DialogTitle>
                <DialogDescription>
                  Anda sudah melakukan presensi pulang hari ini.
                  <br />
                  Terima kasih telah mencatat presensi dengan benar.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant={"destructive"}
                  onClick={() => setAlreadyClockOutDialog(false)}
                  className="cursor-pointer"
                >
                  Mengerti
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <Card className="shadow-none">
          <CardContent>
            <TableKehadiran refreshTrigger={refreshTable} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
