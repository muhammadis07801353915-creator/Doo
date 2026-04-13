'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Film, Copy, CheckCircle2, Play, Loader2 } from 'lucide-react';

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('تکایە تەنها فایلی ڤیدیۆ هەڵبژێرە');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        fetchVideos();
      } else {
        alert(data.error || 'هەڵەیەک ڕوویدا');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('هەڵەیەک ڕوویدا لە کاتی ئەپلۆدکردن. لەوانەیە فایلەکە زۆر گەورە بێت.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyEmbedLink = (filename: string) => {
    const embedUrl = `${window.location.origin}/embed/${filename}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedId(filename);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-12 text-center mt-10">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Film className="w-10 h-10 text-blue-500" />
          سەکۆی فیلمەکانم
        </h1>
        <p className="text-gray-400 text-lg">
          فیلمەکانت لێرە ئەپلۆد بکە و لینکی ئیمبێد (Embed) وەربگرە بۆ بەکارهێنان لە وێبسایتەکانی تر.
        </p>
      </header>

      {/* Upload Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center mb-12 shadow-xl">
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center justify-center w-full gap-4 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {isUploading ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          ) : (
            <UploadCloud className="w-16 h-16 text-blue-500" />
          )}
          <span className="text-xl font-medium">
            {isUploading ? 'لە ئەپلۆدکردندایە، تکایە چاوەڕێبە...' : 'کلیک بکە بۆ هەڵبژاردنی فیلم'}
          </span>
          <span className="text-gray-500 text-sm">
            پشتگیری هەموو جۆرە ڤیدیۆیەک دەکات (MP4, WebM, هتد...)
          </span>
        </button>
      </div>

      {/* Videos List */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Play className="w-6 h-6 text-blue-400" />
          فیلمە ئەپلۆدکراوەکان
        </h2>

        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-gray-500">هیچ فیلمێک نەدۆزرایەوە. یەکەم فیلمت ئەپلۆد بکە!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div key={video.filename} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="aspect-video bg-black relative">
                  <video
                    src={`/uploads/${video.filename}`}
                    className="w-full h-full object-cover opacity-80"
                    controls
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="font-medium text-lg truncate" dir="ltr" title={video.filename}>
                      {video.filename.split('-').slice(1).join('-')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      قەبارە: {(video.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => copyEmbedLink(video.filename)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                  >
                    {copiedId === video.filename ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        کۆپیکرا!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        کۆپیکردنی کۆدی ئیمبێد
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
