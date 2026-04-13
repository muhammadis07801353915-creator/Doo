import { Metadata } from 'next';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const metadata: Metadata = {
  title: 'سەیرکردنی فیلم',
};

export default async function EmbedPage({ params }: { params: Promise<{ filename: string }> }) {
  const { filename: videoId } = await params;
  
  let videoUrl = '';
  
  try {
    const docRef = doc(db, 'videos', videoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      videoUrl = docSnap.data().url;
    }
  } catch (error) {
    console.error("Error fetching video:", error);
  }

  if (!videoUrl) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center text-white">
        <p>ڤیدیۆکە نەدۆزرایەوە</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden m-0 p-0">
      <video
        src={videoUrl}
        controls
        autoPlay
        className="w-full h-full object-contain"
      />
    </div>
  );
}
