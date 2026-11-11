const statusStyles = {
  AVAILABLE: 'bg-green-50 text-green-700',
  CHARGING: 'bg-blue-50 text-blue-700',
  ASSIGNED: 'bg-primary-50 text-primary',
  WAITING: 'bg-amber-50 text-amber-700',
  RESERVED: 'bg-purple-50 text-purple-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-50 text-red-700',
  INTERRUPTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function StatusBadge({ status }) {
  const classes = statusStyles[status] || 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
}
