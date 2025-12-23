import React from 'react'

function HubungiKami() {
  return (
    <div className="w-full flex flex-col scroll-smooth">
      {/* HERO SECTION */}
      <div className="w-full h-[380px] md:h-[450px] relative">
        <img
          src="/images/section.svg"
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex flex-col justify-center px-6 md:px-20">
          <h1 className="text-white text-3xl md:text-5xl font-bold mb-3">
            Hubungi Kami
          </h1>
          <p className="text-white text-sm md:text-base max-w-2xl">
            Kami siap mendengar Anda. Hubungi Putra Utama Group untuk informasi,
            kerja sama, atau layanan terbaik kami.
          </p>
        </div>
      </div>


      {/* LOCATION / CONTACT INFO */}
      <div className="w-full px-6 md:px-20 py-14 md:py-20">
        <h2 className="text-2xl md:text-4xl font-semibold mb-10">
          Lokasi Head Office Putra Utama Group
        </h2>

        {/* TABLE STYLE BOX */}
        <div className="w-full border-t border-gray-300">
          {/* Address */}
          <div className="flex flex-col md:flex-row border-b border-gray-300 py-4">
            <div className="w-full md:w-1/4 font-semibold text-gray-800">
              Address
            </div>
            <div className="w-full md:w-3/4 text-gray-700">
              Jl. Raya Nguter, Dusun II, Gupit,
              <br />
              Kecamatan Nguter, Kabupaten Sukoharjo, Jawa Tengah
              <br />
              57571
            </div>
          </div>

          {/* Telp */}
          <div className="flex flex-col md:flex-row border-b border-gray-300 py-4">
            <div className="w-full md:w-1/4 font-semibold text-gray-800">
              Telp
            </div>
            <div className="w-full md:w-3/4 text-gray-700">
              (+62) 813–2947–3607
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col md:flex-row border-b border-gray-300 py-4">
            <div className="w-full md:w-1/4 font-semibold text-gray-800">
              Email
            </div>
            <div className="w-full md:w-3/4 text-gray-700">
              putrautamagroup1@gmail.com
            </div>
          </div>

          {/* Social Media */}
          <div className="flex flex-col md:flex-row border-b border-gray-300 py-4">
            <div className="w-full md:w-1/4 font-semibold text-gray-800">
              Social Media
            </div>
            <div className="w-full md:w-3/4 text-gray-700">@hoputrautamagroup</div>
          </div>
        </div>

        {/* MAP SECTION */}
        <div className="w-full mt-10 rounded-xl overflow-hidden shadow-md">
          <iframe
            title="map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.0109630314954!2d110.87375!3d-7.68669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a35c673eee0a5%3A0xecd3dcd89e5e9f39!2sNguter%2C%20Sukoharjo!5e0!3m2!1sen!2sid!4v1700000000000"
            width="100%"
            height="350"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded-xl"
          ></iframe>
        </div>

        
      {/* CONTACT FORM SECTION */}
      <div className="w-full px-6 md:px-20 mt-16">
        <h2 className="text-2xl md:text-4xl font-semibold mb-10">
          Hubungi Kami
        </h2>

        {/* FORM */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            className="border border-gray-300 rounded-lg px-4 py-3 w-full outline-none"
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="border border-gray-300 rounded-lg px-4 py-3 w-full outline-none"
          />

          <input
            type="text"
            placeholder="Company Name"
            className="border border-gray-300 rounded-lg px-4 py-3 w-full outline-none"
          />
          <input
            type="email"
            placeholder="Email Address"
            className="border border-gray-300 rounded-lg px-4 py-3 w-full outline-none"
          />
        </div>

        <textarea
          placeholder="Write your message here ..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 h-40 outline-none mb-6"
        ></textarea>

        <button className="w-full bg-blue-900 text-white font-semibold py-4 rounded-lg">
          Send Message
        </button>
      </div>
      </div>
    </div>
  )
}

export default HubungiKami