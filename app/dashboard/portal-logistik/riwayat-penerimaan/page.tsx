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
import { useState, useEffect } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  MapPin,
  ArrowLeft,
  CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";

interface LogistikData {
  id_penerimaan: number;
  namaItem: string;
  tanggalPembelian: string;
  lokasi: string;
  periode: string;
  qty: string;
  keterangan: string;
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
  created_at: string;
  updated_at: string;
}

interface LokasiData {
  id: number;
  nama_lokasi: string;
}

function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<LogistikData[]>([]);
  const [lokasiList, setLokasiList] = useState<LokasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lokasi, setLokasi] = useState(searchParams.get("lokasi") || "all");
  const [namaItem, setNamaItem] = useState(searchParams.get("namaItem") || "");
  const [tanggal, setTanggal] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<LogistikData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tanggalOpen, setTanggalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, search, lokasi, namaItem, tanggal]);

  useEffect(() => {
    fetchLokasi();
  }, []);

  const fetchLokasi = async () => {
    try {
      const response = await fetch(
        "/api/logistik/penerimaan-logistik?type=lokasi"
      );
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
        ...(namaItem && { namaItem }),
      });

      // Format tanggal tanpa timezone issue
      if (tanggal) {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');
        const day = String(tanggal.getDate()).padStart(2, '0');
        params.append('tanggal', `${year}-${month}-${day}`);
      }

      const response = await fetch(`/api/logistik/riwayat-penerimaan?${params}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleClearFilter = () => {
    setSearch("");
    setLokasi("all");
    setNamaItem("");
    setTanggal(undefined);
    setPage(1);
    router.push("/dashboard/portal-logistik/riwayat-penerimaan");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getFotos = (item: LogistikData) => {
    const fotos = [
      item.foto_1,
      item.foto_2,
      item.foto_3,
      item.foto_4,
      item.foto_5,
      item.foto_6,
      item.foto_7,
      item.foto_8,
      item.foto_9,
      item.foto_10,
    ].filter((foto) => foto && foto.trim() !== "");

    return fotos;
  };

  const handleViewDetail = (item: LogistikData) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const isFiltered = searchParams.get("namaItem") || searchParams.get("lokasi");

  return (
    <div className="@container mx-auto p-4">
      <header className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          )}
        </div>
        <h1 className="text-3xl font-bold">Riwayat Penerimaan Logistik</h1>
        <p className="text-gray-500 mt-2">
          Histori lengkap semua penerimaan barang logistik
        </p>
        {isFiltered && (
          <div className="mt-4 flex gap-2">
            {searchParams.get("namaItem") && (
              <Badge variant="outline" className="px-4 py-2">
                Item: {searchParams.get("namaItem")}
              </Badge>
            )}
            {searchParams.get("lokasi") && (
              <Badge variant="outline" className="px-4 py-2">
                Lokasi: {searchParams.get("lokasi")}
              </Badge>
            )}
          </div>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Filter Data</span>
            {(search || lokasi !== "all" || namaItem || tanggal) && (
              <Button
                variant="outline"
                onClick={handleClearFilter}
              >
                Reset Filter
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Cari nama item atau keterangan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              <div className="space-y-2">
                <Select
                  value={lokasi}
                  onValueChange={(value) => {
                    setLokasi(value);
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
                <Popover open={tanggalOpen} onOpenChange={setTanggalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tanggal ? formatDate(tanggal.toISOString()) : "Pilih Tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={tanggal}
                      onSelect={(date) => {
                        setTanggal(date);
                        setTanggalOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Tidak ada data riwayat penerimaan</p>
            </div>
          ) : (
            <>
              <div className="p-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Foto</TableHead>
                      <TableHead className="text-center">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      const fotos = getFotos(item);
                      return (
                        <TableRow key={item.id_penerimaan}>
                          <TableCell className="font-medium">
                            {item.namaItem}
                          </TableCell>
                          <TableCell>
                            {formatDate(item.tanggalPembelian)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="px-4 py-2">
                              {item.lokasi}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.periode || "-"}</TableCell>
                          <TableCell>
                            <Badge className="px-4 py-2">{item.qty}</Badge>
                          </TableCell>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
        <DialogContent className="sm:max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Penerimaan Logistik</DialogTitle>
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
                    {selectedItem.namaItem}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Tanggal Pembelian</span>
                  </div>
                  <p className="font-medium">
                    {formatDate(selectedItem.tanggalPembelian)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>Lokasi</span>
                  </div>
                  <Badge variant="outline" className="mt-1 px-4 py-2 rounded-lg">
                    {selectedItem.lokasi}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Periode</p>
                  <p className="font-medium">{selectedItem.periode || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Jumlah</p>
                  <p className="font-bold text-xl">{selectedItem.qty}</p>
                </div>
              </div>

              {selectedItem.keterangan && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">
                    Keterangan
                  </p>
                  <p className="text-sm p-3 border rounded-lg">
                    {selectedItem.keterangan}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-500">
                  Foto ({getFotos(selectedItem).length})
                </p>
                {getFotos(selectedItem).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getFotos(selectedItem).map((foto, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100"
                      >
                        <img
                          src={`/uploads/logistik/${foto}`}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() =>
                            window.open(`/uploads/logistik/${foto}`, "_blank")
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tidak ada foto</p>
                )}
              </div>

              <div className="pt-4 border-t text-xs text-gray-400">
                <p>Dibuat: {formatDate(selectedItem.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;