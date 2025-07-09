import ContactExtractorSubscription from '@/components/ContactExtractorSubscription';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="fixed top-4 right-4">
          <LanguageSwitcher />
        </div>
        <ContactExtractorSubscription />
      </div>
    </main>
  );
}
