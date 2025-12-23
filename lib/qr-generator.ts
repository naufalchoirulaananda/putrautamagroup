// File: lib/qr-generator.ts
import QRCode from 'qrcode';
import { Jimp } from 'jimp';
import fs from 'fs';

interface ApproverData {
  name: string;
  role: string;
  kode_pegawai: string;
  approval_level: number;
  approved_at?: string;
}

interface QRData {
  cuti_id: number;
  approver_name: string;
  approver_role: string;
  kode_pegawai: string;
  approval_level: number;
  approved_date: string;
  company: string;
}

/**
 * Generate verification URL for QR code
 * Format: https://yourdomain.com/verify/cuti/{cuti_id}/{approval_level}
 */
export function generateVerificationURL(
  cutiId: number,
  approvalLevel: number
): string {
  // Ganti dengan domain Anda
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://putrautamagroup.com';
  return `${baseUrl}/verify/cuti/${cutiId}/${approvalLevel}`;
}

/**
 * Generate compact QR data (untuk backward compatibility jika butuh JSON)
 */
export function generateQRData(
  cutiId: number,
  approverData: ApproverData
): string {
  // Untuk database storage - compact JSON
  const qrData = {
    id: cutiId,
    approver: approverData.name,
    level: approverData.approval_level,
    date: new Date().toISOString().split('T')[0]
  };

  return JSON.stringify(qrData);
}

/**
 * Generate QR code from data string
 */
export async function generateQRFromData(qrDataString: string): Promise<string> {
  try {
    const qrOptions = {
      errorCorrectionLevel: 'M' as const,
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    return await QRCode.toDataURL(qrDataString, qrOptions);
  } catch (error) {
    console.error('Error generating QR from data:', error);
    throw error;
  }
}

/**
 * Generate QR Code dengan logo di tengah
 */
export async function generateQRCodeWithLogo(
  cutiId: number,
  approverData: ApproverData,
  logoPath?: string
): Promise<string> {
  try {
    // Use URL for QR code (easier to scan)
    const verificationURL = generateVerificationURL(cutiId, approverData.approval_level);

    // Generate QR code dasar
    const qrOptions = {
      errorCorrectionLevel: 'H' as const, // High for logo overlay
      type: 'png' as const,
      quality: 0.92,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    // Generate QR as buffer
    const qrBuffer = await QRCode.toBuffer(verificationURL, qrOptions);

    // Jika ada logo, overlay logo di tengah QR
    if (logoPath && fs.existsSync(logoPath)) {
      const qrWithLogo = await addLogoToQR(qrBuffer, logoPath);
      return qrWithLogo;
    }

    // Return QR tanpa logo jika logo tidak ada
    return qrBuffer.toString('base64');

  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Add logo to center of QR code using Jimp
 */
async function addLogoToQR(
  qrBuffer: Buffer,
  logoPath: string
): Promise<string> {
  try {
    // Load QR code image
    const qrImage = await Jimp.read(qrBuffer);
    const qrWidth = qrImage.width;
    const qrHeight = qrImage.height;

    // Load logo
    const logo = await Jimp.read(logoPath);

    // Resize logo to 20% of QR code size
    const logoSize = Math.floor(qrWidth * 0.2);
    logo.resize({ w: logoSize, h: logoSize });

    // Add white background/border to logo for better visibility
    const logoBg = new Jimp({ width: logoSize + 16, height: logoSize + 16, color: 0xFFFFFFFF });
    logoBg.composite(logo, 8, 8);

    // Calculate center position
    const x = Math.floor((qrWidth - logoBg.width) / 2);
    const y = Math.floor((qrHeight - logoBg.height) / 2);

    // Overlay logo on QR code
    qrImage.composite(logoBg, x, y);

    // Convert to base64
    const buffer = await qrImage.getBuffer('image/png');
    return buffer.toString('base64');

  } catch (error) {
    console.error('Error adding logo to QR:', error);
    // Return original QR if logo fails
    return qrBuffer.toString('base64');
  }
}

/**
 * Generate simple QR with URL (recommended for scanning)
 */
export async function generateSimpleQR(
  cutiId: number,
  approverData: ApproverData
): Promise<string> {
  // Use verification URL instead of JSON
  const verificationURL = generateVerificationURL(cutiId, approverData.approval_level);
  
  const qrOptions = {
    errorCorrectionLevel: 'M' as const,
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };
  
  const buffer = await QRCode.toBuffer(verificationURL, qrOptions);
  return buffer.toString('base64');
}

/**
 * Validate QR code data (for legacy JSON format)
 */
export function validateQRData(scannedText: string): QRData | null {
  try {
    const parsed = JSON.parse(scannedText);
    
    // Validate required fields
    if (!parsed.id || !parsed.approver) {
      return null;
    }

    return {
      cuti_id: parsed.id,
      approver_name: parsed.approver,
      approver_role: parsed.role || '',
      kode_pegawai: parsed.code || '',
      approval_level: parsed.level,
      approved_date: parsed.date,
      company: 'Putra Utama Group'
    };
  } catch {
    return null;
  }
}
