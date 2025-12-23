import { FaPlay } from "react-icons/fa";
import Image from "next/image";

function MediaInformasi() {
  const items = [
    {
      image: "/video-dummy.mp4",
      title: "Inovasi Tanpa Batas",
      type: "video",
    },
    {
      image:
        "https://www.instagram.com/reel/DRD45aBk9A5/?igsh=MWVyOWZ6enBqZGh2ZQ==",
      title: "Yamaha Semakin Di Depan",
    },
    {
      image:
        "https://www.instagram.com/reel/DQLxp98k5yH/?igsh=dnlteWx1a2tqM2x3",
      title: "Langkah Menuju Performa",
    },
    {
      image:
        "https://www.instagram.com/reel/DP8S6kMCatn/?igsh=dmFiN2Y3cWNydjU0",
      title: "Bersama Membangun Negeri",
    },
  ];

  // Data list samping seperti di Figma
  const sideList = [
    {
      image: "/images/section.svg",
      category: "Blog",
      title: "Bagaimana Putra Utama Group Membangun Ekosistem Bisnis ...",
      date: "28 November 2025",
    },
    {
      image: "/images/section2.svg",
      category: "News",
      title: "Transformasi Digital: Langkah Nyata Putra Utama Menuju ...",
      date: "19 Desember 2025",
    },
    {
      image: "/images/section3.svg",
      category: "Blog",
      title: "Putra Utama Group Meresmikan Ekspansi Baru untuk Memperkuat ...",
      date: "25 Oktober 2025",
    },
    {
      image: "/images/blog1.svg",
      category: "Blog",
      title: "Sinergi dan Pertumbuhan: Putra Utama Group Dorong ...",
      date: "30 Desember 2025",
    },
  ];

  return (
    <div className="w-full bg-white">
      {/* ============================= */}
      {/* HERO / SLIDER */}
      {/* ============================= */}
      <div className="h-screen w-full flex flex-col">
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 transition-opacity duration-1000">
            <Image
              src="/images/blog1.svg"
              alt="Blog 1"
              fill
              className="object-cover h-full w-full"
            />

            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/60" />

            <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-[70px] mb-24">
              <p className="text-2xl md:text-5xl max-w-4xl leading-normal font-semibold text-white mb-4 animate-fade-in">
                Putra Utama Group Gelar Aksi Sosial “Bersama untuk Sesama”
              </p>
              <div className="grid md:grid-cols-2">
                <div>
                  <p className="text-white mb-4 max-w-xl">
                    Lorem ipsum dolor sit amet consectetur. Amet mus diam nisl
                    augue in mattis pulvinar etiam. Odio eros id elit
                    pellentesque hac.
                  </p>
                  <p className="text-white">10 November 2025</p>
                </div>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* SECTION TITLE */}
      {/* ============================= */}
      <div className="px-6 sm:px-[70px] pt-16 mb-10">
        <h2 className="text-3xl md:text-4xl font-semibold mb-2">
          Informasi Video
        </h2>
        <p className="text-gray-500 max-w-2xl">
          Lorem ipsum dolor sit amet consectetur. Orci at mattis amet vivamus
          augue auctor porttitor adipiscing turpis.
        </p>
      </div>

      {/* ============================= */}
      {/* VIDEO GRID */}
      {/* ============================= */}
      <div className="px-6 sm:px-[70px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative h-[260px] rounded-lg overflow-hidden group cursor-pointer"
          >
            {item.type === "image" ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={item.image}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300"></div>

            <div className="absolute inset-0 flex justify-center items-center">
              <div className="bg-white/40 hover:bg-white/80 p-4 rounded-full transition-all">
                <FaPlay className="text-white text-sm" />
              </div>
            </div>

            <div className="absolute bottom-0 p-4">
              <p className="text-white text-lg font-semibold drop-shadow-md">
                {item.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ============================= */}
      {/* LAYOUT SEPERTI FIGMA */}
      {/* ============================= */}
      <div className="px-6 sm:px-[70px] grid grid-cols-1 lg:grid-cols-3 gap-10 pb-28">
        {/* LEFT CONTENT */}
        <div className="col-span-2">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80"
            className="w-full h-[420px] object-cover rounded-lg"
          />

          <p className="text-gray-500 text-sm mt-4">News</p>

          <h2 className="text-2xl md:text-3xl font-semibold mt-2">
            Manggala Putra Utama Dukung Proyek Infrastruktur di Sukoharjo
          </h2>

          <p className="text-gray-400 text-sm mt-1">28 November 2025</p>

          <p className="text-gray-500 mt-4 leading-relaxed">
            Lorem ipsum dolor sit amet consectetur. In nibh luctus vestibulum id
            cras lobortis massa ipsum. Nulla ultrices rutrum diam ut a nibh
            turpis vulputate. Justo rhoncus nisi urna metus.
          </p>

          <button className="mt-6 px-6 py-2 border rounded-full hover:bg-gray-100 transition-all">
            Selengkapnya
          </button>
        </div>

        {/* RIGHT SIDE LIST */}
        <div className="border-l pl-8 space-y-8">
          {sideList.map((item, i) => (
            <div key={i} className="flex gap-4 pb-6 border-b">
              <img
                src={item.image}
                className="w-[120px] h-30 object-cover rounded-md"
              />

              <div className="flex-1">
                <p className="text-gray-500 text-sm">{item.category}</p>
                <h4 className="font-medium text-sm leading-tight mt-1">
                  {item.title}
                </h4>
                <p className="text-gray-400 text-xs mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MediaInformasi;
