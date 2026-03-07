export default function BlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex justify-center">
      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}