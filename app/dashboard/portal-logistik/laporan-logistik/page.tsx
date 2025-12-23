"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  MapPin,
  History,
  CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface StokData {
  id: number;
  nama_item: string;
  lokasi: string;
  qty_total: string;
  tanggal_terakhir: string;
  periode_terakhir: string;
  keterangan_terakhir: string;
  foto_terakhir_1: string;
  foto_terakhir_2: string;
  foto_terakhir_3: string;
  foto_terakhir_4: string;
  foto_terakhir_5: string;
  foto_terakhir_6: string;
  foto_terakhir_7: string;
  foto_terakhir_8: string;
  foto_terakhir_9: string;
  foto_terakhir_10: string;
  created_at: string;
  updated_at: string;
}

interface LokasiData {
  id: number;
  nama_lokasi: string;
}

interface PhotoHistory {
  tanggalPembelian: string;
  foto_1: string;
  foto_2: string;
  foto_3: string;
  foto_4: string;
  foto_5: string;
  foto_6: string;
  foto_7: string;
  foto_8: string;
  foto_9: string;
  foto_10: string;
}

interface PhotoByDate {
  date: string;
  photos: string[];
}

function Page() {
  const router = useRouter();
  const [data, setData] = useState<StokData[]>([]);
  const [lokasiList, setLokasiList] = useState<LokasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lokasi, setLokasi] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<StokData | null>(null);
  const [photoHistory, setPhotoHistory] = useState<PhotoByDate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, search, lokasi, selectedDate]);

  useEffect(() => {
    fetchLokasi();
  }, []);

  const fetchLokasi = async () => {
    try {
      const response = await fetch("/api/logistik/lokasi-logistik");
      const result = await response.json();
      if (result.success) {
        setLokasiList(result.data);
      }
    } catch (error) {
      console.error("Error fetching lokasi:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "5",
        ...(search && { search }),
        ...(lokasi && lokasi !== "all" && { lokasi }),
      });

      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        params.append("tanggal", `${year}-${month}-${day}`);
      }

      const response = await fetch(`/api/logistik/laporan-logistik?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoHistory = async (id: number) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/logistik/laporan-logistik?id=${id}`);
      const result = await response.json();

      if (result.success && result.photoHistory) {
        // Group photos by date
        const groupedPhotos: PhotoByDate[] = result.photoHistory
          .map((history: PhotoHistory) => {
            const photos = [
              history.foto_1,
              history.foto_2,
              history.foto_3,
              history.foto_4,
              history.foto_5,
              history.foto_6,
              history.foto_7,
              history.foto_8,
              history.foto_9,
              history.foto_10,
            ].filter((foto) => foto && foto.trim() !== "");

            return {
              date: history.tanggalPembelian,
              photos: photos,
            };
          })
          .filter((group: PhotoByDate) => group.photos.length > 0);

        setPhotoHistory(groupedPhotos);
      }
    } catch (error) {
      console.error("Error fetching photo history:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getFotos = (item: StokData) => {
    const fotos = [
      item.foto_terakhir_1,
      item.foto_terakhir_2,
      item.foto_terakhir_3,
      item.foto_terakhir_4,
      item.foto_terakhir_5,
      item.foto_terakhir_6,
      item.foto_terakhir_7,
      item.foto_terakhir_8,
      item.foto_terakhir_9,
      item.foto_terakhir_10,
    ].filter((foto) => foto && foto.trim() !== "");

    return fotos;
  };

  const handleViewDetail = async (item: StokData) => {
    setSelectedItem(item);
    setDialogOpen(true);
    await fetchPhotoHistory(item.id);
  };

  const handleViewHistory = (item: StokData) => {
    router.push(
      `/dashboard/portal-logistik/riwayat-penerimaan?namaItem=${encodeURIComponent(
        item.nama_item
      )}&lokasi=${encodeURIComponent(item.lokasi)}`
    );
  };

  return (
    <div className="@container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Laporan Stok Logistik</h1>
        <p className="text-gray-500 mt-2">
          Data stok terbaru per item dan lokasi
        </p>
      </header>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Cari berdasarkan nama item ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2">
                <Select
                  value={lokasi}
                  onValueChange={(value) => {
                    setLokasi(value === "all" ? "" : value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Lokasi</SelectItem>
                    {lokasiList.map((lok) => (
                      <SelectItem key={lok.id} value={lok.nama_lokasi}>
                        {lok.nama_lokasi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? formatDate(selectedDate.toISOString())
                        : "Pilih Tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                        setPage(1);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDate && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedDate(undefined);
                      setPage(1);
                    }}
                  >
                    Reset Tanggal
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6 shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Tidak ada data stok</p>
            </div>
          ) : (
            <>
              <div className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Tanggal Update</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Foto</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      const fotos = getFotos(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.nama_item}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="px-4 py-2">
                              {item.lokasi}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                parseInt(item.qty_total) === 0
                                  ? "destructive"
                                  : "default"
                              }
                              className="px-4 py-2"
                            >
                              {item.qty_total}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.tanggal_terakhir
                              ? formatDate(item.tanggal_terakhir)
                              : "-"}
                          </TableCell>
                          <TableCell>{item.periode_terakhir || "-"}</TableCell>
                          <TableCell>
                            {fotos.length > 0 ? (
                              <Badge variant="secondary" className="px-4 py-2">
                                {fotos.length} foto
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Tidak ada
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetail(item)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewHistory(item)}
                                title="Lihat Riwayat"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-500">
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Stok Logistik</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="h-4 w-4" />
                    <span>Nama Item</span>
                  </div>
                  <p className="font-semibold text-lg">
                    {selectedItem.nama_item}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>Lokasi</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-1 px-4 py-2 rounded-lg"
                  >
                    {selectedItem.lokasi}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Stok Total</p>
                  <p className="font-bold text-2xl">{selectedItem.qty_total}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Tanggal Update Terakhir</span>
                  </div>
                  <p className="font-medium">
                    {selectedItem.tanggal_terakhir
                      ? formatDate(selectedItem.tanggal_terakhir)
                      : "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Periode</p>
                  <p className="font-medium">
                    {selectedItem.periode_terakhir || "-"}
                  </p>
                </div>
              </div>

              {selectedItem.keterangan_terakhir && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">
                    Keterangan Terakhir
                  </p>
                  <p className="text-sm p-3 border rounded-lg">
                    {selectedItem.keterangan_terakhir}
                  </p>
                </div>
              )}

              {/* History Foto per Tanggal */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-500">
                  Riwayat Foto
                </p>

                {loadingDetail ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : photoHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Tidak ada foto</p>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                      {photoHistory.map((group, groupIndex) => (
                        <div key={groupIndex}>
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-base">
                              {formatDate(group.date)}
                            </h3>
                            <Badge variant="secondary" className="ml-2">
                              {group.photos.length} foto
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                            {group.photos.map((foto, fotoIndex) => (
                              <div
                                key={fotoIndex}
                                className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 hover:shadow-lg transition-shadow"
                              >
                                <img
                                  src={`/uploads/logistik/${foto}`}
                                  alt={`Foto ${fotoIndex + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() =>
                                    window.open(
                                      `/uploads/logistik/${foto}`,
                                      "_blank"
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>

                          {groupIndex < photoHistory.length - 1 && (
                            <div className="border-b my-4"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleViewHistory(selectedItem)}
                  className="w-full"
                >
                  <History className="h-4 w-4 mr-2" />
                  Lihat Riwayat Lengkap
                </Button>
              </div>

              <div className="pt-4 border-t text-xs text-gray-400">
                <p>
                  Terakhir diperbarui: {formatDate(selectedItem.updated_at)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;
