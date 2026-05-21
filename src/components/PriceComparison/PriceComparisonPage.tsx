import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, TrendingDown, Store, X, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppPreferences } from '../../contexts/AppPreferencesContext';

interface Store {
  id: string;
  name: string;
  store_type: string;
  location: string;
}

interface ProductCategory {
  id: string;
  name: string;
}

interface PriceComparison {
  id: string;
  store_id: string;
  product_name: string;
  brand: string;
  price: number;
  unit: string;
  location: string;
  created_at: string;
  stores: {
    name: string;
    store_type: string;
  };
}

export function PriceComparisonPage() {
  const { user } = useAuth();
  const { formatAmount } = useAppPreferences();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [prices, setPrices] = useState<PriceComparison[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '',
    product_category_id: '',
    product_name: '',
    brand: '',
    price: '',
    unit: 'per item',
    location: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storesRes, categoriesRes, pricesRes] = await Promise.all([
        supabase.from('stores').select('*').order('name'),
        supabase.from('product_categories').select('*').order('name'),
        supabase
          .from('price_comparisons')
          .select('*, stores(name, store_type)')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      setStores(storesRes.data || []);
      setCategories(categoriesRes.data || []);
      setPrices(pricesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    try {
      const { error } = await supabase.from('price_comparisons').insert({
        user_id: user.id,
        store_id: formData.store_id,
        product_category_id: formData.product_category_id,
        product_name: formData.product_name,
        brand: formData.brand,
        price,
        unit: formData.unit,
        location: formData.location,
        data_source: 'manual',
      });

      if (error) throw error;

      setShowModal(false);
      setFormData({
        store_id: '',
        product_category_id: '',
        product_name: '',
        brand: '',
        price: '',
        unit: 'per item',
        location: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Failed to save price. Please try again.');
    }
  };

  const filteredPrices = prices.filter((price) =>
    price.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.stores?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPrices = filteredPrices.reduce((acc, price) => {
    const key = `${price.product_name}_${price.brand || 'generic'}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(price);
    return acc;
  }, {} as Record<string, PriceComparison[]>);

  const productGroups = Object.entries(groupedPrices).map(([key, items]) => {
    const sorted = items.sort((a, b) => a.price - b.price);
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    const savings = mostExpensive.price - cheapest.price;

    return {
      key,
      name: items[0].product_name,
      brand: items[0].brand,
      items: sorted,
      cheapest,
      mostExpensive,
      savings,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Price Comparison</h3>
          <p className="text-gray-600 mt-1">Compare prices across stores and save money</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Price</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products, brands, or stores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {productGroups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No products found matching your search' : 'No price comparisons yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Price
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {productGroups.map((group) => (
            <div key={group.key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                    {group.brand && (
                      <p className="text-sm text-gray-600 mt-1">Brand: {group.brand}</p>
                    )}
                  </div>
                  {group.savings > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-medium">Potential Savings</p>
                        <p className="text-lg font-bold text-green-700">
                          {formatAmount(group.savings)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {group.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-center justify-between ${
                      index === 0 ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Store className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{item.stores.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.location || 'Location not specified'} • {item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${index === 0 ? 'text-green-700' : 'text-gray-900'}`}>
                        {formatAmount(item.price)}
                      </p>
                      {index === 0 && (
                        <p className="text-xs text-green-600 font-medium">Best Price</p>
                      )}
                      {index === group.items.length - 1 && group.items.length > 1 && (
                        <p className="text-xs text-red-600 font-medium">Highest Price</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Price Comparison</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    store_id: '',
                    product_category_id: '',
                    product_name: '',
                    brand: '',
                    price: '',
                    unit: 'per item',
                    location: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Milk, Bread, Eggs"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Organic Valley"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.product_category_id}
                  onChange={(e) => setFormData({ ...formData, product_category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="per item">per item</option>
                    <option value="per lb">per lb</option>
                    <option value="per oz">per oz</option>
                    <option value="per gallon">per gallon</option>
                    <option value="per dozen">per dozen</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Downtown, Mall location"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      store_id: '',
                      product_category_id: '',
                      product_name: '',
                      brand: '',
                      price: '',
                      unit: 'per item',
                      location: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
