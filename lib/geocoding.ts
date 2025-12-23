// lib/geocoding.ts

export async function reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AttendanceApp/1.0', // Required by Nominatim
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Gagal mendapatkan alamat');
      }
  
      const data = await response.json();
      
      // Format alamat yang lebih rapi
      const address = data.address;
      const parts = [];
  
      if (address.road) parts.push(address.road);
      if (address.suburb) parts.push(address.suburb);
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }
      if (address.state) parts.push(address.state);
      if (address.postcode) parts.push(address.postcode);
  
      return parts.length > 0 
        ? parts.join(', ') 
        : data.display_name || 'Alamat tidak ditemukan';
        
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${latitude}, ${longitude}`; // Fallback ke koordinat
    }
  }
  
  /**
   * Alternative: Google Maps Geocoding API (Perlu API Key)
   * Lebih akurat tapi berbayar
   */
  export async function reverseGeocodeGoogle(
    latitude: number,
    longitude: number,
    apiKey: string
  ): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=id`
      );
  
      const data = await response.json();
  
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
  
      return `${latitude}, ${longitude}`;
    } catch (error) {
      console.error('Error Google geocoding:', error);
      return `${latitude}, ${longitude}`;
    }
  }