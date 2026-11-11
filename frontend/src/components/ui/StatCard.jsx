export default function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }) {
  const iconVariants = {
    default: 'bg-primary-50 text-primary',
    warning: 'bg-warning-light text-warning-dark',
    error: 'bg-error-light text-error-dark',
  };

  const trendColor =
    trend && trend > 0
      ? 'text-green-600'
      : trend && trend < 0
        ? 'text-red-600'
        : 'text-text-secondary';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconVariants[variant]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-semibold text-text-primary">{value}</p>
            {trend !== undefined && trend !== null && (
              <span className={`text-xs font-medium ${trendColor}`}>
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
