import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'سەکۆی فیلمەکانم',
  description: 'فیلمەکانت ئەپلۆد بکە و لینکی ئیمبێد وەربگرە',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ku" dir="rtl">
      <body className="bg-gray-950 text-gray-50 min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
