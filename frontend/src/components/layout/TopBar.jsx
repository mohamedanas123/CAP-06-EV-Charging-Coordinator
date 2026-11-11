import { Menu } from 'lucide-react';

export default function TopBar({ pageTitle, onToggleSidebar, userName, userRole }) {
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleBadgeClasses =
    userRole === 'ADMIN'
      ? 'bg-purple-50 text-purple-700 border border-purple-200'
      : 'bg-[#E8F0EB] text-[#245C45] border border-[#245C45]/20';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-gray-100 -ml-2"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="hidden md:block text-sm font-medium text-text-primary">{userName}</span>

        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeClasses}`}
        >
          {userRole}
        </span>

        <div className="w-8 h-8 rounded-full bg-[#245C45] flex items-center justify-center shadow-sm">
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
