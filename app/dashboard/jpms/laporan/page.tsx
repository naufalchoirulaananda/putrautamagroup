"use client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, X, Trash2, FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const API = "https://putrautamagroup.id/api";

export default function LaporanPage() {
    /* FILTER */
    const [searchPlat, setSearchPlat] = useState("");
    const [date, setDate] = useState<Date | undefined>();
    const [range, setRange] = useState<DateRange | undefined>();
    
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [loading, setLoading] = useState(false);
    
    /* dialog konfirmasi verifikasi */
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);

    /* dialog delete */
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    /* dialog info */
    const [infoOpen, setInfoOpen] = useState(false);
    const [infoMessage, setInfoMessage] = useState("");

    /* dialog detail */
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);
    const [realVolume, setRealVolume] = useState("");

    const fetchData = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", String(p));

            if (searchPlat.trim()) {
                params.append("plat", searchPlat.trim());
            }

            if (date) {
                params.append("date", format(date, "yyyy-MM-dd"));
            }

            if (range?.from && range?.to) {
                params.append("from", format(range.from, "yyyy-MM-dd"));
                params.append("to", format(range.to, "yyyy-MM-dd"));
            }

            const res = await fetch(
                `${API}/laporan.php?${params.toString()}`,
                { cache: "no-store" }
            );

            const json = await res.json();

            if (json.success) {
                setData(json.data);
                setTotalPage(json.totalPage);
                setPage(p);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const openDetail = async (id: number) => {
        try {
            const resDetail = await fetch(
                `${API}/laporan-detail.php?id=${id}`,
                { cache: "no-store" }
            );
            const detailJson = await resDetail.json();

            const resImg = await fetch(
                `${API}/laporan-images.php?id=${id}`,
                { cache: "no-store" }
            );
            const imgJson = await resImg.json();

            setDetail({
                ...detailJson.data,
                images: imgJson.images || [],
            });

            setRealVolume(detailJson.data.realVolume ?? "");
            setOpen(true);
        } catch (err) {
            alert("Gagal membuka detail laporan");
        }
    };

    const verifikasi = async () => {
        if (!detail) return;

        if (!realVolume || isNaN(Number(realVolume))) {
            setInfoMessage("Real Volume harus diisi dengan angka");
            setInfoOpen(true);
            return;
        }

        setConfirmOpen(true);
    };

    const submitVerifikasi = async () => {
        try {
            setLoadingVerify(true);

            const res = await fetch(`${API}/verifikasi-laporan.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idLaporan: detail.idLaporan,
                    realVolume: Number(realVolume),
                }),
            });

            const json = await res.json();

            if (!json.success) {
                setInfoMessage(json.message || "Verifikasi gagal");
                setInfoOpen(true);
                return;
            }

            setInfoMessage("Laporan berhasil diverifikasi");
            setInfoOpen(true);

            setConfirmOpen(false);
            setOpen(false);
            setDetail(null);
            setRealVolume("");

            fetchData(page);
        } catch (err) {
            setInfoMessage("Terjadi kesalahan saat verifikasi");
            setInfoOpen(true);
        } finally {
            setLoadingVerify(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setDeleteOpen(true);
    };

    const submitDelete = async () => {
        if (!deleteId) return;

        try {
            setLoadingDelete(true);

            const res = await fetch(`${API}/hapus-laporan.php?id=${deleteId}`, {
                method: "GET",
            });

            const json = await res.json();

            if (!json.success) {
                setInfoMessage("Gagal menghapus laporan");
                setInfoOpen(true);
                return;
            }

            setInfoMessage("Laporan berhasil dihapus");
            setInfoOpen(true);

            setDeleteOpen(false);
            setDeleteId(null);

            fetchData(page);
        } catch (err) {
            setInfoMessage("Terjadi kesalahan saat menghapus");
            setInfoOpen(true);
        } finally {
            setLoadingDelete(false);
        }
    };

    const exportToExcel = async () => {
        try {
            // Fetch all data without pagination for export
            const params = new URLSearchParams();
            params.append("page", "1");
            params.append("limit", "999999"); // Get all data

            if (searchPlat.trim()) {
                params.append("plat", searchPlat.trim());
            }

            if (date) {
                params.append("date", format(date, "yyyy-MM-dd"));
            }

            if (range?.from && range?.to) {
                params.append("from", format(range.from, "yyyy-MM-dd"));
                params.append("to", format(range.to, "yyyy-MM-dd"));
            }

            const res = await fetch(
                `${API}/laporan.php?${params.toString()}`,
                { cache: "no-store" }
            );

            const json = await res.json();

            if (json.success && json.data.length > 0) {
                // Prepare data for Excel
                const excelData = json.data.map((item: any) => ({
                    "No Plat": item.nomorPlat,
                    "Tanggal": item.tglLaporan,
                    "Material": item.namaMaterial,
                    "Surat Jalan": item.suratJalan,
                    "Volume": item.volume,
                    "Status": item.statusVerifikasi || "BARU",
                    "Real Volume": item.realVolume || "-",
                }));

                // Create workbook and worksheet
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(excelData);

                // Set column widths
                const colWidths = [
                    { wch: 15 }, // No Plat
                    { wch: 20 }, // Tanggal
                    { wch: 20 }, // Material
                    { wch: 15 }, // Surat Jalan
                    { wch: 10 }, // Volume
                    { wch: 12 }, // Status
                    { wch: 12 }, // Real Volume
                ];
                ws['!cols'] = colWidths;

                // Add worksheet to workbook
                XLSX.utils.book_append_sheet(wb, ws, "Laporan Material");

                // Generate filename with date
                const fileName = `Laporan_Material_JPMS_${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`;

                // Save file
                XLSX.writeFile(wb, fileName);

                setInfoMessage(`Berhasil export ${json.data.length} data ke Excel`);
                setInfoOpen(true);
            } else {
                setInfoMessage("Tidak ada data untuk di-export");
                setInfoOpen(true);
            }
        } catch (err) {
            console.error("Export error:", err);
            setInfoMessage("Gagal melakukan export");
            setInfoOpen(true);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchPlat, date, range]);

    const clearFilters = () => {
        setSearchPlat("");
        setDate(undefined);
        setRange(undefined);
    };

    const hasActiveFilters = searchPlat || date || range;

    const volume = Number(detail?.volume || 0);
    const rv = Number(realVolume || 0);
    const selisih = rv ? (rv - volume).toFixed(2) : null;
    const sesuai = selisih === "0.00";

    const badgeStatus = (status: string) => {
        const cls =
            status === "DITERIMA"
                ? "bg-linear-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/50"
                : status === "PROSES"
                    ? "bg-linear-to-r from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50"
                    : status === "DITOLAK"
                        ? "bg-linear-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/50"
                        : "bg-linear-to-r from-gray-400 to-gray-500 shadow-lg shadow-gray-500/50";

        return (
            <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${cls} transition-all duration-300 hover:scale-105`}
            >
                {status || "BARU"}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 space-y-6">
            {/* HEADER */}
            <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                        <FileText className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Data Laporan Material JOWEN (Jogja-Bawen)</h1>
                        <p className="text-blue-100 text-sm">Sistem Manajemen Laporan Material</p>
                    </div>
                </div>
            </div>

            {/* FILTER SECTION */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-blue-500 to-indigo-500 p-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Search className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg">Filter Data</span>
                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={exportToExcel}
                                className="bg-green-500 hover:bg-green-600 text-white border-none shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export Excel
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={clearFilters}
                                    className="text-white hover:bg-white/20 hover:text-white border-white/30 border"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Nomor Plat
                            </label>
                            <Input
                                placeholder="Cari nomor plat..."
                                value={searchPlat}
                                onChange={(e) => setSearchPlat(e.target.value)}
                                className="border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                Tanggal Spesifik
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left border-2 border-gray-200 hover:border-purple-500 rounded-xl transition-all duration-300"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                                        <span className={date ? "text-gray-900" : "text-gray-500"}>
                                            {date ? format(date, "dd MMM yyyy") : "Pilih tanggal"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => {
                                            setDate(d);
                                            setRange(undefined);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Rentang Tanggal
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left border-2 border-gray-200 hover:border-green-500 rounded-xl transition-all duration-300"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-green-500" />
                                        <span className={range?.from && range?.to ? "text-gray-900" : "text-gray-500"}>
                                            {range?.from && range?.to
                                                ? `${format(range.from, "dd MMM")} - ${format(range.to, "dd MMM yyyy")}`
                                                : "Pilih rentang"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={range}
                                        onSelect={(r) => {
                                            setRange(r);
                                            setDate(undefined);
                                        }}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-600">Filter aktif:</span>
                            {searchPlat && (
                                <span className="px-3 py-1.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                                    Plat: {searchPlat}
                                </span>
                            )}
                            {date && (
                                <span className="px-3 py-1.5 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105">
                                    Tanggal: {format(date, "dd MMM yyyy")}
                                </span>
                            )}
                            {range?.from && range?.to && (
                                <span className="px-3 py-1.5 bg-linear-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-semibold shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-105">
                                    {format(range.from, "dd MMM")} - {format(range.to, "dd MMM yyyy")}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-linear-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <TableHead className="uppercase font-bold text-gray-700">No Plat</TableHead>
                            <TableHead className="uppercase font-bold text-gray-700">Tanggal</TableHead>
                            <TableHead className="uppercase font-bold text-gray-700">Material</TableHead>
                            <TableHead className="uppercase font-bold text-gray-700">Surat Jalan</TableHead>
                            <TableHead className="uppercase font-bold text-gray-700">Volume</TableHead>
                            <TableHead className="uppercase font-bold text-gray-700">Status</TableHead>
                            <TableHead className="uppercase font-bold text-gray-700">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3 text-gray-400">
                                        <FileText className="w-16 h-16" />
                                        <p className="text-lg font-semibold">{loading ? "Memuat data..." : "Tidak ada data"}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((d, idx) => (
                                <TableRow 
                                    key={d.idLaporan}
                                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-all duration-200"
                                >
                                    <TableCell className ="uppercase font-bold text-gray-900">{d.nomorPlat}</TableCell>
                                    <TableCell className ="uppercase text-gray-600">{d.tglLaporan}</TableCell>
                                    <TableCell className ="uppercase font-semibold text-indigo-600">{d.namaMaterial}</TableCell>
                                    <TableCell className ="uppercase text-gray-600">{d.suratJalan}</TableCell>
                                    <TableCell className ="uppercase font-semibold text-gray-900">{d.volume}</TableCell>
                                    <TableCell>{badgeStatus(d.statusVerifikasi)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => openDetail(d.idLaporan)}
                                                className="bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 rounded-lg transition-all duration-300 hover:scale-105"
                                            >
                                                Detail
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={() => handleDeleteClick(d.idLaporan)}
                                                className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 rounded-lg transition-all duration-300 hover:scale-105"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* PAGINATION */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-600">
                        Menampilkan halaman <span className="text-blue-600">{page}</span> dari <span className="text-blue-600">{totalPage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            disabled={page <= 1 || loading} 
                            onClick={() => fetchData(page - 1)}
                            className="bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg disabled:opacity-50 transition-all duration-300 hover:scale-105"
                        >
                            Prev
                        </Button>
                        <span className="font-bold text-lg px-4 py-2 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow-lg">
                            {page} / {totalPage}
                        </span>
                        <Button 
                            disabled={page >= totalPage || loading} 
                            onClick={() => fetchData(page + 1)}
                            className="bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg disabled:opacity-50 transition-all duration-300 hover:scale-105"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* DIALOG DETAIL */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    {!detail ? (
                        <p>Loading...</p>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between text-2xl">
                                    <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                                        Detail Laporan
                                    </span>
                                    {badgeStatus(detail.statusVerifikasi)}
                                </DialogTitle>
                            </DialogHeader>

                            {detail.images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {detail.images.map((img: any, i: number) => (
                                        <img
                                            key={i}
                                            src={img.url}
                                            className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                            onClick={() => window.open(img.url, "_blank")}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <FileText className="w-16 h-16 mx-auto mb-2" />
                                    <p>Tidak ada foto</p>
                                </div>
                            )}

                            <div className="space-y-3 bg-gray-50 p-6 rounded-xl">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="font-semibold text-gray-600">No Plat:</span>
                                    <span className="font-bold text-gray-900">{detail.nomorPlat}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="font-semibold text-gray-600">Tanggal:</span>
                                    <span className="font-bold text-gray-900">{detail.tglLaporan}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="font-semibold text-gray-600">Material:</span>
                                    <span className="font-bold text-indigo-600">{detail.namaMaterial}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="font-semibold text-gray-600">Surat Jalan:</span>
                                    <span className="font-bold text-gray-900">{detail.suratJalan}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                    <span className="font-semibold text-gray-600">Volume Sistem:</span>
                                    <span className="font-bold text-gray-900">{detail.volume}</span>
                                </div>

                                {detail.statusVerifikasi === "PROSES" ? (
                                    <div className="pt-2">
                                        <label className="text-sm font-semibold text-gray-600 mb-2 block">Real Volume:</label>
                                        <Input
                                            placeholder="Masukkan Real Volume"
                                            value={realVolume}
                                            onChange={(e) => setRealVolume(e.target.value)}
                                            className="border-2 border-blue-300 focus:border-blue-500 rounded-xl"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-semibold text-gray-600">Real Volume:</span>
                                        <span className="font-bold text-gray-900">{detail.realVolume}</span>
                                    </div>
                                )}

                                {rv > 0 && (
                                    <div className="flex justify-between items-center pt-2 bg-white p-4 rounded-xl">
                                        <span className="font-semibold text-gray-600">Selisih:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{selisih}</span>
                                            <span
                                                className={`px-3 py-1 text-xs rounded-full font-bold text-white shadow-lg ${
                                                    sesuai 
                                                        ? "bg-linear-to-r from-green-500 to-green-600" 
                                                        : "bg-linear-to-r from-red-500 to-red-600"
                                                }`}
                                            >
                                                {sesuai ? "SESUAI" : "SELISIH"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                {detail.statusVerifikasi === "PROSES" && (
                                    <Button 
                                        onClick={verifikasi}
                                        className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 rounded-lg transition-all duration-300 hover:scale-105"
                                    >
                                        Verifikasi
                                    </Button>
                                )}

                                <Button 
                                    variant="secondary" 
                                    onClick={() => setOpen(false)}
                                    className="rounded-lg"
                                >
                                    Tutup
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* DIALOG KONFIRMASI VERIFIKASI */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl bg-linear-to-r from-green-600 to-green-700 bg-clip-text text-transparent font-bold">
                            Konfirmasi Verifikasi
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm text-gray-600 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                        Apakah Anda yakin ingin memverifikasi laporan ini?
                        <br />
                        <b className="text-green-700">Status akan berubah menjadi DITERIMA</b> dan tidak bisa diubah kembali.
                    </div>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmOpen(false)}
                            disabled={loadingVerify}
                            className="rounded-lg"
                        >
                            Batal
                        </Button>

                        <Button 
                            onClick={submitVerifikasi} 
                            disabled={loadingVerify}
                            className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 rounded-lg transition-all duration-300 hover:scale-105"
                        >
                            {loadingVerify ? "Memproses..." : "Ya, Verifikasi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG DELETE CONFIRMATION */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl bg-linear-to-r from-red-600 to-red-700 bg-clip-text text-transparent font-bold">
                            Konfirmasi Hapus
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm text-gray-600 bg-red-50 p-4 rounded-xl border-2 border-red-200">
                        Apakah Anda yakin ingin menghapus laporan ini?
                        <br />
                        <b className="text-red-700">Tindakan ini tidak dapat dibatalkan!</b>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteOpen(false)}
                            disabled={loadingDelete}
                            className="rounded-lg"
                        >
                            Batal
                        </Button>

                        <Button 
                            variant="destructive"
                            onClick={submitDelete} 
                            disabled={loadingDelete}
                            className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 rounded-lg transition-all duration-300 hover:scale-105"
                        >
                            {loadingDelete ? "Menghapus..." : "Ya, Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG INFO */}
            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                            Informasi
                        </DialogTitle>
                    </DialogHeader>

                    <div className="text-sm bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                        {infoMessage}
                    </div>

                    <DialogFooter>
                        <Button 
                            onClick={() => setInfoOpen(false)}
                            className="bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/30 rounded-lg transition-all duration-300 hover:scale-105"
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}