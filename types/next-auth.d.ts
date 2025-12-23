import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    roleId?: number;
    kode_pegawai?: string;
    cabang_id?: string | null;
    foto_profil?: string | null;
    divisi_kode?: string | null;
  }

  interface Session {
    user: {
      id: string;
      kode_pegawai: string;
      name: string;
      role: string;
      roleId: number;
      cabang_id: string | null;
      foto_profil: string | null;
      divisi_kode?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    roleId?: number;
    id?: string;
    kode_pegawai?: string;
    cabang_id: string | null;
    foto_profil?: string | null;
    divisi_kode?: string | null;
  }
}