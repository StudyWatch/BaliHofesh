import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart, Plus, Edit, Trash2, Search, Filter, Eye, EyeOff, Image,
  BadgePercent, Star, DollarSign, Heart, TrendingUp, Gift,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// טיפוס מוצר
interface Product {
  id: string;
  name_he: string;
  name_en: string;
  description_he?: string;
  description_en?: string;
  price: number;
  original_price?: number;
  category: string;
  tags?: string[];
  image_url?: string;
  link?: string;
  is_subsidized?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
  is_exclusive?: boolean;
  created_at?: string;
  updated_at?: string;
  type?: string;
  benefit_value?: number;
  is_monetizable?: boolean;
  priority?: boolean;
}

// קומפוננטת ניהול חנות
const StoreManagement = () => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  // שליפת מוצרים
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  // קטגוריות ייחודיות
  const uniqueCategories = Array.from(
    new Set(products.map((p) => (p.category || '').trim()).filter(Boolean))
  );

  // הוספה/עדכון מוצר
  const upsertProduct = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      // תיקון: ודא שדות חובה (type safety)
      if (!productData.name_he || !productData.name_en || !productData.price || !productData.category) {
        throw new Error('כל שדות החובה חייבים להיות מלאים!');
      }
      if (editingProduct) {
        // עדכון
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        // יצירה – שלח אובייקט מלא, לא partial!
        const toInsert = {
          name_he: productData.name_he,
          name_en: productData.name_en,
          description_he: productData.description_he ?? '',
          description_en: productData.description_en ?? '',
          price: Number(productData.price),
          category: productData.category,
          link: productData.link ?? '',
          image_url: productData.image_url ?? '',
          is_exclusive: productData.is_exclusive ?? false,
          is_popular: productData.is_popular ?? false,
          is_new: productData.is_new ?? false,
          is_subsidized: productData.is_subsidized ?? false,
          is_monetizable: productData.is_monetizable ?? false,
          type: productData.type ?? '',
          created_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from('products')
          .insert([toInsert]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'המוצר עודכן!' : 'מוצר נוסף!');
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      toast.error('שגיאה: ' + (err?.message || 'פעולה נכשלה'));
    },
  });

  // מחיקה
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('המוצר נמחק!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // ניקוי פילטרים
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
  };

  // סינון מתקדם
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name_he?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name_en?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || (product.category && product.category.trim() === categoryFilter.trim());
    const matchesStatus = !statusFilter || (
      (statusFilter === 'available' && !product.is_exclusive) ||
      (statusFilter === 'out-of-stock' && product.is_exclusive)
    );
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // תגים סטטוס מיוחדים
  const productBadges = (product: Product) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {product.is_new && <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><Star className="w-3 h-3" />חדש</Badge>}
      {product.is_popular && <Badge className="bg-pink-100 text-pink-700 flex items-center gap-1"><TrendingUp className="w-3 h-3" />פופולרי</Badge>}
      {product.is_subsidized && <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1"><Gift className="w-3 h-3" />מסובסד</Badge>}
      {product.is_monetizable && <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1"><DollarSign className="w-3 h-3" />רווח</Badge>}
      {product.is_exclusive && <Badge className="bg-gray-200 text-gray-700">בלעדי</Badge>}
    </div>
  );

  return (
    <Card className="bg-gradient-to-tr from-gray-50 to-blue-100/40 shadow-2xl border-2 border-blue-100 rounded-3xl p-2 sm:p-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-2xl font-extrabold">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            ניהול החנות הסטודנטיאלית
          </CardTitle>
          <Dialog open={!!editingProduct} onOpenChange={(v) => { if (!v) setEditingProduct(null); }}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingProduct(null)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-800 text-white font-bold shadow"
              >
                <Plus className="w-5 h-5 ml-2" />
                הוסף מוצר
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-2xl bg-white/95 shadow-2xl border border-blue-200">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'עריכת מוצר' : 'הוספת מוצר חדש'}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                product={editingProduct}
                categories={uniqueCategories}
                onSave={data => upsertProduct.mutate(data)}
                isLoading={upsertProduct.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* פילטרים */}
        <div className="mb-8 p-4 bg-white/80 rounded-2xl shadow flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg text-blue-900">סינון ותצוגה מתקדמת</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDescription((v) => !v)}
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
                <SelectItem value="">כל הקטגוריות</SelectItem>
                {uniqueCategories
                  .filter(category => !!category)
                  .map((category) => (
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
                <SelectItem value="">כל הסטטוסים</SelectItem>
                <SelectItem value="available">זמין</SelectItem>
                <SelectItem value="out-of-stock">בלעדי / לא זמין</SelectItem>
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
        {/* טבלת מוצרים */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-lg bg-white/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תמונה</TableHead>
                <TableHead>שם (עברית)</TableHead>
                {showDescription && <TableHead>תיאור</TableHead>}
                <TableHead>מחיר</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>תגים</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-blue-50/40">
                  <TableCell>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name_he}
                        className="w-16 h-16 rounded-xl object-cover shadow"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-blue-900">{product.name_he}</TableCell>
                  {showDescription && (
                    <TableCell className="text-xs text-gray-600">{product.description_he}</TableCell>
                  )}
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 font-bold px-2">
                      ₪{product.price}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {productBadges(product)}
                  </TableCell>
                  <TableCell>
                    {product.is_exclusive ? (
                      <Badge variant="destructive">בלעדי/לא זמין</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">זמין</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                        title="ערוך מוצר"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteProduct.mutate(product.id)}
                        title="מחק מוצר"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={showDescription ? 8 : 7} className="text-center text-gray-400 py-6">
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

// טופס עריכת מוצר
const ProductForm = ({
  product,
  categories,
  onSave,
  isLoading,
}: {
  product: Product | null;
  categories: string[];
  onSave: (data: Partial<Product>) => void;
  isLoading?: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name_he: product?.name_he || '',
    name_en: product?.name_en || '',
    description_he: product?.description_he || '',
    description_en: product?.description_en || '',
    price: product?.price || 0,
    category: product?.category || '',
    link: product?.link || '',
    image_url: product?.image_url || '',
    is_exclusive: product?.is_exclusive || false,
    is_popular: product?.is_popular || false,
    is_new: product?.is_new || false,
    is_subsidized: product?.is_subsidized || false,
    is_monetizable: product?.is_monetizable || false,
    type: product?.type || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_he || !formData.name_en || !formData.price || !formData.category) {
      toast.error('חובה למלא שם מוצר בעברית, באנגלית, קטגוריה ומחיר!');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name_he">שם המוצר (עברית)</Label>
          <Input
            id="name_he"
            value={formData.name_he}
            onChange={(e) => setFormData((prev) => ({ ...prev, name_he: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="name_en">שם המוצר (אנגלית)</Label>
          <Input
            id="name_en"
            value={formData.name_en}
            onChange={(e) => setFormData((prev) => ({ ...prev, name_en: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description_he">תיאור (עברית)</Label>
          <Textarea
            id="description_he"
            value={formData.description_he}
            onChange={(e) => setFormData((prev) => ({ ...prev, description_he: e.target.value }))}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="description_en">תיאור (אנגלית)</Label>
          <Textarea
            id="description_en"
            value={formData.description_en}
            onChange={(e) => setFormData((prev) => ({ ...prev, description_en: e.target.value }))}
            rows={2}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">מחיר (₪)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">קטגוריה</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((category) => !!category)
                .map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="is_exclusive">סטטוס</Label>
          <Select
            value={formData.is_exclusive ? 'yes' : 'no'}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, is_exclusive: val === 'yes' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">זמין</SelectItem>
              <SelectItem value="yes">בלעדי/לא זמין</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="link">קישור לקנייה</Label>
          <Input
            id="link"
            type="url"
            value={formData.link}
            onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="image_url">קישור לתמונה</Label>
          <Input
            id="image_url"
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
          />
        </div>
      </div>
      {/* תגים מיוחדים */}
      <div className="flex flex-wrap gap-3 mt-4">
        <Label className="flex items-center gap-2 cursor-pointer">
          <Input type="checkbox" checked={formData.is_new} onChange={e => setFormData(prev => ({ ...prev, is_new: e.target.checked }))} />
          <Star className="w-4 h-4 text-green-600" /> חדש
        </Label>
        <Label className="flex items-center gap-2 cursor-pointer">
          <Input type="checkbox" checked={formData.is_popular} onChange={e => setFormData(prev => ({ ...prev, is_popular: e.target.checked }))} />
          <TrendingUp className="w-4 h-4 text-pink-500" /> פופולרי
        </Label>
        <Label className="flex items-center gap-2 cursor-pointer">
          <Input type="checkbox" checked={formData.is_subsidized} onChange={e => setFormData(prev => ({ ...prev, is_subsidized: e.target.checked }))} />
          <Gift className="w-4 h-4 text-purple-500" /> מסובסד
        </Label>
        <Label className="flex items-center gap-2 cursor-pointer">
          <Input type="checkbox" checked={formData.is_monetizable} onChange={e => setFormData(prev => ({ ...prev, is_monetizable: e.target.checked }))} />
          <DollarSign className="w-4 h-4 text-yellow-600" /> אפיק רווח
        </Label>
      </div>
      <Button type="submit" className="w-full mt-6 text-lg py-2 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-800 text-white font-bold shadow" disabled={isLoading}>
        {isLoading ? 'שומר...' : product ? 'עדכן מוצר' : 'הוסף מוצר'}
      </Button>
    </form>
  );
};

export default StoreManagement;
