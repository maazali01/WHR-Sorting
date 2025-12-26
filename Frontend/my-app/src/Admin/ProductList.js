import React, { useState, useEffect, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { FiPlus, FiX, FiPackage, FiEdit2, FiTrash2 } from "react-icons/fi";
import Skeleton from "../Loader/loader";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "Ball",
    imageUrl: "",
  });
  const [editProduct, setEditProduct] = useState(null);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const token = Cookies.get("token");
  const fileInputRef = useRef();
  const editFileInputRef = useRef();

  const fetchProducts = useCallback(() => {
    setLoading(true);
    axios
      .get("http://localhost:4000/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProducts(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Error fetching products.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ---------- ADD ----------
  const handleAddProduct = () => {
    axios
      .post("http://localhost:4000/admin/products", newProduct, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setNewProduct({
          name: "",
          description: "",
          price: "",
          quantity: "",
          category: "Ball",
          imageUrl: "",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchProducts();
        setShowAddModal(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Error adding product.");
      });
  };

  // ---------- DELETE ----------
  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    axios
      .delete(`http://localhost:4000/admin/products/${productToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        fetchProducts();
        setShowDeleteModal(false);
        setProductToDelete(null);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Error deleting product.");
      });
  };

  // ---------- EDIT ----------
  const handleUpdateProduct = () => {
    axios
      .put(
        `http://localhost:4000/admin/products/${editProduct._id}`,
        editProduct,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setEditProduct(null);
        fetchProducts();
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Error updating product.");
      });
  };

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditProduct((prev) => ({ ...prev, imageUrl: reader.result }));
        } else {
          setNewProduct((prev) => ({ ...prev, imageUrl: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditProduct = (product) => {
    setEditProduct({ ...product });
  };

  const cancelEdit = () => setEditProduct(null);

  return (
    <div className="admin-product-list">
      {/* Header */}
      <header className="products-header">
        <div className="header-content">
          <div className="header-icon">
            <FiPackage />
          </div>
          <div className="header-text">
            <h1>Product Management</h1>
            <p>Manage inventory, add new products, and track stock levels</p>
          </div>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}
      
      <div className="product-actions-bar">
        <div className="products-count">
          {!loading && (
            <span className="count-badge">
              <FiPackage size={16} />
              {products.length} Products
            </span>
          )}
        </div>
        <button
          className="add-product-btn"
          onClick={() => setShowAddModal(true)}
          title="Add Product"
        >
          <FiPlus size={18} />
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="products-loading">
          <div className="loading-grid">
            <Skeleton type="grid" count={6} />
          </div>
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="product-list">
            {products.map((product) => (
              <div className="product-item" key={product._id}>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} />
                )}
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <p>
                  <strong>${product.price}</strong> | Qty: {product.quantity}
                </p>

                {/* ✅ Stock Status Indicator */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span className="category-tag">{product.category}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor:
                        product.quantity <= 0 ? "#fee2e2" : "#d1fae5",
                      color: product.quantity <= 0 ? "#991b1b" : "#065f46",
                    }}
                  >
                    {product.quantity <= 0 ? "Out of Stock" : "Available"}
                  </span>
                </div>

                <div className="actions">
                  <button
                    onClick={() => startEditProduct(product)}
                    className="edit-btn"
                  >
                    <FiEdit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setProductToDelete(product);
                      setShowDeleteModal(true);
                    }}
                    className="delete-btn"
                  >
                    <FiTrash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <FiPackage size={48} />
          <p>No products found. Add your first product!</p>
        </div>
      )}

      {/* Modal Add */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-boxx" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerr">
              <FiPackage size={22} />
              <h3>Add New Product</h3>
              <button
                className="closee-btn"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-contentt">
              <div className="form-group">
                <label className="form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter product name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  className="modal-input"
                  placeholder="Enter product description"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Price <span className="required">*</span>
                </label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Quantity <span className="required">*</span>
                </label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="0"
                  value={newProduct.quantity}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, quantity: e.target.value })
                  }
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="modal-input"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                >
                  <option value="Ball">Ball</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Box">Box</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image</label>
                <input
                  className="modal-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </div>

              <button className="save-btn" onClick={handleAddProduct}>
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editProduct && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerr">
              <FiPackage size={22} />
              <h3>Edit Product</h3>
              <button className="closee-btn" onClick={cancelEdit} aria-label="Close">
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-contentt">
              <div className="form-group">
                <label className="form-label">
                  Product Name <span className="required">*</span>
                </label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter product name"
                  value={editProduct.name}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  className="modal-input"
                  placeholder="Enter product description"
                  value={editProduct.description}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Price <span className="required">*</span>
                </label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="0.00"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, price: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Quantity <span className="required">*</span>
                </label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="0"
                  value={editProduct.quantity}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, quantity: e.target.value })
                  }
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="modal-input"
                  value={editProduct.category}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, category: e.target.value })
                  }
                >
                  <option value="Ball">Ball</option>
                  <option value="Fruit">Fruit</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Box">Box</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image</label>
                <input
                  className="modal-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, true)}
                  ref={editFileInputRef}
                />
              </div>

              <button className="save-btn" onClick={handleUpdateProduct}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-boxx small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerr">
              <FiTrash2 size={22} color="#ef4444" />
              <h3>Confirm Delete</h3>
              <button
                className="closee-btn"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-contentt">
              <p>
                Are you sure you want to delete{" "}
                <strong>{productToDelete?.name}</strong>?<br />
                This action cannot be undone.
              </p>
              <div className="delete-actions">
                <button
                  className="cancel-btn2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button className="delete-confirm" onClick={handleDeleteProduct}>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
