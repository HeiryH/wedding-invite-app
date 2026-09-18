import { redirect } from 'next/navigation';

// `/` is always the public landing page. This used to read `localStorage.user` on the client and
// bounce admins to their dashboard — but a stale `user` entry with an expired cookie meant every
// visitor got sent to a dashboard, 401'd, and landed on /login instead of the home page.
// Signed-in users reach their dashboard from the nav / "Sign in" instead.
export default function RootPage() {
  redirect('/home');
}
