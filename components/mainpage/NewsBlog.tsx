import Link from "next/link";

function NewsBlog() {
  // Dummy data untuk blog posts
  const blogPosts = [
    {
      id: 1,
      type: "BLOG",
      title: "Manggala Putra Utama Dukung Proyek Infrastruktur di Sukoharjo",
      date: "06 November 2025",
      linear: "from-blue-600 via-indigo-700 to-blue-900"
    },
    {
      id: 2,
      type: "NEWS",
      title: "Ekspansi Bisnis Putra Utama Group ke Wilayah Jawa Tengah",
      date: "15 Oktober 2025",
      linear: "from-purple-600 via-violet-700 to-purple-900"
    },
    {
      id: 3,
      type: "BLOG",
      title: "Komitmen CSR: Program Pendidikan untuk Masyarakat Sekitar",
      date: "22 September 2025",
      linear: "from-indigo-600 via-blue-700 to-indigo-900"
    }
  ];

  return (
    <>
      <div className="py-16 sm:py-24 mx-auto px-6 lg:px-[70px]">
        <div className="flex flex-col lg:flex-row mb-16 gap-12">
          <div className="flex-[0.8]">
            <p className="text-xs tracking-wide uppercase font-semibold mb-2">
              Media Informasi
            </p>
            <p className="text-3xl lg:text-3xl max-w-2xl font-bold leading-snug">
              Putra Utama Blog & News
            </p>
          </div>

          <div className="flex-1 lg:flex-1">
            <p className="text-base leading-relaxed text-justify">
              Media Informasi Putra Utama Group menjadi pusat berita dan
              publikasi resmi perusahaan. Di sini kami membagikan berbagai
              informasi terkini seputar kegiatan bisnis, inovasi, tanggung jawab
              sosial.
            </p>
          </div>

          <div className="flex-[0.3] flex justify-end">
            <Link
              href="#"
              className="group inline-flex text-sm font-medium items-center self-start gap-2 px-6 py-3 rounded-full border border-black text-black 
             hover:bg-yellow-500 hover:text-black transition-all duration-300"
            >
              Selengkapnya
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
                className="transition-colors duration-300 group-hover:text-black"
              >
                <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4">
          {/* Big Card */}
          <div className="w-full h-full md:row-span-2 rounded-xl overflow-hidden shadow-md relative group cursor-pointer">
            {/* Linear Background */}
            <div className={`absolute inset-0 bg-linear-to-br ${blogPosts[0].linear}`} />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Icon/Logo Placeholder - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/30 group-hover:text-white/40 transition-colors duration-300">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="drop-shadow-lg"
                >
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <p className="text-sm uppercase mb-4 font-semibold tracking-wider">
                {blogPosts[0].type}
              </p>
              <p className="text-[32px] font-semibold leading-10 mb-4">
                {blogPosts[0].title}
              </p>
              <p className="text-xs opacity-80 mt-1">{blogPosts[0].date}</p>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Small top right */}
          <div className="w-full h-80 lg:h-[350px] rounded-xl overflow-hidden shadow-md relative group cursor-pointer">
            {/* Linear Background */}
            <div className={`absolute inset-0 bg-linear-to-br ${blogPosts[1].linear}`} />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Icon/Logo Placeholder - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/30 group-hover:text-white/40 transition-colors duration-300">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="drop-shadow-lg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <p className="text-sm uppercase mb-4 font-semibold tracking-wider">
                {blogPosts[1].type}
              </p>
              <p className="text-2xl font-semibold leading-8 mb-4">
                {blogPosts[1].title}
              </p>
              <p className="text-xs opacity-80 mt-1">{blogPosts[1].date}</p>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Small bottom right */}
          <div className="w-full h-80 lg:h-[350px] rounded-xl overflow-hidden shadow-md relative group cursor-pointer">
            {/* Linear Background */}
            <div className={`absolute inset-0 bg-linear-to-br ${blogPosts[2].linear}`} />

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Icon/Logo Placeholder - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/30 group-hover:text-white/40 transition-colors duration-300">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="drop-shadow-lg"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <p className="text-sm uppercase mb-4 font-semibold tracking-wider">
                {blogPosts[2].type}
              </p>
              <p className="text-2xl font-semibold leading-8 mb-4">
                {blogPosts[2].title}
              </p>
              <p className="text-xs opacity-80 mt-1">{blogPosts[2].date}</p>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        </div>
      </div>
    </>
  );
}

export default NewsBlog;