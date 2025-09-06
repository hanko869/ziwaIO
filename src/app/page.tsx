import ClientWrapper from '@/components/ClientWrapper';
import Navigation from '@/components/Navigation';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    redirect('/login');
  }

  try {
    // Decode the JWT token to get user info
    const payload = JSON.parse(Buffer.from(token.value.split('.')[1], 'base64').toString());
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };
  } catch (error) {
    redirect('/login');
  }
}

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation user={{ username: user.username, role: user.role }} />
      <div className="flex flex-col items-center justify-between p-4 md:p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <ClientWrapper />
        </div>
      </div>
    </main>
  );
}
