import CalendarContainer from './components/CalendarContainer';

/**
 * Calendar Page - Server Component
 * This is the main calendar page that fetches initial data on the server
 * and then hands off to the client-side CalendarContainer for interactive use.
 */
export default function CalendarPage() {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      <CalendarContainer />
    </div>
  );
}
