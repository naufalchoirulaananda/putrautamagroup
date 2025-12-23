"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  Upload,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type Definitions
interface HeaderData {
  id: number | null;
  title: string;
  description: string;
  background_image: string;
  is_active: boolean;
}

interface Tab {
  id: number | null;
  slug: string;
  title: string;
  sort_order: number;
  is_active: boolean;
}

interface Section {
  id: number | null;
  tab_id: number | null;
  section_type:
    | "heading"
    | "text"
    | "image"
    | "list"
    | "two-column"
    | "two-column-separator"
    | "separator";
  title: string;
  content: string;
  image: string;
  image_size?: "small" | "medium" | "large" | "full";
  sort_order: number;
}

interface Message {
  type: "success" | "error" | "";
  text: string;
}

export default function AboutPageAdmin() {
  const [activeTab, setActiveTab] = useState<string>("header");
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: "", text: "" });

  // Header State
  const [header, setHeader] = useState<HeaderData>({
    id: null,
    title: "",
    description: "",
    background_image: "",
    is_active: true,
  });

  // Tabs State
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [editingTab, setEditingTab] = useState<Tab | null>(null);

  // Sections State
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load header
      const headerRes = await fetch("/api/about/header");
      const headerData = await headerRes.json();
      if (headerData.success && headerData.data) {
        setHeader(headerData.data);
      }

      // Load tabs
      const tabsRes = await fetch("/api/about/tabs");
      const tabsData = await tabsRes.json();
      if (tabsData.success) {
        setTabs(tabsData.data);
        if (tabsData.data.length > 0) {
          setSelectedTabId(tabsData.data[0].id);
          loadSections(tabsData.data[0].id);
        }
      }
    } catch (error) {
      showMessage("error", "Gagal memuat data");
    }
    setLoading(false);
  };

  const loadSections = async (tabId: number) => {
    try {
      const res = await fetch(`/api/about/sections?tab_id=${tabId}`);
      const data = await res.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      showMessage("error", "Gagal memuat sections");
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // File Upload Handler
  const handleFileUpload = async (
    file: File,
    folder: string = "tentang-perusahaan"
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/about/upload", {
        // ✅ Sudah benar
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("Upload response:", data); // Debug

      if (data.success) {
        showMessage("success", "File berhasil diupload");

        // Test apakah file bisa diakses
        const testImg = new Image();
        testImg.onload = () =>
          console.log("✅ File accessible:", data.filepath);
        testImg.onerror = () =>
          console.error("❌ File NOT accessible:", data.filepath);
        testImg.src = data.filepath;

        return data.filepath;
      } else {
        showMessage("error", data.message);
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      showMessage("error", "Gagal mengupload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Header Functions
  const handleHeaderImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filepath = await handleFileUpload(file, "tentang-perusahaan/header");
    if (filepath) {
      setHeader({ ...header, background_image: filepath });
    }
  };

  const saveHeader = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/about/header", {
        method: header.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(header),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Header berhasil disimpan");
        loadData();
      } else {
        showMessage("error", data.message);
      }
    } catch (error) {
      showMessage("error", "Gagal menyimpan header");
    }
    setLoading(false);
  };

  // Tab Functions
  const saveTab = async (tab: Tab) => {
    setLoading(true);
    try {
      const res = await fetch("/api/about/tabs", {
        method: tab.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tab),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Tab berhasil disimpan");
        setEditingTab(null);
        loadData();
      } else {
        showMessage("error", data.message);
      }
    } catch (error) {
      showMessage("error", "Gagal menyimpan tab");
    }
    setLoading(false);
  };

  const deleteTab = async (id: number) => {
    if (!confirm("Yakin ingin menghapus tab ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/about/tabs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Tab berhasil dihapus");
        loadData();
      } else {
        showMessage("error", data.message);
      }
    } catch (error) {
      showMessage("error", "Gagal menghapus tab");
    }
    setLoading(false);
  };

  // Section Functions
  const handleSectionImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    console.log("🎯 Section image upload triggered");
    console.log("File:", file?.name, file?.size);
    console.log("Current editingSection:", editingSection);

    if (!file) {
      console.warn("❌ No file selected");
      return;
    }

    if (!editingSection) {
      console.error("❌ No editingSection state");
      showMessage("error", "Error: Section tidak ditemukan");
      return;
    }

    console.log("📤 Starting upload...");
    const filepath = await handleFileUpload(
      file,
      "tentang-perusahaan/sections"
    );

    console.log("📥 Upload result:", filepath);

    if (filepath) {
      console.log("✅ Setting image to editingSection");
      setEditingSection({ ...editingSection, image: filepath });
      showMessage("success", `File berhasil diupload: ${filepath}`);
    } else {
      console.error("❌ Upload failed, no filepath returned");
    }
  };

  const saveSection = async (section: Section) => {
    setLoading(true);
    try {
      const res = await fetch("/api/about/sections", {
        method: section.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Section berhasil disimpan");
        setEditingSection(null);
        if (selectedTabId) {
          loadSections(selectedTabId);
        }
      } else {
        showMessage("error", data.message);
      }
    } catch (error) {
      showMessage("error", "Gagal menyimpan section");
    }
    setLoading(false);
  };

  const deleteSection = async (id: number) => {
    if (!confirm("Yakin ingin menghapus section ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/about/sections?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMessage("success", "Section berhasil dihapus");
        if (selectedTabId) {
          loadSections(selectedTabId);
        }
      } else {
        showMessage("error", data.message);
      }
    } catch (error) {
      showMessage("error", "Gagal menghapus section");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Tentang Perusahaan
        </h1>
        <p className="text-gray-600 mt-2">
          Kelola dan perbarui seluruh konten Tentang Perusahaan secara
          menyeluruh
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <Button
          variant={"outline"}
          onClick={() => setActiveTab("header")}
          className={`px-4 py-2 font-medium ${
            activeTab === "header"
              ? "border-b-2 text-gray-950"
              : "text-gray-600"
          }`}
        >
          Kelola Header
        </Button>
        <Button
          variant={"outline"}
          onClick={() => setActiveTab("tabs")}
          className={`px-4 py-2 font-medium mb-4 ${
            activeTab === "tabs" ? "border-b-2 text-gray-950" : "text-gray-600"
          }`}
        >
          Kelola Tabs
        </Button>
        <Button
          variant={"outline"}
          onClick={() => setActiveTab("sections")}
          className={`px-4 py-2 font-medium ${
            activeTab === "sections"
              ? "border-b-2 text-gray-950"
              : "text-gray-600"
          }`}
        >
          Kelola Konten
        </Button>
      </div>

      {/* Header Section */}
      {activeTab === "header" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Page Header</h2>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">Judul</Label>
              <Input
                type="text"
                value={header.title}
                onChange={(e) =>
                  setHeader({ ...header, title: e.target.value })
                }
                className="text-sm"
                placeholder="Tentang Perusahaan"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">
                Deskripsi
              </Label>
              <Textarea
                value={header.description}
                onChange={(e) =>
                  setHeader({ ...header, description: e.target.value })
                }
                className="text-sm"
                rows={3}
                placeholder="Deskripsi halaman..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Background Image
              </label>
              {header.background_image && (
                <div className="mb-3 relative w-full h-48 border rounded-lg overflow-hidden">
                  <img
                    src={header.background_image}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageUpload}
                  disabled={uploading}
                  className="w-full cursor-pointer text-sm"
                />

                {/* {header.background_image && (
                  <span className="text-sm text-gray-600">
                    {header.background_image}
                  </span>
                )} */}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload gambar untuk background header (Rekomendasi: 1920x450px)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="checkbox"
                checked={header.is_active}
                onChange={(e) =>
                  setHeader({ ...header, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded-lg"
              />
              <label className="text-sm font-medium">Aktif</label>
            </div>
            <Button
              onClick={saveHeader}
              disabled={loading || uploading}
              className="px-4 py-2 rounded-lg"
              variant={"default"}
            >
              {loading ? "Menyimpan..." : "Simpan Header"}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs Section */}
      {activeTab === "tabs" && (
        <div className="bg-white rounded-lg shadow-none p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Kelola Tabs</h2>
            <Button
              onClick={() =>
                setEditingTab({
                  id: null,
                  slug: "",
                  title: "",
                  sort_order: tabs.length,
                  is_active: true,
                })
              }
              className="px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Tab
            </Button>
          </div>

          {editingTab && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">
                {editingTab.id ? "Edit Tab" : "Tambah Tab Baru"}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">Slug</Label>
                  <input
                    type="text"
                    value={editingTab.slug}
                    onChange={(e) =>
                      setEditingTab({ ...editingTab, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    placeholder="profil-perusahaan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Judul
                  </label>
                  <input
                    type="text"
                    value={editingTab.title}
                    onChange={(e) =>
                      setEditingTab({ ...editingTab, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    placeholder="Profil Perusahaan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={editingTab.sort_order}
                    onChange={(e) =>
                      setEditingTab({
                        ...editingTab,
                        sort_order: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="checkbox"
                    checked={editingTab.is_active}
                    onChange={(e) =>
                      setEditingTab({
                        ...editingTab,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Aktif</label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant={"default"}
                  onClick={() => saveTab(editingTab)}
                  className="px-4 py-2 rounded-lg"
                >
                  Simpan
                </Button>
                <Button
                  variant={"destructive"}
                  onClick={() => setEditingTab(null)}
                  className="px-4 py-2 rounded-lg"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-gray-400" />
                  <div>
                    <div className=" font-semibold text-sm">{tab.title}</div>
                    <div className="text-sm text-gray-500">
                      Slug: {tab.slug}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={"outline"}
                    onClick={() => setEditingTab(tab)}
                    className="cursor-pointer"
                  >
                    <Edit2 size={8} />
                  </Button>
                  <Button
                    variant={"destructive"}
                    onClick={() => tab.id && deleteTab(tab.id)}
                    className="cursor-pointer"
                  >
                    <Trash2 size={8} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections Section */}
      {activeTab === "sections" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <Label className="block text-sm font-medium mb-2">Pilih Tab</Label>

            <Select
              value={selectedTabId ? String(selectedTabId) : ""}
              onValueChange={(value) => {
                const tabId = Number(value);
                setSelectedTabId(tabId);
                loadSections(tabId);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Tab" />
              </SelectTrigger>

              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab.id} value={String(tab.id)}>
                    {tab.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTabId && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Kelola Sections</h2>
                <Button
                  onClick={() =>
                    setEditingSection({
                      id: null,
                      tab_id: selectedTabId,
                      section_type: "text",
                      title: "",
                      content: "",
                      image: "",
                      sort_order: sections.length,
                    })
                  }
                  className="px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Plus size={16} /> Tambah Section
                </Button>
              </div>

              {editingSection && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-medium mb-3">
                    {editingSection.id ? "Edit Section" : "Tambah Section Baru"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Tipe Section
                      </Label>
                      <Select
                        value={editingSection.section_type}
                        onValueChange={(value) =>
                          setEditingSection({
                            ...editingSection,
                            section_type: value as
                              | "heading"
                              | "text"
                              | "image"
                              | "list"
                              | "two-column"
                              | "separator",
                          })
                        }
                      >
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Pilih tipe section" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="heading">Heading</SelectItem>
                          <SelectItem value="text">Text (WYSIWYG)</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="list">List (WYSIWYG)</SelectItem>
                          <SelectItem value="two-column">
                            Two Column Layout
                          </SelectItem>
                          <SelectItem value="two-column-separator">
                            Two Column with Separator
                          </SelectItem>
                          <SelectItem value="separator">
                            Separator / Divider
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Heading Type */}
                    {editingSection.section_type === "heading" && (
                      <div>
                        <Label className="block text-sm font-medium mb-2">
                          Judul
                        </Label>
                        <Input
                          type="text"
                          value={editingSection.title || ""}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              title: e.target.value,
                            })
                          }
                          placeholder="Masukkan judul..."
                          className="w-full px-3 py-2 bg-white border rounded-lg"
                        />
                      </div>
                    )}

                    {/* WYSIWYG Editor untuk Text dan List */}
                    {(editingSection.section_type === "text" ||
                      editingSection.section_type === "list") && (
                      <>
                        <div>
                          <Label className="block text-sm font-medium mb-2">
                            Judul (Opsional)
                          </Label>
                          <Input
                            type="text"
                            value={editingSection.title || ""}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-white border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Konten
                          </label>
                          <RichTextEditor
                            value={editingSection.content || ""}
                            onChange={(value) =>
                              setEditingSection({
                                ...editingSection,
                                content: value,
                              })
                            }
                            placeholder={
                              editingSection.section_type === "list"
                                ? "Buat daftar dengan bullet points atau numbering..."
                                : "Tulis konten di sini..."
                            }
                          />
                          {editingSection.section_type === "list" && (
                            <p className="text-xs text-gray-500 mt-1">
                              Gunakan toolbar untuk membuat bullet list atau
                              numbered list
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Two Column Layout */}
                    {editingSection.section_type === "two-column" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Kolom Kiri (Title/Label)
                          </label>
                          <input
                            type="text"
                            value={editingSection.title || ""}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            placeholder="Contoh: Perisai Biru (Perlindungan & Kepercayaan)"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Teks ini akan muncul di kolom kiri dengan font tebal
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Kolom Kanan (Content)
                          </label>
                          <RichTextEditor
                            value={editingSection.content || ""}
                            onChange={(value) =>
                              setEditingSection({
                                ...editingSection,
                                content: value,
                              })
                            }
                            placeholder="Tulis konten untuk kolom kanan..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Konten ini akan muncul di kolom kanan
                          </p>
                        </div>
                      </>
                    )}

                    {/* Separator Type - No input needed */}
                    {editingSection.section_type === "separator" && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ℹ️ Separator akan otomatis menampilkan garis pemisah
                          horizontal. Tidak perlu mengisi konten apapun.
                        </p>
                      </div>
                    )}

                    {editingSection.section_type === "two-column-separator" && (
                      <>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <p className="text-sm text-blue-800">
                            ℹ️ Layout ini akan membuat 2 kolom dengan separator
                            di kolom kanan
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Kolom Kiri (Title/Label)
                          </label>
                          <input
                            type="text"
                            value={editingSection.title || ""}
                            onChange={(e) =>
                              setEditingSection({
                                ...editingSection,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                            placeholder="Contoh: Label atau judul"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Teks ini akan muncul di kolom kiri dengan font tebal
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Kolom Kanan (akan menampilkan separator)
                          </label>
                          <div className="w-full px-3 py-4 border rounded-lg bg-gray-100 flex items-center justify-center">
                            <hr className="w-full border-t-2 border-gray-300" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Kolom kanan akan otomatis menampilkan garis
                            separator horizontal
                          </p>
                        </div>
                      </>
                    )}

                    {/* Image Type */}
                    {editingSection.section_type === "image" && (
                      <div>
                        <Label className="block text-sm font-medium mb-2">
                          Judul (Opsional)
                        </Label>
                        <Input
                          type="text"
                          value={editingSection.title || ""}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              title: e.target.value,
                            })
                          }
                          placeholder="Masukkan judul gambar..."
                          className="w-full px-3 bg-white text-sm py-2 border rounded-lg"
                        />
                        <label className="block text-sm font-medium mb-2 mt-4">
                          Image
                        </label>
                        {editingSection.image && (
                          <div className="mb-3 relative w-full h-48 border rounded-lg overflow-hidden">
                            <img
                              src={editingSection.image}
                              alt="Section preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleSectionImageUpload}
                            disabled={uploading}
                          />

                          {uploading && (
                            <span className="text-sm text-gray-500">
                              Uploading...
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="block text-sm font-medium mb-2">
                        Urutan
                      </Label>
                      <Input
                        type="number"
                        value={editingSection.sort_order}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            sort_order: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-white border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={"default"}
                      onClick={() => saveSection(editingSection)}
                      disabled={uploading || loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Simpan
                    </Button>

                    <Button
                      variant={"destructive"}
                      onClick={() => setEditingSection(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-gray-400" />
                      <div>
                        <div className="font-semibold text-sm">
                          {section.title || `Section ${section.section_type}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          Type: {section.section_type}
                        </div>
                        {section.image && (
                          <div className="text-xs text-blue-600 mt-1">
                            Terdapat gambar aktif.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={"outline"}
                        onClick={() => setEditingSection(section)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant={"destructive"}
                        onClick={() => section.id && deleteSection(section.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
