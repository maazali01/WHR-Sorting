import React, { useState, useEffect, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { FiPlus, FiX, FiPackage, FiEdit2, FiTrash2 } from "react-icons/fi";
import Loader from "../Loader/loader";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
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
     {error && <p className="admin-error">{error}</p>}
      <h2>Manage Products</h2>

      {products.length > 0 ? (
        <>
          <h3>Existing Products</h3>
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
                <span className="category-tag">{product.category}</span>
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
        <div><Loader /></div>
      )}

      {/* Floating Add Button */}
      <button
        className="fab-btn"
        onClick={() => setShowAddModal(true)}
        title="Add Product"
      >
        <FiPlus size={24} />
      </button>

      {/* Modal Add */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <FiPackage size={20} />
              <h3>Add New Product</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-content">
              <input
                className="modal-input"
                type="text"
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
              <textarea
                className="modal-input"
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
              <input
                className="modal-input"
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
              <input
                className="modal-input"
                type="number"
                placeholder="Quantity"
                value={newProduct.quantity}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, quantity: e.target.value })
                }
              />
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
              <input
                className="modal-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
              />
              <button className="save-btn" onClick={handleAddProduct}>
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editProduct && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <FiPackage size={20} />
              <h3>Edit Product</h3>
              <button className="close-btn" onClick={cancelEdit}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-content">
              <input
                className="modal-input"
                type="text"
                value={editProduct.name}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, name: e.target.value })
                }
              />
              <textarea
                className="modal-input"
                value={editProduct.description}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    description: e.target.value,
                  })
                }
              />
              <input
                className="modal-input"
                type="number"
                value={editProduct.price}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, price: e.target.value })
                }
              />
              <input
                className="modal-input"
                type="number"
                value={editProduct.quantity}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, quantity: e.target.value })
                }
              />
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
              <input
                className="modal-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, true)}
                ref={editFileInputRef}
              />
              <button className="save-btn" onClick={handleUpdateProduct}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box small">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button
                className="close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete{" "}
                <strong>{productToDelete?.name}</strong>?
              </p>
              <div className="delete-actions">
                <button
                  className="cancel-btn2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button className="delete-confirm" onClick={handleDeleteProduct}>
                  Delete
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
