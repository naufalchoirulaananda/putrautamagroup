import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  console.log('\n🚀 ===== UPLOAD REQUEST START =====');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'tentang-perusahaan';

    console.log('📦 File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });
    console.log('📁 Target folder:', folder);

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Hanya file gambar yang diperbolehkan (JPG, PNG, WEBP, GIF)' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file terlalu besar (maksimal 5MB)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ Buffer created:', buffer.length, 'bytes');

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${originalName}`;
    console.log('📝 Generated filename:', filename);

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    console.log('📂 Full upload directory:', uploadDir);
    console.log('📂 Directory exists?', existsSync(uploadDir));

    // Check if directory exists, if not create it
    if (!existsSync(uploadDir)) {
      console.log('🔨 Creating directory...');
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ Directory created');
    }

    // Write file to directory
    const filepath = join(uploadDir, filename);
    console.log('💾 Writing to:', filepath);
    
    await writeFile(filepath, buffer);
    console.log('✅ File written');

    // Verify file exists after write
    const fileExists = existsSync(filepath);
    console.log('🔍 File exists after write?', fileExists);
    
    if (!fileExists) {
      console.error('❌❌❌ FILE NOT FOUND AFTER WRITE! ❌❌❌');
      return NextResponse.json(
        { success: false, message: 'File gagal tersimpan' },
        { status: 500 }
      );
    }

    // Return the public URL path
    const publicPath = `/uploads/${folder}/${filename}`;
    console.log('🔗 Public URL path:', publicPath);
    console.log('✅ ===== UPLOAD REQUEST SUCCESS =====\n');

    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload',
      filepath: publicPath
    });

  } catch (error) {
    console.error('❌ ===== UPLOAD REQUEST FAILED =====');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    const message = error instanceof Error ? error.message : 'Gagal mengupload file';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}