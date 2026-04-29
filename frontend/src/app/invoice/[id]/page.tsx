"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InvoiceEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      try {
        const docRef = doc(db, "invoices", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            invoiceNumber: data.invoiceNumber || "",
            billingDate: data.billingDate || "",
            dueDate: data.dueDate || "",
            vendorName: data.vendorName || "",
            buildingName: data.buildingName || "",
            totalAmount: data.totalAmount || "",
            currency: data.currency || "THB",
            vatAmount: data.vatAmount || ""
          });
        } else {
          setError("Invoice not found.");
        }
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        setError("Error fetching invoice. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      const docRef = doc(db, "invoices", id as string);

      const updateData = {
        invoiceNumber: formData.invoiceNumber,
        billingDate: formData.billingDate,
        dueDate: formData.dueDate,
        vendorName: formData.vendorName,
        buildingName: formData.buildingName,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        currency: formData.currency,
        vatAmount: parseFloat(formData.vatAmount) || 0,
        extractionStatus: "user_verified",
        isUserVerified: true,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);

      // Navigate to success
      router.push("/success");
    } catch (err: any) {
      console.error("Error saving invoice:", err);
      setError("Failed to save invoice.");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading invoice data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Invoice Data</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
          <input
            type="text"
            name="vendorName"
            value={formData.vendorName}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Building Name</label>
          <input
            type="text"
            name="buildingName"
            value={formData.buildingName}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Billing Date</label>
            <input
              type="text"
              name="billingDate"
              value={formData.billingDate}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="text"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Amount</label>
            <input
              type="number"
              step="0.01"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">VAT Amount</label>
            <input
              type="number"
              step="0.01"
              name="vatAmount"
              value={formData.vatAmount}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <input
            type="text"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-black"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 mt-6"
        >
          {saving ? "Saving..." : "Save and Confirm"}
        </button>
      </form>
    </div>
  );
}