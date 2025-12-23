"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button onClick={handleLogout} className="btn btn-primary">
      Logout
    </button>
  );
}
