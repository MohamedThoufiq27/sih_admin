import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';

const SearchComponent = ({ searchTerm, setSearchTerm, onFocus }) => {
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Function to handle the keydown event
    const handleKeyDown = (event) => {
      // Check if Alt key and 'k' are pressed
      if (event.altKey && event.key === 'k') {
        event.preventDefault(); // Prevent any default browser behavior
        searchInputRef.current?.focus(); // Focus the input field
      }
    };

    // Add the event listener to the whole window
    window.addEventListener('keydown', handleKeyDown);

    // IMPORTANT: Cleanup function to remove the listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-5 w-5 text-slate-500" />
      </div>

      {/* Input Field */}
      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        placeholder="Search Reports . . ."
        onFocus={onFocus} // <-- This will trigger the modal
        onChange={(e) => setSearchTerm(e.target.value)}
        className="
          w-full 
          py-2 
          pl-10 pr-16 
          bg-slate-800 
          text-slate-300 
          placeholder:text-slate-500 
          border border-slate-700 
          rounded-lg 
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-500 
          focus:border-transparent
        "
      />

      {/* Keyboard Shortcut */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <kbd className="inline-flex items-center border border-slate-600 rounded px-2 text-sm font-sans font-medium text-slate-400">
          <span className="text-lg">alt+</span>K
        </kbd>
      </div>
    </div>
  );
};

export default SearchComponent;