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
import { ShoppingCart, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const categories = ['חטיפים', 'ציוד', 'טכנולוגיה', 'ספרים', 'כלי כתיבה'];

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            ניהול החנות הסטודנטיאלית
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
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
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" />
            <h3 className="font-medium">סינון ותצווגה</h3>
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
          <div className="mt-3 text-sm text-gray-600">
            מציג {filteredProducts.length} מתוך {products.length} מוצרים
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם (עברית)</TableHead>
              <TableHead>מחיר</TableHead>
              <TableHead>קטגוריה</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.nameHe}</TableCell>
                <TableCell>₪{product.price}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
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
          </TableBody>
        </Table>
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

      <Button type="submit" className="w-full">
        {product ? 'עדכן מוצר' : 'הוסף מוצר'}
      </Button>
    </form>
  );
};

export default StoreManagement;
