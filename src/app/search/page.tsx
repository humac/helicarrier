import SearchContainer from './components/SearchContainer';

/**
 * Search Page - Server Component
 * Main search interface with tabs for Memory, Files, and Crons
 */
export default function SearchPage() {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      <SearchContainer />
    </div>
  );
}
