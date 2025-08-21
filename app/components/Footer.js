export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 text-center">
      <div className="text-gray-400 text-sm">
        © {currentYear} • Crafted by{' '}
        <a 
          href="https://adisharma.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-pink-400 transition-colors duration-200 underline decoration-purple-400/30 hover:decoration-pink-400/50"
        >
          adityasharma
        </a>
      </div>
    </footer>
  );
}
