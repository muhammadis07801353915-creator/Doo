'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Film, Copy, CheckCircle2, Play, Loader2, LogIn, LogOut } from 'lucide-react';
import { auth, db, storage } from '../firebase';
import { signInAnonymously, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [passcode, setPasscode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVideos(videoData);
    }, (error) => {
      console.error("Error fetching videos:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleLogin = async () => {
    if (passcode === '500') {
      try {
        await signInAnonymously(auth);
        setPasscode('');
      } catch (error) {
        console.error("Login error:", error);
        alert("هەڵەیەک ڕوویدا لە کاتی چوونەژوورەوە");
      }
    } else {
      alert("کۆدی نهێنی هەڵەیە!");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert('تکایە سەرەتا بچۆ ژوورەوە بۆ ئەوەی بتوانیت ڤیدیۆ ئەپلۆد بکەیت');
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('تکایە تەنها فایلی ڤیدیۆ هەڵبژێرە');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `videos/${uniqueFilename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error('Upload failed:', error);
        alert('هەڵەیەک ڕوویدا لە کاتی ئەپلۆدکردن.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'videos'), {
            filename: file.name,
            url: downloadURL,
            size: file.size,
            createdAt: Date.now(),
            uid: user.uid
          });
          
        } catch (error) {
          console.error("Error saving to database:", error);
          alert("هەڵەیەک ڕوویدا لە پاشەکەوتکردنی زانیارییەکان");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    );
  };

  const copyEmbedLink = (videoId: string) => {
    const embedUrl = `${window.location.origin}/embed/${videoId}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedId(videoId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-12 text-center mt-10 relative">
        <div className="absolute top-0 left-0">
          {isAuthReady && user && (
            <button onClick={handleLogout} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
              <LogOut className="w-4 h-4" />
              چوونەدەرەوە
            </button>
          )}
        </div>
        
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
        {!user ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <UploadCloud className="w-16 h-16 text-gray-600" />
            <p className="text-xl font-medium text-gray-400">بۆ ئەپلۆدکردنی فیلم، کۆدی نهێنی بنووسە</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-sm">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="کۆدی نهێنی..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-center text-lg tracking-widest"
                dir="ltr"
              />
              <button onClick={handleLogin} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
                <LogIn className="w-5 h-5" />
                چوونەژوورەوە
              </button>
            </div>
          </div>
        ) : (
          <>
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
                <div className="flex flex-col items-center gap-3 w-full max-w-md">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  <div className="w-full bg-gray-800 rounded-full h-2.5 mt-4">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <span className="text-blue-400 font-medium">{Math.round(uploadProgress)}%</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-16 h-16 text-blue-500" />
                  <span className="text-xl font-medium">
                    کلیک بکە بۆ هەڵبژاردنی فیلم
                  </span>
                  <span className="text-gray-500 text-sm">
                    پشتگیری هەموو جۆرە ڤیدیۆیەک دەکات (MP4, WebM, هتد...)
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Videos List */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Play className="w-6 h-6 text-blue-400" />
          فیلمە ئەپلۆدکراوەکان
        </h2>

        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-gray-500">هیچ فیلمێک نەدۆزرایەوە.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="aspect-video bg-black relative">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover opacity-80"
                    controls
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="font-medium text-lg truncate" dir="ltr" title={video.filename}>
                      {video.filename}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      قەبارە: {(video.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => copyEmbedLink(video.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-medium"
                  >
                    {copiedId === video.id ? (
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
