import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Edit, Trash2, Search, Filter, Eye, EyeOff } from 'lucide-react';

interface StoreProduct {
  id: string;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  price: number;
  category: string;
  link: string;
  imageUrl?: string;
  status: 'available' | 'out-of-stock';
}

const categories = ['חטיפים', 'ציוד', 'טכנולוגיה', 'ספרים', 'כלי כתיבה'];

const StoreManagement = () => {
  const [products, setProducts] = useState<StoreProduct[]>([
    {
      id: '1',
      nameHe: 'מחשבון מדעי',
      nameEn: 'Scientific Calculator',
      descriptionHe: 'מחשבון מדעי איכותי לבחינות',
      descriptionEn: 'High quality scientific calculator for exams',
      price: 89,
      category: 'ציוד',
      link: 'https://example.com/calculator',
      status: 'available'
    },
    {
      id: '2',
      nameHe: 'חטיף אנרגיה',
      nameEn: 'Energy Bar',
      descriptionHe: 'חטיף אנרגיה לתקופת הבחינות',
      descriptionEn: 'Energy bar for exam period',
      price: 12,
      category: 'חטיפים',
      link: 'https://example.com/energy-bar',
      status: 'available'
    },
    {
      id: '3',
      nameHe: 'ספר לימוד',
      nameEn: 'Textbook',
      descriptionHe: 'ספר לימוד איכותי',
      descriptionEn: 'Quality textbook',
      price: 120,
      category: 'ספרים',
      link: 'https://example.com/book',
      status: 'out-of-stock'
    }
  ]);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nameHe.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSaveProduct = (productData: Partial<StoreProduct>) => {
    if (editingProduct) {
      setProducts(prev => prev.map(product =>
        product.id === editingProduct.id ? { ...product, ...productData } : product
      ));
    } else {
      const newProduct: StoreProduct = {
        id: Date.now().toString(),
        nameHe: '',
        nameEn: '',
        descriptionHe: '',
        descriptionEn: '',
        price: 0,
        category: '',
        link: '',
        status: 'available',
        ...productData
      } as StoreProduct;
      setProducts(prev => [...prev, newProduct]);
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  return (
    <Card className="bg-gradient-to-tr from-gray-50 to-blue-50/30 shadow-xl border-2 border-blue-100 rounded-2xl p-2 sm:p-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold">
            <ShoppingCart className="w-6 h-6 text-blue-500" />
            ניהול החנות הסטודנטיאלית
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)} className="flex items-center gap-2">
                <Plus className="w-4 h-4 ml-2" />
                הוסף מוצר
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'עריכת מוצר' : 'הוספת מוצר חדש'}
                </DialogTitle>
              </DialogHeader>
              <StoreProductForm
                product={editingProduct}
                categories={categories}
                onSave={handleSaveProduct}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filter Section */}
        <div className="mb-6 p-4 bg-white/80 rounded-2xl shadow flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg text-blue-900">סינון ותצוגה מתקדמת</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDescription(v => !v)}
              className="ml-auto"
              title={showDescription ? "הסתר תיאור" : "הצג תיאור"}
            >
              {showDescription ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="חיפוש מוצר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">זמין</SelectItem>
                <SelectItem value="out-of-stock">אזל מהמלאי</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              נקה סינון
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            מציג <b>{filteredProducts.length}</b> מתוך <b>{products.length}</b> מוצרים
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-md bg-white/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם (עברית)</TableHead>
                {showDescription && <TableHead>תיאור</TableHead>}
                <TableHead>מחיר</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-bold text-blue-900">{product.nameHe}</TableCell>
                  {showDescription && (
                    <TableCell className="text-xs text-gray-500">{product.descriptionHe}</TableCell>
                  )}
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 font-bold px-2">₪{product.price}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {product.status === 'available' ? (
                      <Badge className="bg-green-100 text-green-800">זמין</Badge>
                    ) : (
                      <Badge variant="destructive">אזל מהמלאי</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>עריכת מוצר</DialogTitle>
                          </DialogHeader>
                          <StoreProductForm
                            product={product}
                            categories={categories}
                            onSave={handleSaveProduct}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showDescription ? 6 : 5} className="text-center text-gray-400 py-6">
                    אין מוצרים תואמים להצגה.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const StoreProductForm = ({
  product,
  categories,
  onSave
}: {
  product: StoreProduct | null,
  categories: string[],
  onSave: (data: Partial<StoreProduct>) => void
}) => {
  const [formData, setFormData] = useState({
    nameHe: product?.nameHe || '',
    nameEn: product?.nameEn || '',
    descriptionHe: product?.descriptionHe || '',
    descriptionEn: product?.descriptionEn || '',
    price: product?.price || 0,
    category: product?.category || '',
    link: product?.link || '',
    imageUrl: product?.imageUrl || '',
    status: product?.status || 'available'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameHe">שם המוצר (עברית)</Label>
          <Input
            id="nameHe"
            value={formData.nameHe}
            onChange={(e) => setFormData(prev => ({ ...prev, nameHe: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="nameEn">שם המוצר (אנגלית)</Label>
          <Input
            id="nameEn"
            value={formData.nameEn}
            onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="descriptionHe">תיאור (עברית)</Label>
          <Textarea
            id="descriptionHe"
            value={formData.descriptionHe}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionHe: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="descriptionEn">תיאור (אנגלית)</Label>
          <Textarea
            id="descriptionEn"
            value={formData.descriptionEn}
            onChange={(e) => setFormData(prev => ({ ...prev, descriptionEn: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">מחיר (₪)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">קטגוריה</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">סטטוס</Label>
          <Select value={formData.status} onValueChange={(value: 'available' | 'out-of-stock') => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">זמין</SelectItem>
              <SelectItem value="out-of-stock">אזל מהמלאי</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="link">קישור לקנייה</Label>
        <Input
          id="link"
          type="url"
          value={formData.link}
          onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">קישור לתמונה (אופציונלי)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
        />
      </div>

      <Button type="submit" className="w-full mt-4">
        {product ? 'עדכן מוצר' : 'הוסף מוצר'}
      </Button>
    </form>
  );
};

export default StoreManagement;
