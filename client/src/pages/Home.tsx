
import React, { useState, useEffect } from 'react';
import { Product, UserRole } from '../types';
import { getProducts, placeOrder, getAdminContact } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Search, ShoppingCart, Clock, Info, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch(err => {
        console.warn("Could not fetch products, showing empty list.");
        setProducts([]);
      });
  }, []);

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderClick = (product: Product) => {
    if (user?.role === UserRole.ADMIN) {
      notify("Administrators cannot place personal orders.", "error");
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
    setOrderQty(1);
    setOrderNote('');
  };

  const submitOrder = async () => {
    if (!selectedProduct || !user) return;
    try {
      await placeOrder({
        userId: user.id,
        productId: selectedProduct.id,
        quantity: orderQty,
        description: orderNote
      });
      const adminPhone = await getAdminContact();
      notify(`Order placed! Contact us at ${adminPhone} for payment details.`, "success");
      setSelectedProduct(null);
    } catch (e) {
      notify('Failed to place order. Please check your connection.', 'error');
    }
  };

  const isUserAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="relative max-w-lg mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
          placeholder="Search flowers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
              <div className="relative h-40 md:h-56 w-full group">
                <img src={product.images[0]} alt={product.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold text-gray-700 flex items-center gap-1 shadow-sm">
                   <Clock className="h-3 w-3" /> Ready in {product.durationHours}h
                </div>
              </div>
              <div className="p-3 md:p-5 flex flex-col flex-grow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-1">
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 leading-tight line-clamp-2">{product.title}</h3>
                  <span className="text-sm md:text-base font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">₹{product.price}</span>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mb-4 flex-grow line-clamp-3">{product.description}</p>
                
                <button 
                  onClick={() => handleOrderClick(product)}
                  disabled={isUserAdmin}
                  className={`w-full flex items-center justify-center gap-2 py-2 md:py-3 px-3 rounded-lg transition-colors duration-200 text-xs md:text-sm font-medium
                    ${isUserAdmin 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  {isUserAdmin ? (
                    <>
                      <ShieldAlert className="h-4 w-4" /> Admin View
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> {isAuthenticated ? 'Order Now' : 'Login to Order'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Info className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          No products available.
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl animate-scale-up">
            <h3 className="text-2xl font-black mb-6 text-gray-900">Order: {selectedProduct.title}</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Quantity</label>
                <input type="number" min="1" value={orderQty} onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value)))} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Custom Notes (Optional)</label>
                <textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2} className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none" placeholder="Any specific instructions..." />
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-[24px] border border-indigo-100 flex flex-col items-center">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Amount</span>
                <span className="text-4xl font-black text-indigo-600">₹{selectedProduct.price * orderQty}</span>
                <div className="text-[10px] text-indigo-300 font-bold uppercase mt-2 tracking-widest">Est. Prep: {selectedProduct.durationHours}H</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setSelectedProduct(null)} className="py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                <button onClick={submitOrder} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Confirm Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
