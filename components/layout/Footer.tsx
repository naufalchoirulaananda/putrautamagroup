import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#f2f2f6]">
      <div className="mx-auto pt-16 px-6 lg:px-[70px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-24">
          <div className="mb-6 md:mb-0">
            <a href="https://flowbite.com" className="flex items-center">
              <span className="self-center mb-6 text-xl font-semibold whitespace-nowrap">
                Putra Utama Group
              </span>
            </a>

            <p className="text-base text-justify mb-4 max-w-2xl text-gray-600">
              Putra Utama Group adalah kelompok usaha yang bergerak di berbagai
              sektor strategis, meliputi otomotif, pertambangan, retail, dan
              distribusi energi. Berdiri sejak tahun 1995 di Sukoharjo, Jawa
              Tengah, Putra Utama Group tumbuh dari satu unit usaha menjadi
              jaringan bisnis terpadu yang melayani kebutuhan masyarakat secara
              luas.
            </p>

            <p className="text-base text-justify max-w-2xl text-gray-600">
              Didukung oleh semangat inovasi dan nilai kebersamaan, Putra Utama
              Group berkomitmen untuk memberikan kontribusi nyata bagi
              pembangunan ekonomi daerah dan kesejahteraan masyarakat.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase">Email</p>
              <p className="text-gray-600">putrautamagroup@gmail.com</p>
            </div>

            <div className="ml-0 sm:ml-16">
              <p className="mb-2 text-sm font-semibold uppercase">Phone</p>
              <p className="text-gray-600">(+) 62 8581 1024 100</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold uppercase">
                Alamat Head Office
              </p>
              <p className="text-gray-600">
                Jl. Raya Nguter, Dusun II, Gupit, Kecamatan Nguter, Kabupaten
                Sukoharjo 57571
              </p>
            </div>
          </div>
        </div>

        <hr className="my-12 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-24">
          <div className="mb-6 md:mb-0">
            <a href="https://flowbite.com" className="flex items-center">
              <span className="mb-6 text-xl font-semibold">
                Dapatkan kabar terkini tentang kami melalui kanal media sosial
                Putra Utama Group
              </span>
            </a>
            <div>
              <p>Visit on: </p>
              <div className="flex flex-row gap-4 w-fit mt-4">
                <Link
                  href={"https://www.instagram.com/putrautamaheadoffice/"}
                  className="border border-black px-2 py-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="#000000"
                    viewBox="0 0 256 256"
                  >
                    <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                  </svg>
                </Link>
                <Link
                  href={"/"}
                  className="border border-black px-2 py-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="#000000"
                    viewBox="0 0 256 256"
                  >
                    <path d="M224,72a48.05,48.05,0,0,1-48-48,8,8,0,0,0-8-8H128a8,8,0,0,0-8,8V156a20,20,0,1,1-28.57-18.08A8,8,0,0,0,96,130.69V88a8,8,0,0,0-9.4-7.88C50.91,86.48,24,119.1,24,156a76,76,0,0,0,152,0V116.29A103.25,103.25,0,0,0,224,128a8,8,0,0,0,8-8V80A8,8,0,0,0,224,72Zm-8,39.64a87.19,87.19,0,0,1-43.33-16.15A8,8,0,0,0,160,102v54a60,60,0,0,1-120,0c0-25.9,16.64-49.13,40-57.6v27.67A36,36,0,1,0,136,156V32h24.5A64.14,64.14,0,0,0,216,87.5Z"></path>
                  </svg>
                </Link>
                <Link
                  href={"/"}
                  className="border border-black px-2 py-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="#000000"
                    viewBox="0 0 256 256"
                  >
                    <path d="M164.44,121.34l-48-32A8,8,0,0,0,104,96v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,145.05V111l25.58,17ZM234.33,69.52a24,24,0,0,0-14.49-16.4C185.56,39.88,131,40,128,40s-57.56-.12-91.84,13.12a24,24,0,0,0-14.49,16.4C19.08,79.5,16,97.74,16,128s3.08,48.5,5.67,58.48a24,24,0,0,0,14.49,16.41C69,215.56,120.4,216,127.34,216h1.32c6.94,0,58.37-.44,91.18-13.11a24,24,0,0,0,14.49-16.41c2.59-10,5.67-28.22,5.67-58.48S236.92,79.5,234.33,69.52Zm-15.49,113a8,8,0,0,1-4.77,5.49c-31.65,12.22-85.48,12-86,12H128c-.54,0-54.33.2-86-12a8,8,0,0,1-4.77-5.49C34.8,173.39,32,156.57,32,128s2.8-45.39,5.16-54.47A8,8,0,0,1,41.93,68c30.52-11.79,81.66-12,85.85-12h.27c.54,0,54.38-.18,86,12a8,8,0,0,1,4.77,5.49C221.2,82.61,224,99.43,224,128S221.2,173.39,218.84,182.47Z"></path>
                  </svg>
                </Link>
                <Link
                  href={"/"}
                  className="border border-black px-2 py-2 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="#000000"
                    viewBox="0 0 256 256"
                  >
                    <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-2 sm:grid-cols-3">
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Company
              </h2>
              <ul className="text-gray-600">
                <li className="mb-4">
                  <a href="https://flowbite.com" className="hover:underline">
                    Tentang Kami
                  </a>
                </li>
                <li className="mb-4">
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:underline"
                  >
                    Bisnis Kami
                  </a>
                </li>
                <li className="mb-4">
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:underline"
                  >
                    Media Informasi
                  </a>
                </li>
                <li>
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:underline"
                  >
                    Hubungi Kami
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Explore
              </h2>
              <ul className="text-gray-600">
                <li className="mb-4">
                  <a href="https://flowbite.com" className="hover:underline">
                    Karir
                  </a>
                </li>
                <li>
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:underline"
                  >
                    Blog & News
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                Branch Company
              </h2>
              <ul className="text-gray-600">
                <li className="mb-4">
                  <a href="https://flowbite.com" className="hover:underline">
                    Yamaha Putra Utama Motor
                  </a>
                </li>
                <li className="mb-4">
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:underline"
                  >
                    Dealer Motor Bekas Putra Utama
                  </a>
                </li>
                <li className="mb-4">
                  <a
                    href="https://tailwindcss.com/"
                    className="hover:underline"
                  >
                    Gmart
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <hr className="my-12 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />

        <div className="flex items-center justify-center pb-12 sm:pb-8">
          <span className="text-sm text-gray-500 text-center">
            Copyright © 2025{" "}
            <a href="https://flowbite.com" className="hover:underline">
              Putra Utama Group
            </a>
            . All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
