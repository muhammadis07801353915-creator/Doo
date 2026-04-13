import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  try {
    const files = await readdir(uploadDir);
    const videos = [];

    for (const file of files) {
      if (file.startsWith('.')) continue;
      const filePath = join(uploadDir, file);
      const fileStat = await stat(filePath);
      videos.push({
        filename: file,
        size: fileStat.size,
        createdAt: fileStat.birthtime,
      });
    }

    // Sort by newest first
    videos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ success: true, videos });
  } catch (error) {
    // Directory might not exist yet if no uploads have been made
    return NextResponse.json({ success: true, videos: [] });
  }
}
