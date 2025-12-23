// File: app/verify/cuti/[id]/[level]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";

interface VerificationData {
  cuti: {
    id: number;
    user_name: string;
    kode_pegawai: string;
    role_name: string;
    nama_divisi: string;
    jenis_izin: string;
    tanggal_izin: string | null;
    tanggal_cuti_mulai: string | null;
    tanggal_cuti_selesai: string | null;
    alasan: string;
    status: string;
  };
  approval: {
    approver_name: string;
    approver_role: string;
    approval_level: number;
    status: string;
    notes: string | null;
    approved_at: string;
  } | null;
}

export default function VerificationPage() {
  const params = useParams();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/verify/cuti/${params.id}/${params.level}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Data tidak ditemukan");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data verifikasi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatJenisIzin = (jenis: string) => {
    const mapping: { [key: string]: string } = {
      cuti: "Cuti",
      sakit: "Sakit",
      izin: "Izin",
      datang_terlambat: "Izin Datang Terlambat",
      meninggalkan_pekerjaan: "Izin Meninggalkan Pekerjaan",
    };
    return mapping[jenis] || jenis;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Verifikasi Gagal
              </h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Verifikasi Persetujuan Cuti/Izin
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Approval Info */}
        {data.approval && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Informasi Persetujuan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Pemeriksa</p>
                  <p className="font-semibold">{data.approval.approver_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jabatan</p>
                  <p className="font-semibold">{data.approval.approver_role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal Approval</p>
                  <p className="font-medium">
                    {formatDateTime(data.approval.approved_at)}
                  </p>
                </div>
              </div>

              {data.approval.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Catatan</p>
                  <p className="text-sm">{data.approval.notes}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Persetujuan terverifikasi
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cuti Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Permohonan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nama Karyawan</p>
                <p className="font-semibold">{data.cuti.user_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kode Pegawai</p>
                <p className="font-semibold">{data.cuti.kode_pegawai}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Jabatan</p>
                <p className="font-medium">{data.cuti.role_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Divisi</p>
                <p className="font-medium">{data.cuti.nama_divisi}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Jenis</p>
                <p className="font-medium">
                  {formatJenisIzin(data.cuti.jenis_izin)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tanggal</p>
                <p className="font-medium">
                  {data.cuti.jenis_izin === "cuti"
                    ? `${formatDate(data.cuti.tanggal_cuti_mulai)} - ${formatDate(
                        data.cuti.tanggal_cuti_selesai
                      )}`
                    : formatDate(data.cuti.tanggal_izin)}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Alasan</p>
              <p className="text-sm">{data.cuti.alasan}</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>Dokumen ini terverifikasi secara digital</p>
          <p className="mt-1">© {new Date().getFullYear()} Putra Utama Group</p>
        </div>
      </div>
    </div>
  );
}