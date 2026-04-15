// The root layout is an intentional passthrough. Each route group owns
// its own <html>/<body> so the Payload admin (which renders its own
// RootLayout) doesn't collide with the marketing site's chrome.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
