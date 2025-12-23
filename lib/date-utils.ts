// File: lib/date-utils.ts
// Utility functions for handling dates in WIB (Indonesia) timezone

/**
 * Format Date to YYYY-MM-DD in local timezone
 * Prevents timezone offset issues when saving to database
 * 
 * @param date - Date object or ISO string
 * @returns YYYY-MM-DD string or null
 * 
 * @example
 * formatDateForDB(new Date('2024-12-20')) // Returns "2024-12-20"
 * formatDateForDB('2024-12-20T00:00:00.000Z') // Returns "2024-12-20"
 */
export function formatDateForDB(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return null;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Format Date to YYYY-MM-DD in WIB timezone (Asia/Jakarta)
   * More explicit timezone handling
   * 
   * @param date - Date object, ISO string, or null
   * @returns YYYY-MM-DD string or null
   */
  export function formatDateWIB(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return null;
    }
    
    // Format using WIB timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(dateObj); // Returns YYYY-MM-DD
  }
  
  /**
   * Format Date to Indonesian display format
   * 
   * @param date - Date object, ISO string, or null
   * @param includeTime - Whether to include time
   * @returns Formatted date string (e.g., "20 Desember 2024" or "20 Des 2024, 14:30")
   * 
   * @example
   * formatDateIndonesia(new Date()) // "20 Desember 2024"
   * formatDateIndonesia(new Date(), true) // "20 Desember 2024, 14:30"
   */
  export function formatDateIndonesia(
    date: Date | string | null | undefined, 
    includeTime = false
  ): string {
    if (!date) return "-";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "-";
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }
    
    return new Intl.DateTimeFormat('id-ID', options).format(dateObj);
  }
  
  /**
   * Format Date to short Indonesian format
   * 
   * @param date - Date object, ISO string, or null
   * @returns Short formatted date (e.g., "20 Des 2024")
   */
  export function formatDateIndonesiaShort(
    date: Date | string | null | undefined
  ): string {
    if (!date) return "-";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "-";
    }
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    
    return new Intl.DateTimeFormat('id-ID', options).format(dateObj);
  }
  
  /**
   * Calculate difference in days between two dates
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of days (inclusive)
   * 
   * @example
   * getDaysDifference('2024-12-20', '2024-12-22') // Returns 3
   */
  export function getDaysDifference(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined
  ): number {
    if (!startDate || !endDate) return 0;
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // +1 to make it inclusive
  }
  
  /**
   * Get current date in WIB timezone as YYYY-MM-DD
   * 
   * @returns Current date string in WIB
   */
  export function getCurrentDateWIB(): string {
    return formatDateWIB(new Date()) || '';
  }
  
  /**
   * Parse YYYY-MM-DD string to Date object (without timezone issues)
   * 
   * @param dateString - Date string in YYYY-MM-DD format
   * @returns Date object set to local midnight
   */
  export function parseDateString(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    
    const [year, month, day] = dateString.split('-').map(Number);
    
    if (!year || !month || !day) return null;
    
    // Create date in local timezone (midnight)
    return new Date(year, month - 1, day);
  }
  
  /**
   * Check if date is in the past
   * 
   * @param date - Date to check
   * @returns true if date is before today
   */
  export function isPastDate(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dateObj < today;
  }
  
  /**
   * Check if date is weekend (Saturday or Sunday)
   * 
   * @param date - Date to check
   * @returns true if date is weekend
   */
  export function isWeekend(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = dateObj.getDay();
    
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  }
  
  /**
   * Format DateTime to WIB with timezone info
   * 
   * @param date - Date object or string
   * @returns Formatted datetime with WIB
   * 
   * @example
   * formatDateTimeWIB(new Date()) // "20 Desember 2024, 14:30 WIB"
   */
  export function formatDateTimeWIB(date: Date | string | null | undefined): string {
    if (!date) return "-";
    
    const formatted = formatDateIndonesia(date, true);
    return formatted === "-" ? "-" : `${formatted} WIB`;
  }