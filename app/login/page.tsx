import type { Metadata } from 'next'
import { LoginPage } from '@/components/landing/login-page'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Explore the Hostlink demo workspace. Bring your projects, people, and progress together.',
  robots: { index: false, follow: true },
}

export default function Page() {
  return <LoginPage />
}
