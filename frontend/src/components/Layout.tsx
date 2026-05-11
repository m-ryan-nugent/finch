import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  PieChart,
  Tag,
  Download,
  MoreHorizontal,
  X,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: '/accounts', label: 'Accounts', icon: <Wallet className="h-5 w-5" /> },
  { path: '/transactions', label: 'Transactions', icon: <ArrowLeftRight className="h-5 w-5" /> },
  { path: '/recurring', label: 'Recurring', icon: <Repeat className="h-5 w-5" /> },
  { path: '/budgets', label: 'Budgets', icon: <PieChart className="h-5 w-5" /> },
  { path: '/categories', label: 'Categories', icon: <Tag className="h-5 w-5" /> },
  { path: '/export', label: 'Export', icon: <Download className="h-5 w-5" /> },
];

const mobileMainItems = navItems.slice(0, 3);
const mobileMoreItems = navItems.slice(3);

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-teal-50 text-teal-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const isMoreActive = mobileMoreItems.some((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-56 bg-white border-r border-gray-200">
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2.5">
          <img src="/images/finch-logo.png" alt="Finch" className="h-8 w-8" />
          <span className="text-xl font-bold text-teal-600">Finch</span>
        </div>
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.path} item={item} />
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around h-16">
          {mobileMainItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs ${
                  isActive ? 'text-teal-600' : 'text-gray-500'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              isMoreActive || moreOpen ? 'text-teal-600' : 'text-gray-500'
            }`}
          >
            {moreOpen ? <X className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
            <span>More</span>
          </button>
        </div>

        {/* More Menu */}
        {moreOpen && (
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            {mobileMoreItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-sm font-medium ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
