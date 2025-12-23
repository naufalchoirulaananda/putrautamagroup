import Link from "next/link";

function AfterHeroSection() {
  return (
    <>
      <section className="w-full bg-white py-16 sm:py-32">
        <div className="mx-auto px-6 lg:px-[70px] grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Placeholder dengan Gradient & Icon */}
          <div className="w-full h-80 lg:h-[350px] rounded-xl overflow-hidden shadow-md relative group">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-700 to-blue-900" />

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
                {/* Building/Company Icon */}
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

            {/* Subtle Text Overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm font-medium">
                Putra Utama Group
              </p>
              <p className="text-white/70 text-xs">Bertumbuh & Menginspirasi</p>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <p className="text-xs tracking-wide text-[#0b2f9f] uppercase font-semibold mb-3">
              Bertumbuh & Menginspirasi
            </p>

            <p className="text-3xl lg:text-3xl font-bold text-gray-900 leading-snug mb-4">
              Berkarya dan Bertumbuh untuk Kemajuan Perusahaan
            </p>

            <p className="text-[#374151] text-base leading-relaxed mb-6 text-justify">
              Putra Utama Group terus memperkuat perannya di berbagai sektor
              dari otomotif, pertambangan, hingga rental. Dengan semangat
              inovasi dan kebersamaan, kami berkomitmen menghadirkan layanan
              terbaik yang memberi manfaat bagi masyarakat dan kemajuan ekonomi
              daerah.
            </p>

            {/* Button */}
            <Link
              href="#"
              className="inline-flex text-sm font-medium items-center self-start gap-2 px-6 py-3 rounded-full border border-[#475569] hover:bg-gray-100 transition-all duration-300 text-[#475569]"
            >
              Selengkapnya
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="#475569"
                viewBox="0 0 256 256"
              >
                <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default AfterHeroSection;
