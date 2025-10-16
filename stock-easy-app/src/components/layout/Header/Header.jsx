import React from 'react';
import { Bell, Moon, Sun, Menu } from 'lucide-react';
import { Button } from '../../ui/Button';

const Header = ({ 
  darkMode, 
  onToggleDarkMode, 
  onToggleSidebar,
  notificationsCount = 0,
  onNotificationsClick 
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Logo + Menu Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="md"
            icon={Menu}
            onClick={onToggleSidebar}
            className="lg:hidden"
            aria-label="Toggle menu"
          />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SE</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white hidden sm:block">
              Stock Easy
            </h1>
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="md"
              icon={Bell}
              onClick={onNotificationsClick}
              aria-label="Notifications"
            />
            {notificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </div>
          
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="md"
            icon={darkMode ? Sun : Moon}
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
