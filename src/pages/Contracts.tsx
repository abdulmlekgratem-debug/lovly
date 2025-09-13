import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Printer, Eye } from 'lucide-react';
import { ContractPrintDialog } from '@/components/Contract';

// Mock data for contracts
const mockContracts = [
  {
    id: '1',
    Contract_Number: 'C-2024-001',
    customer_name: 'أحمد محمد الصالح',
    ad_type: 'إعلان تجاري',
    start_date: '2024-01-15',
    end_date: '2024-07-15',
    rent_cost: 5000,
    status: 'نشط',
    phoneNumber: '0912345678',
    billboards: [
      {
        id: '1',
        name: 'لوحة شارع الجمهورية',
        location: 'شارع الجمهورية - طرابلس',
        size: '6x4 متر',
        image: '/billboard-city.jpg'
      }
    ]
  },
  {
    id: '2',
    Contract_Number: 'C-2024-002',
    customer_name: 'شركة النور للتجارة',
    ad_type: 'إعلان مؤسسي',
    start_date: '2024-02-01',
    end_date: '2024-08-01',
    rent_cost: 7500,
    status: 'نشط',
    phoneNumber: '0923456789',
    billboards: [
      {
        id: '2',
        name: 'لوحة الطريق الساحلي',
        location: 'الطريق الساحلي - طرابلس',
        size: '8x6 متر',
        image: '/billboard-coastal.jpg'
      }
    ]
  },
  {
    id: '3',
    Contract_Number: 'C-2024-003',
    customer_name: 'مطعم الأصالة',
    ad_type: 'إعلان مطعم',
    start_date: '2024-03-01',
    end_date: '2024-12-01',
    rent_cost: 3000,
    status: 'منتهي',
    phoneNumber: '0934567890',
    billboards: [
      {
        id: '3',
        name: 'لوحة الطريق السريع',
        location: 'الطريق السريع - طرابلس',
        size: '4x3 متر',
        image: '/billboard-highway.jpg'
      }
    ]
  }
];

export default function Contracts() {
  const [contracts, setContracts] = useState(mockContracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContracts, setFilteredContracts] = useState(mockContracts);

  useEffect(() => {
    const filtered = contracts.filter(contract =>
      contract.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.Contract_Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.ad_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط':
        return 'bg-green-100 text-green-800';
      case 'منتهي':
        return 'bg-red-100 text-red-800';
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-LY');
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('ar-LY')} د.ل`;
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة العقود</h1>
          <p className="text-gray-600 mt-2">عرض وإدارة جميع عقود إيجار اللوحات الإعلانية</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          عقد جديد
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث في العقود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map((contract) => (
          <Card key={contract.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{contract.Contract_Number}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{contract.customer_name}</p>
                </div>
                <Badge className={getStatusColor(contract.status)}>
                  {contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">نوع الإعلان:</p>
                  <p className="text-sm text-gray-600">{contract.ad_type}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">تاريخ البداية:</p>
                    <p className="text-sm text-gray-600">{formatDate(contract.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">تاريخ النهاية:</p>
                    <p className="text-sm text-gray-600">{formatDate(contract.end_date)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">قيمة الإيجار:</p>
                  <p className="text-lg font-bold text-green-600">{formatPrice(contract.rent_cost)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">عدد اللوحات:</p>
                  <p className="text-sm text-gray-600">{contract.billboards.length} لوحة</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    عرض
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    تعديل
                  </Button>
                  <ContractPrintDialog 
                    contract={contract}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        <Printer className="h-4 w-4 mr-2" />
                        طباعة
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">لا توجد عقود تطابق البحث</p>
        </div>
      )}
    </div>
  );
}