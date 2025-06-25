import React, { useEffect, useState } from "react";
import { db } from "../../firebase.config";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../../Components/Modal";

const PRODUCTS_PER_PAGE = 10;

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemOffset, setItemOffset] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterTag, setFilterTag] = useState("all");

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setFilteredProducts(data);
      setCategories([
        ...new Set(data.map((p) => p.category || "Uncategorized")),
      ]);
      const allTags = data.flatMap((p) => p.tags || []);
      setTags(["all products", ...new Set(allTags)]);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && p.published) ||
        (filterStatus === "unpublished" && !p.published);

      const matchesCategory =
        filterCategory === "all" || p.category === filterCategory;

      const matchesTag =
        filterTag === "all" ||
        filterTag === "all products" ||
        (p.tags && p.tags.includes(filterTag));

      return matchesSearch && matchesStatus && matchesCategory && matchesTag;
    });
    setFilteredProducts(filtered);
    setItemOffset(0);
  }, [searchTerm, filterStatus, filterCategory, filterTag, products]);

  const pageCount = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentItems = filteredProducts.slice(
    itemOffset,
    itemOffset + PRODUCTS_PER_PAGE
  );

  const handlePageClick = (event) => {
    const newOffset =
      (event.selected * PRODUCTS_PER_PAGE) % filteredProducts.length;
    setItemOffset(newOffset);
  };

  const handleViewEdit = (id) => navigate(`/dashboard/products/${id}`);
  const handleBackClick = () => navigate("/dashboard");

  const confirmAction = (action) => {
    setModalAction(action);
    setShowModal(true);
  };

  const executeAction = async () => {
    if (!modalAction || selectedProductIds.length === 0) return;
    try {
      for (const id of selectedProductIds) {
        const ref = doc(db, "products", id);
        if (modalAction === "delete") await deleteDoc(ref);
        else if (modalAction === "publish")
          await updateDoc(ref, { published: true });
        else if (modalAction === "unpublish")
          await updateDoc(ref, { published: false });
        else if (modalAction === "feature")
          await updateDoc(ref, { featured: true });
        else if (modalAction === "unfeature")
          await updateDoc(ref, { featured: false });
      }
      toast.success(`Products ${modalAction}d successfully.`);
      setSelectedProductIds([]);
      setShowModal(false);
      setModalAction(null);
    } catch {
      toast.error("An error occurred.");
    }
  };

  const totalProducts = products.length;
  const publishedCount = products.filter((p) => p.published).length;
  const unpublishedCount = totalProducts - publishedCount;
  const featuredCount = products.filter((p) => p.featured).length;
  const unfeaturedCount = totalProducts - featuredCount;

  return (
    <div className="p-6">
      <ToastContainer />
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={executeAction}
        title={`Confirm ${modalAction}`}
        description={`Are you sure you want to ${modalAction} the selected products?`}
      />
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>
      <h1 className="text-3xl text-customOrange text-center font-bold font-opensans mt-8 mb-6">
        All Products
      </h1>

      <div className="flex justify-center mb-8">
        <div className="bg-customOrange p-4 w-full max-w-md rounded-lg text-center">
          <p className="text-white text-lg font-bold">
            Total Products: {totalProducts}
          </p>
          <p className="text-white text-sm">Published: {publishedCount}</p>
          <p className="text-white text-sm">Unpublished: {unpublishedCount}</p>
          <p className="text-white text-sm">Featured: {featuredCount}</p>
          <p className="text-white text-sm">Unfeatured: {unfeaturedCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by product or vendor"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => confirmAction("publish")}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Publish
          </button>
          <button
            onClick={() => confirmAction("unpublish")}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Unpublish
          </button>
          <button
            onClick={() => confirmAction("feature")}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Feature
          </button>
          <button
            onClick={() => confirmAction("unfeature")}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Unfeature
          </button>
          <button
            onClick={() => confirmAction("delete")}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      )}

      <table className="min-w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-4">
              <input
                type="checkbox"
                checked={currentItems.every((item) =>
                  selectedProductIds.includes(item.id)
                )}
                onChange={(e) => {
                  const ids = currentItems.map((item) => item.id);
                  setSelectedProductIds(
                    e.target.checked
                      ? [...new Set([...selectedProductIds, ...ids])]
                      : selectedProductIds.filter((id) => !ids.includes(id))
                  );
                }}
              />
            </th>
            <th className="p-4">Image</th>
            <th className="p-4">Product Name</th>
            <th className="p-4">Vendor Name</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((product) => (
            <tr key={product.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={(e) => {
                    setSelectedProductIds((prev) =>
                      e.target.checked
                        ? [...prev, product.id]
                        : prev.filter((id) => id !== product.id)
                    );
                  }}
                />
              </td>
              <td className="p-4">
                <img
                  src={product.coverImageUrl}
                  alt={product.name}
                  className="h-16 w-16 object-cover rounded"
                />
              </td>
              <td className="p-4">{product.name}</td>
              <td className="p-4">{product.vendorName}</td>
              <td className="p-4">
                <button
                  onClick={() => handleViewEdit(product.id)}
                  className="text-blue-600 hover:underline"
                >
                  View & Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={pageCount}
        onPageChange={handlePageClick}
        containerClassName="flex justify-center mt-6 space-x-2"
        pageClassName="px-3 py-2 bg-gray-200 rounded"
        activeClassName="bg-blue-500 text-white"
        previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
        nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
      />
    </div>
  );
}
