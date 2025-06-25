import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, storage } from "../../firebase.config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChevronLeft, FaTrash, FaExclamationTriangle } from "react-icons/fa";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: 0,
    published: false,
    isFeatured: false,
    tags: [],
    variants: [],
    coverImageUrl: "",
    galleryUrls: [],
  });
  const [newCoverImageFile, setNewCoverImageFile] = useState(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [showUnfeatureModal, setShowUnfeatureModal] = useState(false);

  // Load product from Firestore
  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProduct(docSnap.data());
          } else {
            toast.error("Product not found");
            navigate(-1);
          }
        } catch (error) {
          toast.error("Failed to load product");
        }
      };
      fetchProduct();
    }
  }, [id, navigate]);

  const handleBackClick = () => {
    navigate(-1);
  };

  // Helper to upload file to Firebase Storage and get URL
  const uploadFileAndGetUrl = async (file, pathPrefix) => {
    const storageRef = ref(storage, `${pathPrefix}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTagChange = (index, value) => {
    const newTags = [...product.tags];
    newTags[index] = value;
    setProduct((prev) => ({ ...prev, tags: newTags }));
  };

  const addTag = () => {
    setProduct((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), ""],
    }));
  };

  const removeTag = (index) => {
    const newTags = product.tags.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, tags: newTags }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...(product.variants || [])];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProduct((prev) => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), { color: "", size: "", stock: 0 }],
    }));
  };

  const removeVariant = (index) => {
    const newVariants = product.variants.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, variants: newVariants }));
  };

  const removeGalleryImage = (index) => {
    // Remove from gallery URLs and also from new gallery files if needed
    const newGalleryUrls = product.galleryUrls.filter((_, i) => i !== index);
    setProduct((prev) => ({ ...prev, galleryUrls: newGalleryUrls }));
  };

  // Handle Save
  const handleSave = async () => {
    try {
      let coverImageUrl = product.coverImageUrl;
      let galleryUrls = [...(product.galleryUrls || [])];

      // Upload new cover image if selected
      if (newCoverImageFile) {
        coverImageUrl = await uploadFileAndGetUrl(
          newCoverImageFile,
          "product_covers"
        );
      }

      // Upload new gallery images if any
      if (newGalleryFiles.length > 0) {
        for (const file of newGalleryFiles) {
          const url = await uploadFileAndGetUrl(file, "product_gallery");
          galleryUrls.push(url);
        }
      }

      // Update Firestore doc
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, {
        ...product,
        coverImageUrl,
        galleryUrls,
      });

      // Update local state
      setProduct((prev) => ({
        ...prev,
        coverImageUrl,
        galleryUrls,
      }));

      setNewCoverImageFile(null);
      setNewGalleryFiles([]);
      toast.success("Product updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Product deleted!");
      navigate(-1);
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleUnpublish = async () => {
    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, { published: false });
      setProduct((prev) => ({ ...prev, published: false }));
      toast.success("Product unpublished");
      setShowUnpublishModal(false);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to unpublish product");
    }
  };

  const handleUnfeature = async () => {
    try {
      const docRef = doc(db, "products", id);
      await updateDoc(docRef, { featured: false });
      setProduct((prev) => ({ ...prev, featured: false }));
      toast.success("Product unfeatured");
      setShowUnfeatureModal(false);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to unfeature product");
    }
  };
  return (
    <div className="p-6 space-y-6">
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <ToastContainer />

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <FaTrash />
              <h2 className="text-lg font-semibold">Confirm Delete</h2>
            </div>
            <p>Are you sure you want to delete this product?</p>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Modal */}
      {showUnpublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <div className="flex items-center gap-3 text-orange-600 mb-4">
              <FaExclamationTriangle />
              <h2 className="text-lg font-semibold">Confirm Unpublish</h2>
            </div>
            <p>Are you sure you want to unpublish this product?</p>
            <div className="mt-4 flex justify-end gap-4">
              <button
                onClick={() => setShowUnpublishModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpublish}
                className="px-4 py-2 bg-orange-500 text-white rounded"
              >
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl text-customOrange font-bold font-opensans text-center mb-4">
        View & Edit Product: {product.name}
      </h1>

      {/* Edit toggle button */}
      <button
        onClick={() => setIsEditing(!isEditing)}
        className={`mb-4 px-4 py-2 rounded ${
          isEditing ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}
      >
        {isEditing ? "Cancel Edit" : "Edit"}
      </button>

      {product.coverImageUrl && (
        <div className="mb-4 justify-center items-center">
          <img
            src={product.coverImageUrl}
            alt={product.name}
            className="w-60 h-60 items-center justify-center object-cover rounded"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 shadow-sm bg-white">
          <label className="block mb-4">
            Upload New Cover Image:
            <input
              type="file"
              onChange={(e) => setNewCoverImageFile(e.target.files[0])}
              className="block mt-1"
              disabled={!isEditing}
            />
          </label>

          {/* Show existing gallery images */}
          {product.galleryUrls && product.galleryUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {product.galleryUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  {isEditing && (
                    <button
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <label className="block mb-4">
            Name:
            <input
              name="name"
              value={product.name || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
              disabled={!isEditing}
            />
          </label>

          <label className="block mb-4">
            Description:
            <textarea
              name="description"
              value={product.description || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
              disabled={!isEditing}
            />
          </label>

          <label className="block mb-4">
            Price:
            <input
              type="number"
              name="price"
              value={product.price || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
              disabled={!isEditing}
            />
          </label>

          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              name="published"
              checked={product.published || false}
              onChange={handleChange}
              disabled={!isEditing}
            />
            Published
          </label>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              name="isFeatured"
              checked={product.isFeatured || false}
              onChange={handleChange}
              disabled={!isEditing}
            />
            Featured
          </label>
        </div>

        {/* Tags Section */}
        <div className="border rounded-lg p-4 shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4 text-customOrange">Tags</h2>
          {(product.tags || []).map((tag, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={tag}
                onChange={(e) => handleTagChange(i, e.target.value)}
                className="p-2 border rounded w-full"
                disabled={!isEditing}
              />
              {isEditing && (
                <button
                  onClick={() => removeTag(i)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {isEditing && (
            <button
              onClick={addTag}
              className="bg-green-500 text-white px-4 py-2 rounded"
              type="button"
            >
              Add Tag
            </button>
          )}

          {/* Variants Section */}
          <div className=" bg-white md:col-span-2 mt-8">
            <h2 className="text-lg font-semibold mb-4 text-customOrange">
              Variants
            </h2>
            {(product.variants || []).map((variant, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 mb-2">
                <input
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) =>
                    handleVariantChange(i, "color", e.target.value)
                  }
                  className="p-2 border rounded"
                  disabled={!isEditing}
                />
                <input
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) =>
                    handleVariantChange(i, "size", e.target.value)
                  }
                  className="p-2 border rounded"
                  disabled={!isEditing}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(i, "stock", Number(e.target.value))
                  }
                  className="p-2 border rounded"
                  disabled={!isEditing}
                />
                {isEditing && (
                  <button
                    onClick={() => removeVariant(i)}
                    className="bg-red-500 text-white px-4 rounded"
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={addVariant}
                className="bg-green-500 text-white px-4 py-2 rounded"
                type="button"
              >
                Add Variant
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSave}
            className="bg-customOrange text-white px-6 py-2 rounded"
          >
            Save
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-6 py-2 rounded flex items-center gap-2"
          >
            <FaTrash /> Delete
          </button>

          {product.published && (
            <button
              onClick={() => setShowUnpublishModal(true)}
              className="bg-orange-500 text-white px-6 py-2 rounded flex items-center gap-2"
            >
              <FaExclamationTriangle /> Unpublish
            </button>
          )}

          {product.featured && (
            <button
              onClick={() => setShowUnfeatureModal(true)}
              className="bg-yellow-500 text-white px-6 py-2 rounded flex items-center gap-2"
            >
              <FaExclamationTriangle /> Unfeature
            </button>
          )}

          {/* Modals for confirmation */}
          {showUnpublishModal && (
            <div className="modal">
              <p>Are you sure you want to unpublish this product?</p>
              <button onClick={handleUnpublish}>Yes, Unpublish</button>
              <button onClick={() => setShowUnpublishModal(false)}>
                Cancel
              </button>
            </div>
          )}

          {showUnfeatureModal && (
            <div className="modal">
              <p>Are you sure you want to unfeature this product?</p>
              <button onClick={handleUnfeature}>Yes, Unfeature</button>
              <button onClick={() => setShowUnfeatureModal(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
