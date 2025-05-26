"use client"
import { useUser } from "@/context/UserContext";
import { ProductAllTypeInterfact } from "@/data/allProducts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from 'react';
import { MdDelete, MdEdit, MdSearch, MdClear, MdLabel } from "react-icons/md";
import Image from "next/image";
import toast from "react-hot-toast";

const AdminProductsPage = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ProductAllTypeInterfact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductAllTypeInterfact | null>(null);
  const pageSize = 9;

  // Filter the products by search query
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = products.filter(
        (p) =>
          // Search in name
          p.name.toLowerCase().includes(lowerQuery) ||
          // Search in description
          p.description.toLowerCase().includes(lowerQuery) ||
          // Search in SKU (part code)
          p.sku?.toLowerCase().includes(lowerQuery) ||
          // Search in categories
          p.categories?.some(cat => cat.toLowerCase().includes(lowerQuery))
      );
    }
    return filtered;
  }, [products, searchQuery]);

  // Get unique categories for tag filtering
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      product.categories?.forEach(category => {
        categories.add(category);
      });
    });
    return Array.from(categories).sort();
  }, [products]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const currentPageProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleConfirmDelete = async (productId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to delete product");
        return;
      }
      alert("Product deleted successfully.");
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error deleting product");
    }
  };

  const exportToExcel = () => {
    // Show loading toast
    const loadingToast = toast.loading("Preparing export...");

    try {
      // Define the type for our export row
      type ExportRowType = {
        "S.No": number;
        "Part Code": string;
        "Product Name": string;
        "Description": string;
        "Category": string;
        "Sub Category": string;
        "Price": string;
        "Stock": string;
        "Image URLs": string;
      };

      // Use filteredProducts instead of all products
      const exportData: ExportRowType[] = filteredProducts.map((product, index) => {
        return {
          "S.No": index + 1,
          "Part Code": product.sku || "N/A",
          "Product Name": product.name || "N/A",
          "Description": product.description || "N/A",
          "Category": product.category || "N/A",
          "Sub Category": product.subCategory || "N/A",
          "Price": product.price ? `₹${product.price}` : "N/A",
          "Stock": product.stock?.toString() || "N/A",
          "Image URLs": product.images?.join(", ") || "N/A"
        };
      });

      // Check if there's data to export
      if (exportData.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("No products to export");
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csvRows = [];

      // Add headers
      csvRows.push(headers.join(','));

      // Add data rows
      for (const row of exportData) {
        const values = headers.map(header => {
          const value = row[header as keyof ExportRowType];
          const escaped = ('' + value).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      // Create a link to download
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const fileName = searchQuery 
        ? `Products_Export_Filtered_${new Date().toLocaleDateString()}.csv`
        : `Products_Export_All_${new Date().toLocaleDateString()}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      toast.dismiss(loadingToast);
      toast.success(`Successfully exported ${exportData.length} products`);

    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to export products');
    }
  };

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      const data = await getProductsFromAPI();
      setProducts(data);
    }

    if (!user) {
      router.replace("/");
      return;
    } else {
      fetchData();
    }
  }, [user, router]);

  if (!mounted) {
    return null;
  }

  async function getProductsFromAPI(): Promise<ProductAllTypeInterfact[]> {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/products`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        alert(data.error || "Failed to fetch products");
        return [];
      }
      return data.data;
    } catch (error) {
      setLoading(false);
      console.error(error);
      return [];
    }
  }

  return (
    <section className="px-14 pt-10 pb-28 min-h-[60vh]">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Product Management</h1>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href={"/admin-products/add-product"}>
              <div className="inline-block bg-blue-800 hover:bg-blue-900 cursor-pointer px-8 py-3 text-white font-semibold rounded-md text-lg">
                Add New Product
              </div>
            </Link>
            <button
              onClick={exportToExcel}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md text-lg flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export {searchQuery ? "Filtered" : "All"} Products
            </button>
          </div>
          <button
            onClick={() => window.open('/catalogue.pdf', '_blank')}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-lg flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Catalogue
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by part code, name, description, or category..."
                    className="w-full sm:w-96 pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <MdClear className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 flex gap-4">
              <span>Total Products: {products.length}</span>
              {searchQuery && (
                <span className="text-blue-600">{filteredProducts.length} products found</span>
              )}
            </div>
          </div>

          {/* Category Tags */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-gray-600">
              <MdLabel className="h-5 w-5" />
              <span className="text-sm font-medium">Categories:</span>
            </div>
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSearchQuery(category)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Table Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    </div>
                  </td>
                </tr>
              ) : currentPageProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? "No products found matching your search" : "No products available"}
                  </td>
                </tr>
              ) : (
                currentPageProducts.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                      <div className="line-clamp-2">{product.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.categories?.map((category, idx) => (
                          <span
                            key={`${product._id}-${idx}`}
                            className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-16 w-16 rounded-md overflow-hidden">
                        <Image
                          src={product.images?.[0] || "/logo.png"}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin-products/edit-product/${product._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <MdEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <MdDelete className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <button
            onClick={() => window.open('/catalogue.pdf', '_blank')}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md text-lg flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Catalogue
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the product "{selectedProduct.name}"?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(selectedProduct._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminProductsPage; 