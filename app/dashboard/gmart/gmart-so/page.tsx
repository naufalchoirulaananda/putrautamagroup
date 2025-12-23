"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Smartphone,
  Store,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { FaAndroid } from "react-icons/fa";
import Image from "next/image";

function isSpecialRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const ADMIN_ROLES = [
    "SUPERADMIN",
    "PROGRAMMER",
    "PROGRAMMER JUNIOR",
    "OWNER",
    "DIREKTUR UTAMA",
    "DIREKTUR KEUANGAN",
    "DIREKTUR KSP",
    "DIREKTUR OTOMOTIF",
    "DIREKTUR MPU",
    "MANAGER GMART",
    "STAFF KEUANGAN GMART",
    "SPV LOGISTIK GMART",
    "SPV KEUANGAN GMART",
    "HRD GMART",
    "PERSONALIA"
  ];
  const normalizedRole = role.toUpperCase().trim();
  return ADMIN_ROLES.includes(normalizedRole);
}

export default function BarcodeScannerPage() {
  const { data: session, status } = useSession();

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isScannerActiveRef = useRef(false);
  const isScannerBusyRef = useRef(false);
  const lastScannedRef = useRef<string>("");
  const scanCooldownRef = useRef(false);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  // States
  const [scannerMode, setScannerMode] = useState<"android" | "ios" | null>(
    null
  );
  const [barcode, setBarcode] = useState("");
  const [item, setItem] = useState<any>(null);
  const [allItems, setAllItems] = useState<any[]>([]); // ✅ Untuk menyimpan semua data cabang
  const [selectedCabang, setSelectedCabang] = useState<string>(""); // ✅ Cabang yang dipilih
  const [isScanning, setIsScanning] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [stockReal, setStockReal] = useState<number | "">("");
  const [lokasiRak, setLokasiRak] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingItem, setIsFetchingItem] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: "error" | "success" | "warning";
    title: string;
    message: string;
  }>({
    type: "error",
    title: "",
    message: "",
  });

  const userRole = session?.user?.role;
  const cabangId = session?.user?.cabang_id;
  const hasSpecialRole = isSpecialRole(userRole);

  // ✅ Calculate selisih berdasarkan item yang dipilih
  const selisih = item ? Number(stockReal) - Number(item.Qty ?? 0) : 0;

  // Show dialog helper
  const showDialog = (
    type: "error" | "success" | "warning",
    title: string,
    message: string
  ) => {
    setDialogConfig({ type, title, message });
    setDialogOpen(true);
  };

  // Play beep sound
  const playBeep = () => {
    try {
      const audio = new Audio("/beep.mp3");
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.warn("Beep sound failed to play:", err);
      });
    } catch (err) {
      console.warn("Audio not supported:", err);
    }
  };

  // ✅ Fetch item data dengan support multi cabang
  async function fetchItem(code: string) {
    if (!code || code.trim() === "") return;

    setIsFetchingItem(true);
    try {
      const res = await fetch("/api/gmart/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: code }),
      });

      if (!res.ok) {
        let errorMessage = `Gagal mengambil data item. Status: ${res.status}`;

        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }

        showDialog("error", "Kesalahan Server", errorMessage);

        setItem(null);
        setAllItems([]);
        setSelectedCabang("");
        setLokasiRak("");
        setStockReal("");
        return;
      }

      const data = await res.json();

      if (data.found) {
        if (data.isAdmin && Array.isArray(data.data)) {
          // ✅ ADMIN: Tampilkan semua cabang
          setAllItems(data.data);

          // Set item pertama sebagai default
          if (data.data.length > 0) {
            const firstItem = data.data[0];
            setItem(firstItem);
            setSelectedCabang(firstItem.KodeCabang);

            if (firstItem.ExistingLokasiRak) {
              setLokasiRak(firstItem.ExistingLokasiRak);
            } else {
              setLokasiRak("");
            }

            if (
              firstItem.LastStockReal !== null &&
              firstItem.LastStockReal !== undefined
            ) {
              setStockReal(firstItem.LastStockReal);
            } else {
              setStockReal("");
            }
          }
        } else {
          // ✅ USER BIASA: Single cabang
          setItem(data.data);
          setAllItems([data.data]);
          setSelectedCabang(data.data.KodeCabang);

          if (data.data.ExistingLokasiRak) {
            setLokasiRak(data.data.ExistingLokasiRak);
          } else {
            setLokasiRak("");
          }

          if (
            data.data.LastStockReal !== null &&
            data.data.LastStockReal !== undefined
          ) {
            setStockReal(data.data.LastStockReal);
          } else {
            setStockReal("");
          }
        }
      } else {
        setItem(null);
        setAllItems([]);
        setSelectedCabang("");
        setLokasiRak("");
        setStockReal("");
        showDialog(
          "error",
          "Item Tidak Ditemukan",
          `Item dengan kode "${code}" tidak ditemukan${
            !hasSpecialRole ? " di cabang Anda" : ""
          }.`
        );
      }
    } catch (error) {
      console.error("Error fetching item:", error);

      let errorMessage =
        "Gagal mengambil data item. Periksa koneksi internet Anda.";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      } else if (error instanceof Error) {
        errorMessage = `Terjadi kesalahan: ${error.message}`;
      }

      showDialog("error", "Kesalahan Jaringan", errorMessage);

      setItem(null);
      setAllItems([]);
      setSelectedCabang("");
      setLokasiRak("");
      setStockReal("");
    } finally {
      setIsFetchingItem(false);
    }
  }

  // ✅ Handle pemilihan cabang
  const handleSelectCabang = (kodeCabang: string) => {
    const selectedItem = allItems.find((i) => i.KodeCabang === kodeCabang);

    if (selectedItem) {
      setSelectedCabang(kodeCabang);
      setItem(selectedItem);

      if (selectedItem.ExistingLokasiRak) {
        setLokasiRak(selectedItem.ExistingLokasiRak);
      } else {
        setLokasiRak("");
      }

      if (
        selectedItem.LastStockReal !== null &&
        selectedItem.LastStockReal !== undefined
      ) {
        setStockReal(selectedItem.LastStockReal);
      } else {
        setStockReal("");
      }
    }
  };

  // Manual search handler
  async function handleManualSearch() {
    if (searchCode.trim() === "") {
      showDialog(
        "warning",
        "Input Kosong",
        "Masukkan kode item terlebih dahulu!"
      );
      return;
    }

    setBarcode(searchCode);
    await fetchItem(searchCode);
  }

  // ============== ANDROID SCANNER (HTML5-QRCODE) ==============
  const startAndroidScanner = async () => {
    if (isScannerBusyRef.current || isScannerActiveRef.current) {
      console.log("Scanner already running or busy");
      return;
    }

    isScannerBusyRef.current = true;

    try {
      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        throw new Error("Scanner element not found in DOM");
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
      }

      const config = {
        fps: 60,
        qrbox: { width: 280, height: 140 },
        aspectRatio: 1.7777778,
        disableFlip: false,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          if (
            scanCooldownRef.current ||
            lastScannedRef.current === decodedText
          ) {
            return;
          }

          scanCooldownRef.current = true;
          lastScannedRef.current = decodedText;

          setIsDetecting(true);
          setTimeout(() => setIsDetecting(false), 600);

          setBarcode(decodedText);
          await fetchItem(decodedText);

          playBeep();

          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }

          setTimeout(() => {
            scanCooldownRef.current = false;
            lastScannedRef.current = "";
          }, 1500);
        },
        (errorMessage) => {
          // Silent error for continuous scanning
        }
      );

      isScannerActiveRef.current = true;
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      isScannerActiveRef.current = false;
      showDialog(
        "error",
        "Gagal Mengakses Kamera",
        err instanceof Error
          ? err.message
          : "Pastikan izin kamera sudah diberikan pada browser Anda."
      );
    } finally {
      isScannerBusyRef.current = false;
    }
  };

  const stopAndroidScanner = async () => {
    if (isScannerBusyRef.current || !isScannerActiveRef.current) {
      console.log("Scanner not running or busy");
      return;
    }

    isScannerBusyRef.current = true;

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        isScannerActiveRef.current = false;
        setIsScanning(false);
        setIsDetecting(false);
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
      isScannerActiveRef.current = false;
      setIsScanning(false);
      setIsDetecting(false);
    } finally {
      isScannerBusyRef.current = false;
    }
  };

  // ============== iOS SCANNER (REACT-WEBCAM + JSQR) ==============
  // ============== iOS SCANNER (ZXING) ==============
  const startIOSScanner = async () => {
    if (!videoRef.current) {
      showDialog("error", "Kesalahan", "Video element tidak ditemukan");
      return;
    }

    try {
      setIsScanning(true);

      // Initialize ZXing reader
      if (!zxingReaderRef.current) {
        zxingReaderRef.current = new BrowserMultiFormatReader();
      }

      const videoInputDevices =
        await zxingReaderRef.current.listVideoInputDevices();

      // Cari kamera belakang
      let selectedDeviceId = videoInputDevices[0]?.deviceId;

      for (const device of videoInputDevices) {
        if (
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
        ) {
          selectedDeviceId = device.deviceId;
          break;
        }
      }

      // Start decoding dari video stream
      await zxingReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        async (result, error) => {
          if (result) {
            const decodedText = result.getText();

            if (
              scanCooldownRef.current ||
              lastScannedRef.current === decodedText
            ) {
              return;
            }

            scanCooldownRef.current = true;
            lastScannedRef.current = decodedText;

            setIsDetecting(true);
            setTimeout(() => setIsDetecting(false), 600);

            setBarcode(decodedText);
            await fetchItem(decodedText);

            playBeep();

            if (navigator.vibrate) {
              navigator.vibrate([100, 50, 100]);
            }

            setTimeout(() => {
              scanCooldownRef.current = false;
              lastScannedRef.current = "";
            }, 1500);
          }

          if (error && !(error instanceof NotFoundException)) {
            console.warn("ZXing decode error:", error);
          }
        }
      );

      isScannerActiveRef.current = true;
    } catch (err) {
      console.error("Error starting iOS scanner:", err);
      setIsScanning(false);
      showDialog(
        "error",
        "Gagal Mengakses Kamera",
        err instanceof Error
          ? err.message
          : "Pastikan izin kamera sudah diberikan pada browser Anda."
      );
    }
  };

  const stopIOSScanner = () => {
    if (zxingReaderRef.current) {
      zxingReaderRef.current.reset();
    }
    setIsScanning(false);
    setIsDetecting(false);
    isScannerActiveRef.current = false;
  };

  // Save to server
  async function saveToServer() {
    if (!item) {
      showDialog(
        "warning",
        "Data Tidak Lengkap",
        "Belum ada item yang dipilih!"
      );
      return;
    }

    if (stockReal === "") {
      showDialog(
        "warning",
        "Data Tidak Lengkap",
        "Isi Stock Real terlebih dahulu!"
      );
      return;
    }

    if (isNaN(Number(stockReal)) || Number(stockReal) < 0) {
      showDialog(
        "warning",
        "Input Tidak Valid",
        "Stock Real harus berupa angka positif!"
      );
      return;
    }

    if (!lokasiRak || lokasiRak.trim() === "") {
      showDialog("warning", "Data Tidak Lengkap", "Lokasi Rak harus diisi!");
      return;
    }

    if (lokasiRak.length > 50) {
      showDialog(
        "warning",
        "Input Terlalu Panjang",
        "Lokasi Rak maksimal 50 karakter!"
      );
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/gmart/save-server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kodeitem: item.KodeItem,
          namaitem: item.NamaItem,
          qty: item.Qty,
          harga: item.HargaJual,
          stockreal: Number(stockReal),
          selisih: selisih,
          lokasi: item.NamaLokasi,
          kodecabang: item.KodeCabang,
          lokasirak: lokasiRak.trim(),
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        showDialog(
          "warning",
          "Terlalu Cepat",
          data.error ||
            "Mohon tunggu beberapa saat sebelum scan item yang sama."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        showDialog(
          "success",
          "Berhasil Disimpan",
          "Data berhasil disimpan ke server!"
        );

        setStockReal("");
        setLokasiRak("");
        setItem(null);
        setAllItems([]);
        setSelectedCabang("");
        setBarcode("");
        setSearchCode("");
        lastScannedRef.current = "";
      } else {
        showDialog(
          "error",
          "Gagal Menyimpan",
          data.error || "Terjadi kesalahan saat menyimpan data."
        );
      }
    } catch (error) {
      console.error("Error saving to server:", error);
      showDialog(
        "error",
        "Kesalahan Server",
        "Terjadi kesalahan saat menyimpan data. Silakan coba lagi."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Handle scanner start/stop based on mode
  const handleStartScanner = async () => {
    if (scannerMode === "android") {
      await startAndroidScanner();
    } else if (scannerMode === "ios") {
      await startIOSScanner();
    }
  };

  const handleStopScanner = async () => {
    if (scannerMode === "android") {
      await stopAndroidScanner();
    } else if (scannerMode === "ios") {
      stopIOSScanner();
    }
  };

  // Update active ref when scanning state changes
  useEffect(() => {
    isScannerActiveRef.current = isScanning;
  }, [isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = async () => {
      if (scannerRef.current) {
        try {
          if (isScannerActiveRef.current) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (err) {
          console.error("Cleanup error:", err);
        } finally {
          scannerRef.current = null;
          isScannerActiveRef.current = false;
        }
      }

      if (zxingReaderRef.current) {
        zxingReaderRef.current.reset();
      }
    };

    return () => {
      cleanup();
    };
  }, []);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (scannerRef.current && isScannerActiveRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      if (zxingReaderRef.current) {
        zxingReaderRef.current.reset();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-500" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === "unauthenticated" || !session) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Login Required
          </h2>
          <p className="text-red-600 mb-4">
            Silakan login terlebih dahulu untuk mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  // No branch access
  if (!hasSpecialRole && !cabangId) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-red-600 mb-4">
            Anda belum memiliki cabang yang terdaftar. Silakan hubungi
            administrator.
          </p>
        </div>
      </div>
    );
  }

  // Filter duplikat berdasarkan KodeCabang + KodeItem
  const uniqueItems = allItems.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) => t.KodeCabang === item.KodeCabang && t.KodeItem === item.KodeItem
      )
  );

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Scanner Barcode</h1>
        <p className="text-gray-500 mt-2">
          Scan barcode item produk untuk melihat dan melakukan update stock
        </p>
      </header>

      {/* ============== SCANNER MODE SELECTION ============== */}
      {!scannerMode && (
        <div className="mb-6">
          <div className="border-2 border-black bg-white rounded-xl p-6">
            <div className="text-center mb-4">
              <Smartphone className="w-12 h-12 mx-auto mb-3 text-black" />
              <h2 className="text-black text-xl font-bold mb-2">
                Pilih Mode Scanner
              </h2>
              <p className="text-sm text-black">
                Pilih mode scanner sesuai dengan perangkat Anda
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setScannerMode("android")}
                className="h-auto py-6 flex flex-col items-center cursor-pointer gap-3 border bg-[#26d7bf] hover:bg-[#26d7bf]/80"
              >
                <div>
                  <Image
                    src={"/android-logo.png"}
                    width={1920}
                    height={1080}
                    alt={"android"}
                    className="object-cover w-12 h-12"
                  />
                </div>
                <div>
                  <p className="font-bold text-black text-lg">Mode Android</p>
                  <p className="text-xs text-black opacity-90">
                    Untuk perangkat Android.
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => setScannerMode("ios")}
                className="h-auto py-6 flex flex-col items-center gap-3 border cursor-pointer bg-[#e9ec3c] hover:bg-[#e9ec3c]/80"
              >
                <div>
                  <Image
                    src={"/apple-logo.png"}
                    width={1920}
                    height={1080}
                    alt={"android"}
                    className="object-cover w-12 h-12"
                  />
                </div>
                <div>
                  <p className="font-bold text-black text-lg">
                    Mode iOs/iPhone
                  </p>
                  <p className="text-xs text-black opacity-90">
                    Untuk perangkat iOS/iPhone
                  </p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============== SCANNER DISPLAY ============== */}
      {scannerMode && (
        <>
          <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl mb-5">
            {scannerMode === "android" ? (
              <div
                id="qr-reader"
                className="w-full"
                style={{ minHeight: "400px" }}
              ></div>
            ) : (
              <div className="w-full" style={{ minHeight: "400px" }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ minHeight: "400px" }}
                  playsInline
                  muted
                />
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`relative transition-all duration-300 ${
                      isDetecting
                        ? "w-[200px] h-[100px]"
                        : "w-[280px] h-[140px]"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 ${
                        isDetecting
                          ? "border-green-400 shadow-2xl shadow-green-400/50"
                          : "border-white/80"
                      }`}
                    >
                      <div
                        className={`absolute -top-1 -left-1 w-12 h-12 border-t-[6px] border-l-[6px] rounded-tl-lg transition-all duration-300 ${
                          isDetecting ? "border-green-400" : "border-blue-400"
                        }`}
                      ></div>
                      <div
                        className={`absolute -top-1 -right-1 w-12 h-12 border-t-[6px] border-r-[6px] rounded-tr-lg transition-all duration-300 ${
                          isDetecting ? "border-green-400" : "border-blue-400"
                        }`}
                      ></div>
                      <div
                        className={`absolute -bottom-1 -left-1 w-12 h-12 border-b-[6px] border-l-[6px] rounded-bl-lg transition-all duration-300 ${
                          isDetecting ? "border-green-400" : "border-blue-400"
                        }`}
                      ></div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-12 h-12 border-b-[6px] border-r-[6px] rounded-br-lg transition-all duration-300 ${
                          isDetecting ? "border-green-400" : "border-blue-400"
                        }`}
                      ></div>

                      {!isDetecting ? (
                        <>
                          <div className="absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-transparent via-blue-400 to-transparent animate-scan-fast"></div>
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-cyan-300 to-transparent animate-scan-fast-delay"></div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-green-400/20 rounded-lg animate-pulse-fast"></div>
                      )}
                    </div>

                    <div className="absolute -bottom-16 left-0 right-0 text-center">
                      {isDetecting ? (
                        <div className="bg-green-500 text-white px-6 py-2 rounded-full font-bold inline-flex items-center gap-2 shadow-lg">
                          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                          BARCODE DETECTED!
                        </div>
                      ) : (
                        <p className="text-white text-sm font-semibold drop-shadow-lg">
                          Arahkan barcode ke area kotak
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                <div className="text-center">
                  <p className="=text-xl font-bold text-white">
                    Kamera Tidak Aktif
                  </p>
                  <p className="text-xs mt-2 text-white">
                    Tekan tombol Start untuk mulai scanning barcode
                  </p>
                  <p className="text-blue-400 text-xs mt-1">
                    Mode: {scannerMode === "android" ? "Android" : "iOS/iPhone"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={isScanning ? handleStopScanner : handleStartScanner}
              disabled={isScannerBusyRef.current}
              className={`flex-1 py-4 cursor-pointer rounded-lg text-white font-bold text-sm transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isScanning
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#002E9A] hover:bg-[#002E9A]/80"
              }`}
            >
              {isScannerBusyRef.current ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : isScanning ? (
                "Stop Scanner"
              ) : (
                "Start Scanner"
              )}
            </Button>

            <Button
              onClick={() => {
                if (isScanning) {
                  handleStopScanner();
                }
                setScannerMode(null);
              }}
              variant="outline"
              className="px-6 py-4"
            >
              Ganti Mode
            </Button>
          </div>
        </>
      )}

      <div className="rounded-xl p-5 border mb-6">
        <h2 className="font-bold text-xl mb-3">Cari Item Manual</h2>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Masukkan Kode Item..."
            className="flex-1 border-2 text-sm rounded-lg px-4 py-3"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleManualSearch();
            }}
            disabled={isFetchingItem}
          />
          <Button
            onClick={handleManualSearch}
            disabled={isFetchingItem}
            className="px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingItem ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Cari"
            )}
          </Button>
        </div>
      </div>

      {isFetchingItem && (
        <div className="text-center py-4 mb-6">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-500 mt-2">Mencari item...</p>
        </div>
      )}

      {barcode && !isFetchingItem && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-800 font-semibold text-sm mb-1">
            Barcode Terdeteksi:
          </p>
          <p className="text-green-900 font-mono text-lg font-bold">
            {barcode}
          </p>
        </div>
      )}

      {/* ✅ SECTION MULTI CABANG UNTUK ADMIN */}
      {hasSpecialRole && uniqueItems.length > 1 && (
        <div className="rounded-xl p-5 border mb-6 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-blue-900">Item Ditemukan</h2>
            <span className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold">
              {uniqueItems.length} Cabang
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-4">
            Pilih cabang yang ingin Anda audit:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uniqueItems.map((cabangItem) => (
              <button
                key={`${cabangItem.KodeCabang}-${cabangItem.KodeItem}`}
                onClick={() => handleSelectCabang(cabangItem.KodeCabang)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedCabang === cabangItem.KodeCabang
                    ? "border-green-500 bg-green-50 shadow-lg scale-105"
                    : "border-gray-300 hover:border-blue-400 bg-white hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-base textgray-600">
                      {cabangItem.NamaCabang}
                    </span>
                  </div>
                  {selectedCabang === cabangItem.KodeCabang && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Jumlah item:</span>
                    <span className="font-semibold text-blue-600">
                      {cabangItem.Qty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lokasi:</span>
                    <span className="font-semibold">
                      {cabangItem.NamaLokasi || "-"}
                    </span>
                  </div>
                  {cabangItem.LastStockReal !== null &&
                    cabangItem.LastStockReal !== undefined && (
                      <div className="flex justify-between text-green-600">
                        <span>Stock Real:</span>
                        <span className="font-semibold">
                          {cabangItem.LastStockReal}
                        </span>
                      </div>
                    )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl p-5 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl">Data Barang</h2>
          {hasSpecialRole && item && allItems.length > 1 && (
            <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-xs font-semibold">
              📍 {item.NamaCabang}
            </span>
          )}
        </div>

        {item ? (
          <>
            <div className="rounded-lg py-4 mb-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="font-semibold py-2">Kode Item</td>
                    <td className="py-2 text-right font-mono">
                      {item.KodeItem}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="font-semibold py-2">Nama Item</td>
                    <td className="py-2 text-right">{item.NamaItem}</td>
                  </tr>
                  {hasSpecialRole && allItems.length > 1 && (
                    <tr className="border-b border-gray-200">
                      <td className="font-semibold py-2">Cabang</td>
                      <td className="py-2 text-right font-bold text-blue-600">
                        {item.NamaCabang}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200">
                    <td className="font-semibold py-2">Qty System</td>
                    <td className="py-2 text-right font-bold text-blue-600">
                      {item.Qty}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="font-semibold py-2">Harga Jual</td>
                    <td className="py-2 text-right font-bold text-green-600">
                      Rp {Number(item.HargaJual).toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold py-2">Lokasi</td>
                    <td className="py-2 text-right">{item.NamaLokasi}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mb-4">
              <Label className="font-semibold block mb-2">
                Stock Real: <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm"
                value={stockReal}
                onChange={(e) =>
                  setStockReal(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="Masukkan jumlah stock real..."
                min="0"
              />
            </div>

            <div className="mb-4">
              <Label className="font-semibold block mb-2">
                Lokasi Rak: <span className="text-red-500">*</span>
                {item?.ExistingLokasiRak && (
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    (Terakhir: {item.ExistingLokasiRak})
                  </span>
                )}
              </Label>
              <Input
                type="text"
                className={`w-full border-2 rounded-lg px-4 py-3 text-sm ${
                  item?.ExistingLokasiRak
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300"
                }`}
                value={lokasiRak}
                onChange={(e) => setLokasiRak(e.target.value.toUpperCase())}
                placeholder={
                  item?.ExistingLokasiRak
                    ? `Terakhir: ${item.ExistingLokasiRak}`
                    : "Masukkan lokasi rak..."
                }
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {lokasiRak.length}/50 karakter
                {item?.ExistingLokasiRak &&
                  lokasiRak === item.ExistingLokasiRak && (
                    <span className="ml-2 text-green-600">
                      ✓ Sama dengan terakhir
                    </span>
                  )}
              </p>
            </div>
            <div className="mb-5">
              <label className="font-semibold block mb-2">
                Selisih (Stock Real - Qty):
              </label>
              <div
                className={`w-full border-2 rounded-lg px-4 py-3 text-lg font-bold text-center ${
                  selisih > 0
                    ? "bg-green-50 border-green-300 text-green-700"
                    : selisih < 0
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-gray-100 border-gray-300 text-gray-700"
                }`}
              >
                {selisih}
              </div>
            </div>
            <Button
              onClick={saveToServer}
              disabled={isSaving}
              className={`w-full py-4 rounded-lg font-semibold text-sm transition-all transform active:scale-95 ${
                isSaving ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan Ke Server"
              )}
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-3">📦</div>
            <p className="text-gray-400 text-lg">
              Scan barcode atau cari item manual untuk melihat data
            </p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-2 ${
                dialogConfig.type === "error"
                  ? "text-red-600"
                  : dialogConfig.type === "success"
                  ? "text-green-600"
                  : "text-amber-600"
              }`}
            >
              {dialogConfig.type === "error" && <XCircle className="w-5 h-5" />}
              {dialogConfig.type === "success" && (
                <CheckCircle className="w-5 h-5" />
              )}
              {dialogConfig.type === "warning" && (
                <AlertCircle className="w-5 h-5" />
              )}
              {dialogConfig.title}
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="py-4 text-gray-700">
            {dialogConfig.message}
          </DialogDescription>

          <DialogFooter>
            <Button
              onClick={() => setDialogOpen(false)}
              className={`${
                dialogConfig.type === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : dialogConfig.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes scan-fast {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(140px);
            opacity: 0;
          }
        }
        @keyframes scan-fast-delay {
          0% {
            transform: translateY(0);
            opacity: 0.7;
          }
          100% {
            transform: translateY(140px);
            opacity: 0;
          }
        }
        @keyframes pulse-fast {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        .animate-scan-fast {
          animation: scan-fast 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-scan-fast-delay {
          animation: scan-fast-delay 1s cubic-bezier(0.4, 0, 0.2, 1) infinite
            0.15s;
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
