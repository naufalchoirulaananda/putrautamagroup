import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";

interface UserWithRole {
  id: number;
  name: string;
  kode_pegawai: string;
  password: string;
  role_id: number;
  status: string;
  role_name: string;
  cabang_id: string | null;
  foto_profil: string | null;
  divisi_kode: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        kode_pegawai: { label: "Kode Pegawai", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.kode_pegawai || !credentials?.password) {
          throw new Error("Kode Pegawai dan password harus diisi");
        }

        // Cek user tanpa filter status dulu untuk memberikan error yang spesifik
        const allUsers = await query<UserWithRole>(
          `SELECT u.*, r.name as role_name 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE u.kode_pegawai = ?`,
          [credentials.kode_pegawai]
        );

        const user = allUsers[0];

        // Jika user tidak ditemukan sama sekali
        if (!user) {
          throw new Error("Kode Pegawai tidak ditemukan");
        }

        // Cek apakah akun inactive
        if (user.status !== 'active') {
          throw new Error("Akun Anda tidak aktif. Silahkan hubungi administrator");
        }

        // Bandingkan langsung plain text
        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        // Log activity login
        await query(
          "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
          [user.id, "login"]
        );

        return {
          id: user.id.toString(),
          kode_pegawai: user.kode_pegawai,
          name: user.name,
          role: user.role_name,
          roleId: user.role_id,
          cabang_id: user.cabang_id,
          foto_profil: user.foto_profil,
          divisi_kode: user.divisi_kode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.roleId = user.roleId;
        token.id = user.id;
        token.kode_pegawai = user.kode_pegawai;
        token.cabang_id = user.cabang_id ?? null;
        token.foto_profil = user.foto_profil ?? null;
        token.divisi_kode = user.divisi_kode ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as number;
        session.user.id = token.id as string;
        session.user.kode_pegawai = token.kode_pegawai as string;
        session.user.cabang_id = token.cabang_id as string | null;
        session.user.foto_profil = token.foto_profil as string | null;
        session.user.divisi_kode = token.divisi_kode as string | null;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      try {
        if (token?.id) {
          await query(
            "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
            [token.id, "logout"]
          );
        }
      } catch (error) {
        console.error("Error logging logout:", error);
      }
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};