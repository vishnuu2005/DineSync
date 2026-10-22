import React from 'react';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { handleImageError, getCategoryFallbackImage } from '../../utils/imageFallbacks';

const ProductCard = ({ product }) => {
  const { cartItems, addToCart, updateQuantity } = useCart();

  const cartItem = cartItems.find((item) => item._id === product._id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const isVeg = product.type === 'veg';

  return (
    <div className="bg-white rounded-2xl border border-[#D4A373]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Image Header with Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-[#FAF7F2]">
        <img
          src={product.image || getCategoryFallbackImage(product.category)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => handleImageError(e, product.category)}
        />

        {/* Veg / Non-Veg Indicator */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs flex items-center gap-1.5 border border-gray-100">
          <div
            className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
              isVeg ? 'border-emerald-600' : 'border-red-600'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isVeg ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
            {isVeg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>

        {/* Category Pill */}
        <div className="absolute top-3 right-3 bg-[#1A0F0A]/80 text-[#FAEDCD] text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
          {product.category}
        </div>

        {/* Out of Stock Overlay */}
        {!product.available && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-[#Outfit] font-bold text-base text-[#2C1810] line-clamp-1 group-hover:text-[#8B5E3C] transition-colors">
              {product.name}
            </h3>
            <span className="font-[#Outfit] font-extrabold text-base text-[#8B5E3C] shrink-0">
              ₹{product.price}
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">
            {product.description || 'Artisan café item prepared fresh upon order.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          {product.available ? (
            quantityInCart > 0 ? (
              <div className="flex items-center justify-between w-full bg-[#FAF7F2] p-1 rounded-xl border border-[#D4A373]/30">
                <button
                  onClick={() => updateQuantity(product._id, quantityInCart - 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#D4A373]/40 flex items-center justify-center text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white transition-colors shadow-2xs"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm text-[#2C1810] px-2">{quantityInCart} in cart</span>
                <button
                  onClick={() => updateQuantity(product._id, quantityInCart + 1)}
                  className="w-8 h-8 rounded-lg bg-[#8B5E3C] flex items-center justify-center text-white hover:bg-[#6F492E] transition-colors shadow-2xs"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(product, 1)}
                className="w-full py-2 px-3 bg-[#8B5E3C] hover:bg-[#6F492E] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full py-2 px-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
