export default function Pill({ count }) {
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex items-center justify-center
                     bg-rose-600 text-white text-[9px] leading-none
                     font-bold rounded-full px-1.5 py-[2px] min-w-[14px] h-[14px]">
      {count > 99 ? "99+" : count}
    </span>
  );
}
