export interface User {
    kode_pegawai: string;
    name: string;
    divisi_kode: string;
    email?: string;
    cabang_id?: string;
    role_name?: string;
  }
  
  /**
   * Filter users yang memiliki kode_pegawai valid
   */
  export function filterValidUsers(users: User[]): User[] {
    return users.filter(
      user => user.kode_pegawai && user.kode_pegawai.trim() !== ""
    );
  }
  
  /**
   * Filter users berdasarkan divisi dan validitas kode_pegawai
   */
  export function filterUsersByDivisi(
    users: User[], 
    divisiKode: string
  ): User[] {
    return users.filter(
      user => 
        user.divisi_kode === divisiKode &&
        user.kode_pegawai && 
        user.kode_pegawai.trim() !== ""
    );
  }