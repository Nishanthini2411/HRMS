// src/components/StatCard.jsx
const StatCard = ({ title, value, subtitle }) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-slate-500">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
