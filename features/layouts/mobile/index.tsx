export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[100dvw] h-[100dvh] flex justify-center bg-white">
      <div className="flex flex-col items-center justify-center h-screen w-[480px] w-max-[480px]">
        {children}
      </div>
    </div>
  );
}
