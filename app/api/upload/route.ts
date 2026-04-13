import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'هیچ فایلێک نەدۆزرایەوە' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const savedFilename = `${uniqueSuffix}-${filename}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const path = join(uploadDir, savedFilename);
    await writeFile(path, buffer);

    return NextResponse.json({ success: true, filename: savedFilename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'هەڵەیەک ڕوویدا لە کاتی ئەپلۆدکردن' }, { status: 500 });
  }
}
