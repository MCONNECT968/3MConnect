import React from 'react';
import { useTranslation } from 'react-i18next';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
}

interface CalendarProps {
  events: CalendarEvent[];
}

const Calendar: React.FC<CalendarProps> = ({ events }) => {
  const today = new Date();
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const { t } = useTranslation();

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const formatEventDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-white">{t('dashboard.upcomingEvents')}</h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
          {t('dashboard.viewFullCalendar')}
        </button>
      </div>

      {sortedEvents.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noEvents')}</p>
      ) : (
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2 dark:border-blue-600">
              <div className="flex justify-between">
                <p className="font-medium dark:text-white">{event.title}</p>
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatEventTime(event.date)}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{formatEventDate(event.date)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{event.location}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calendar;