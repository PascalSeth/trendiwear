export default function Footer() {
  return (
    <footer className="bg-[#EAEAEA] pt-24 pb-12 px-6 border-t border-stone-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-sm">
          <h3 className="text-3xl font-serif italic font-bold mb-6">Trendizip.</h3>
          <p className="text-stone-500 leading-relaxed">
            Connecting the world's most talented creators with discerning fashion enthusiasts.
          </p>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900">Shop</h4>
            <ul className="flex flex-col gap-2 text-sm text-stone-600">
              <li className="hover:text-black cursor-pointer">New Arrivals</li>
              <li className="hover:text-black cursor-pointer">Best Sellers</li>
              <li className="hover:text-black cursor-pointer">Designers</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900">Support</h4>
            <ul className="flex flex-col gap-2 text-sm text-stone-600">
              <li className="hover:text-black cursor-pointer">FAQ</li>
              <li className="hover:text-black cursor-pointer">Shipping</li>
              <li className="hover:text-black cursor-pointer">Returns</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-stone-300 flex justify-between text-xs text-stone-400 uppercase tracking-wider">
        <span>&copy; 2024 Trendizip</span>
        <span>Designed for Excellence</span>
      </div>
    </footer>
  );
}