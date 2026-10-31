export function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-bold tracking-tight text-[#0f1c33] sm:text-[28px]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
