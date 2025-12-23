// File: app/dashboard/portal-karyawan/page.tsx (Updated with Kuota Alert)
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Clock3,
  XOctagon,
  AlertTriangle,
  Info,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: number;
  name: string;
  kode_pegawai: string;
  tanggal_lahir: string | null;
  password: string;
  foto_profil: string | null;
  role_name: string;
  divisi_name: string | null;
}

interface WeeklyAttendance {
  date: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  durasi: number | null;
  status: "Belum Absen" | "Absen Masuk" | "Absen Lengkap";
}

interface TodayStatus {
  hasClockIn: boolean;
  hasClockOut: boolean;
  status: "Belum Absen" | "Sudah Absen Masuk" | "Sudah Absen Lengkap";
}

interface KuotaCuti {
  id: number;
  user_id: number;
  tahun: number;
  kuota_total: number;
  kuota_terpakai: number;
  kuota_pending: number;
  kuota_sisa: number;
}

interface CutiProgress {
  id: number;
  jenis_izin: string;
  jenis_izin_nama: string;
  status: string;
  progress_percentage: number;
  tanggal_pengajuan: string;
  current_approver_name: string | null;
}

interface DashboardData {
  profile: UserProfile;
  todayStatus: TodayStatus;
  weeklyAttendance: WeeklyAttendance[];
  kuotaCuti: KuotaCuti | null;
  cutiProgress: CutiProgress[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal memuat data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} jam ${mins} menit`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "waiting_manager":
      case "waiting_hrd":
        return <Clock3 className="w-4 h-4 text-amber-600" />;
      case "rejected_manager":
      case "rejected_hrd":
        return <XOctagon className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Pending",
      waiting_manager: "Menunggu Manager",
      waiting_hrd: "Menunggu HRD",
      approved: "Disetujui",
      rejected_manager: "Ditolak Manager",
      rejected_hrd: "Ditolak HRD",
    };
    return statusMap[status] || status;
  };

  // Function to get kuota alert level
  const getKuotaAlertLevel = (kuotaCuti: KuotaCuti | null) => {
    if (!kuotaCuti) return null;

    const sisaPercentage = (kuotaCuti.kuota_sisa / kuotaCuti.kuota_total) * 100;

    if (kuotaCuti.kuota_sisa === 0) {
      return {
        level: "critical",
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        iconColor: "text-red-600",
        icon: AlertTriangle,
        message: "Kuota cuti Anda sudah habis!",
        description: "Anda tidak dapat mengajukan cuti baru hingga tahun depan atau ada penyesuaian kuota dari HRD."
      };
    }

    if (kuotaCuti.kuota_sisa <= 2) {
      return {
        level: "danger",
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        iconColor: "text-red-600",
        icon: AlertTriangle,
        message: `Perhatian! Kuota cuti Anda hampir habis (${kuotaCuti.kuota_sisa} hari tersisa)`,
        description: "Gunakan dengan bijak untuk keperluan mendesak."
      };
    }

    if (kuotaCuti.kuota_sisa <= 5 || sisaPercentage <= 40) {
      return {
        level: "warning",
        color: "amber",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-800",
        iconColor: "text-amber-600",
        icon: AlertCircle,
        message: `Kuota cuti Anda mulai menipis (${kuotaCuti.kuota_sisa} hari tersisa)`,
        description: "Pertimbangkan untuk menggunakan kuota dengan lebih hati-hati."
      };
    }

    if (sisaPercentage <= 60) {
      return {
        level: "info",
        color: "blue",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-700",
        iconColor: "text-blue-600",
        icon: Info,
        message: `Anda memiliki ${kuotaCuti.kuota_sisa} hari cuti tersisa`,
        description: "Rencanakan penggunaan cuti Anda dengan baik."
      };
    }

    return null; // No alert needed for healthy quota
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error || "Gagal memuat data dashboard"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { profile, todayStatus, weeklyAttendance, kuotaCuti, cutiProgress } =
    data;

  // Calculate percentage for kuota cuti
  const kuotaPercentage = kuotaCuti
    ? Math.round(
        ((kuotaCuti.kuota_terpakai + kuotaCuti.kuota_pending) /
          kuotaCuti.kuota_total) *
          100
      )
    : 0;

  // Get alert info
  const kuotaAlert = getKuotaAlertLevel(kuotaCuti);

  // Function to get kuota card styling based on alert level
  const getKuotaCardStyle = () => {
    if (!kuotaAlert) return "";
    
    switch (kuotaAlert.level) {
      case "critical":
      case "danger":
        return "border-red-300 bg-red-50/50";
      case "warning":
        return "border-amber-300 bg-amber-50/50";
      case "info":
        return "border-blue-300 bg-blue-50/50";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto p-4 space-y-4">
      {/* Kuota Alert Banner */}
      {kuotaAlert && (
        <Alert className={cn(
          "border-l-4",
          kuotaAlert.bgColor,
          kuotaAlert.borderColor
        )}>
          <kuotaAlert.icon className={cn("h-5 w-5", kuotaAlert.iconColor)} />
          <AlertTitle className={cn("font-semibold", kuotaAlert.textColor)}>
            {kuotaAlert.message}
          </AlertTitle>
          <AlertDescription className={kuotaAlert.textColor}>
            {kuotaAlert.description}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Profil Personal */}
        <Card className="shadow-none">
          <CardHeader className="flex justify-between">
            <CardTitle>Informasi Personal</CardTitle>
            <Link
              href="/dashboard/portal-karyawan/settings-profile"
              className="text-blue-500 text-sm"
            >
              Edit Profile
            </Link>
          </CardHeader>

          <CardContent className="flex items-center gap-4">
            <Avatar className="w-24 h-24 rounded-lg">
              <AvatarImage src={profile.foto_profil || undefined} />
              <AvatarFallback className="rounded-lg">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-muted-foreground text-sm">
                {profile.role_name}
              </p>
              {profile.divisi_name && (
                <p className="text-muted-foreground text-sm">
                  {profile.divisi_name}
                </p>
              )}
            </div>
          </CardContent>

          <Separator className="my-2" />

          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode Karyawan/NIK</span>
              <span className="font-medium">{profile.kode_pegawai}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal Lahir</span>
              <span className="font-medium">
                {profile.tanggal_lahir
                  ? format(parseISO(profile.tanggal_lahir), "dd MMMM yyyy", {
                      locale: id,
                    })
                  : "Belum diisi"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status Absensi Hari Ini */}
        <div className="flex flex-col gap-4">
          <Card className="shadow-none">
            <CardHeader className="flex justify-between">
              <CardTitle className="flex items-center gap-2">
                Status Absensi
              </CardTitle>
              <CardDescription>
                {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Status Absen Masuk
                      </p>
                    </div>
                    {todayStatus.hasClockIn ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-6 h-6 text-muted-foreground mx-auto" />
                    )}
                  </div>

                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Status Absen Pulang
                      </p>
                    </div>
                    {todayStatus.hasClockOut ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="w-6 h-6 text-muted-foreground mx-auto" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kuota Cuti Card with Alert Styling */}
          <Card className={cn("shadow-none border-2 transition-all", getKuotaCardStyle())}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {kuotaAlert && kuotaAlert.level !== "info" && (
                    <kuotaAlert.icon className={cn("h-5 w-5", kuotaAlert.iconColor)} />
                  )}
                  <CardTitle className="text-base">
                    Kuota Cuti {kuotaCuti?.tahun || new Date().getFullYear()}
                  </CardTitle>
                </div>
                <Link
                  href="/dashboard/portal-karyawan/cuti-karyawan"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Detail
                </Link>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {kuotaCuti ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Sisa Cuti - with dynamic coloring */}
                    <div className={cn(
                      "p-3 rounded-lg border-2",
                      kuotaCuti.kuota_sisa === 0 
                        ? "bg-red-100 border-red-300" 
                        : kuotaCuti.kuota_sisa <= 2
                        ? "bg-red-50 border-red-200"
                        : kuotaCuti.kuota_sisa <= 5
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                    )}>
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        Sisa
                      </p>
                      <p className={cn(
                        "text-2xl font-bold",
                        kuotaCuti.kuota_sisa === 0
                          ? "text-red-700"
                          : kuotaCuti.kuota_sisa <= 2
                          ? "text-red-600"
                          : kuotaCuti.kuota_sisa <= 5
                          ? "text-amber-600"
                          : "text-blue-600"
                      )}>
                        {kuotaCuti.kuota_sisa}
                      </p>
                      {kuotaCuti.kuota_sisa <= 2 && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <span className="text-[10px] text-red-600 font-semibold">
                            HAMPIR HABIS!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pending */}
                    <div className="p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-amber-600">
                        {kuotaCuti.kuota_pending}
                      </p>
                    </div>

                    {/* Terpakai */}
                    <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        Terpakai
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {kuotaCuti.kuota_terpakai}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progress Penggunaan</span>
                      <span className="font-semibold">
                        {kuotaCuti.kuota_terpakai + kuotaCuti.kuota_pending} /{" "}
                        {kuotaCuti.kuota_total} hari
                      </span>
                    </div>
                    <Progress 
                      value={kuotaPercentage} 
                      className={cn(
                        "h-2.5",
                        kuotaPercentage >= 90 && "[&>div]:bg-red-500",
                        kuotaPercentage >= 70 && kuotaPercentage < 90 && "[&>div]:bg-amber-500"
                      )}
                    />
                    <p className={cn(
                      "text-xs text-center font-medium",
                      kuotaPercentage >= 90 
                        ? "text-red-600" 
                        : kuotaPercentage >= 70
                        ? "text-amber-600"
                        : "text-gray-500"
                    )}>
                      {kuotaPercentage}% kuota telah digunakan/pending
                    </p>
                  </div>

                  {/* Additional Warning for Low Quota */}
                  {kuotaCuti.kuota_sisa <= 5 && kuotaCuti.kuota_sisa > 0 && (
                    <div className={cn(
                      "p-2 rounded-md text-xs text-center font-medium",
                      kuotaCuti.kuota_sisa <= 2
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      ⚠️ Sisakan kuota untuk keperluan mendesak!
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Kuota cuti belum tersedia
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progres Pengajuan Cuti */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Progres Pengajuan Cuti
            </CardTitle>
            <CardDescription>
              Status pengajuan cuti/izin terkini
            </CardDescription>
          </CardHeader>

          <CardContent>
            {cutiProgress.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  Tidak ada pengajuan cuti aktif
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cutiProgress.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {item.jenis_izin_nama}
                          </p>
                        </div>
                        <p className="text-xs dark:text-white text-gray-500 mt-1">
                          Diajukan:{" "}
                          {format(
                            parseISO(item.tanggal_pengajuan),
                            "dd MMM yyyy",
                            { locale: id }
                          )}
                        </p>
                      </div>
                      <Badge className="text-xs px-4 py-2 rounded-lg">
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <Progress
                        value={item.progress_percentage}
                        className="h-1.5 mb-2"
                      />
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 dark:text-white">
                          {item.progress_percentage}% selesai
                        </span>
                        {item.current_approver_name && (
                          <span className="text-gray-600 dark:text-white">
                            Peninjau: {item.current_approver_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Link
                  href="/dashboard/portal-karyawan/cuti-karyawan"
                  className="block text-center text-sm text-blue-600 hover:underline mt-2"
                >
                  Lihat semua pengajuan cuti/izin
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Absensi 7 Hari */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Riwayat Absensi 7 Hari Terakhir
          </CardTitle>
          <CardDescription>
            Rekap kehadiran Anda dalam seminggu terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyAttendance.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              Belum ada data absensi dalam 7 hari terakhir
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hari</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Pulang</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyAttendance.map((attendance) => {
                  const date = parseISO(attendance.date);
                  return (
                    <TableRow key={attendance.date}>
                      <TableCell className="font-medium py-4">
                        {format(date, "dd MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell>
                        {format(date, "EEEE", { locale: id })}
                      </TableCell>
                      <TableCell>{attendance.jam_masuk || "-"}</TableCell>
                      <TableCell>{attendance.jam_pulang || "-"}</TableCell>
                      <TableCell>{formatDuration(attendance.durasi)}</TableCell>
                      <TableCell>{attendance.status}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}