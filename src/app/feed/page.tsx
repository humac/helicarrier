import FeedContainer from './components/FeedContainer';

/**
 * Feed Page - Server Component
 * This is the main feed page that fetches initial data on the server
 * and then hands off to the client-side FeedContainer for interactive use.
 */
export default function FeedPage() {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      <FeedContainer />
    </div>
  );
}
