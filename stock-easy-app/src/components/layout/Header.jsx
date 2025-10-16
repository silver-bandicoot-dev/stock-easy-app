import React from 'react';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import Badge from '../ui/Badge/Badge';

export const Header = ({ 
  darkMode, 
  onToggleDarkMode, 
  onToggleSidebar,
  notificationsCount = 0,
  onNotificationsClick 
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              icon={Menu}
              onClick={onToggleSidebar}
              className="lg:hidden"
              aria-label="Ouvrir le menu"
            />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">SE</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 hidden sm:block">
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
                size="sm"
                icon={Bell}
                onClick={onNotificationsClick}
                aria-label="Notifications"
              />
              {notificationsCount > 0 && (
                <div className="absolute -top-1 -right-1">
                  <Badge variant="danger" size="sm">
                    {notificationsCount}
                  </Badge>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              icon={darkMode ? Sun : Moon}
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
