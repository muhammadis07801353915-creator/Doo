import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سەیرکردنی فیلم',
};

export default async function EmbedPage({ params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden m-0 p-0">
      <video
        src={`/uploads/${filename}`}
        controls
        autoPlay
        className="w-full h-full object-contain"
      />
    </div>
  );
}
