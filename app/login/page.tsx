"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle, Ban, Eye, EyeOff } from "lucide-react";
import Image from "next/image";


/* ---------------------------------------------------
   LOGIN FORM — komponen yang memakai useSearchParams()
--------------------------------------------------- */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alertType, setAlertType] = useState<"error" | "success" | "inactive" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setAlertType(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const kode_pegawai = formData.get("kode_pegawai") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        kode_pegawai,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Cek jenis error untuk menentukan alert type
        if (result.error.includes("tidak aktif")) {
          setAlertType("inactive");
        } else {
          setAlertType("error");
        }
        setError(result.error);
        setLoading(false);
      } else if (!result?.error) {
        // Login berhasil
        setAlertType("success");
        setSuccess(true);
        
        // Redirect setelah 2 detik
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      setAlertType("error");
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <Link
        href="/"
        className="flex items-center gap-2 self-center font-medium mb-8"
      >
        <div className="flex size-6 items-center justify-center rounded-md">
          <Image
            src="/Logo PU Single.png"
            alt="Logo PU"
            width={1920}
            height={1080}
            className="object-cover w-6"
            priority
          />
        </div>
        Putra Utama Group.
      </Link>

      <div className="w-full max-w-xl mx-auto space-y-4">
        {/* Alert Success */}
        {alertType === "success" && (
          <Alert className="border-green-500 bg-green-50 text-green-900 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="font-semibold text-green-900">Login Berhasil!</AlertTitle>
            <AlertDescription className="text-green-800">
              Selamat datang kembali. Anda akan diarahkan ke dashboard...
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Error - Akun Tidak Aktif */}
        {alertType === "inactive" && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Ban className="h-5 w-5" />
            <AlertTitle className="font-semibold">Akun Tidak Aktif</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Error - Login Gagal */}
        {alertType === "error" && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
            <XCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Login Gagal</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Card Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Silahkan login ke akun Anda</CardTitle>
            <CardDescription>
              Gunakan kode karyawan dan password Anda untuk mengakses akun.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="kode_pegawai">Kode Karyawan/NIK</FieldLabel>
                  <Input
                    id="kode_pegawai"
                    type="text"
                    name="kode_pegawai"
                    placeholder="Masukkan kode karyawan/NIK..."
                    required
                    disabled={loading || success}
                    className="text-sm"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      className="text-sm pr-10"
                      required
                      disabled={loading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || success}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <Field>
                  <Button 
                    type="submit" 
                    disabled={loading || success} 
                    className="cursor-pointer w-full"
                  >
                    {loading ? "Memproses..." : success ? "Berhasil!" : "Login"}
                  </Button>
                  <FieldDescription className="text-center text-xs text-muted-foreground">
                    Hanya pengguna yang memiliki hak akses yang dapat masuk.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-white text-sm font-medium">
              Memverifikasi...
            </p>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg shadow-xl">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              Login Berhasil!
            </p>
            <p className="text-sm text-gray-600">
              Mengarahkan ke dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


/* ---------------------------------------------------
   PAGE — wajib bungkus LoginForm dengan Suspense
--------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}