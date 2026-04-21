export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-cyan-400 text-4xl font-bold mb-2">Planymaps</h1>
      <p className="text-gray-300 text-lg mt-8 mb-2">This link is unavailable</p>
      <p className="text-gray-500 text-sm">
        It may have expired, been revoked, or the URL may be incorrect.
      </p>
    </div>
  );
}
