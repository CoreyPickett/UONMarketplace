import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";
import "./CreateListing.css";

const CreateListing = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    quantity: 1,
    condition: '',
    location: '',
    delivery_options: [],
    image: '',
    seller: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(v => v.trim())
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to create a listing.");
        return;
      }

      const token = await user.getIdToken();

      const response = await axios.post('/api/marketplace/create-listing', formData, {
        headers: {
          authtoken: token
        }
      });

      if (response.status === 201 && response.data.success) {
        alert('Listing created successfully!');
        navigate('/marketplace');
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing.');
    }
  };

  return (
    <div className="create-listing-wrapper">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Create New Listing</h1>
      <form onSubmit={handleSubmit} className="create-form">
        <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
        <input name="category" placeholder="Category (e.g. Electronics, Books)" value={formData.category} onChange={handleChange} required />

        <div style={{ display: 'flex', gap: '15px' }}>
          <input name="price" type="number" placeholder="Price (AUD)" value={formData.price} onChange={handleChange} required />
          <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity} onChange={handleChange} required />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <input name="condition" placeholder="Condition (e.g. New, Used)" value={formData.condition} onChange={handleChange} required />
          <input name="location" placeholder="Location (e.g. Callaghan Campus)" value={formData.location} onChange={handleChange} required />
        </div>

        <input name="delivery_options" placeholder="Delivery Options (comma-separated)" onChange={(e) => handleArrayChange('delivery_options', e.target.value)} />
        <input name="image" placeholder="Image URL" value={formData.image} onChange={handleChange} />
        <input name="seller" placeholder="Seller Name" value={formData.seller} onChange={handleChange} />
        <input name="content" placeholder="Content (comma-separated)" onChange={(e) => handleArrayChange('content', e.target.value)} />
        <input name="tagsOrKeywords" placeholder="Tags/Keywords (comma-separated)" onChange={(e) => handleArrayChange('tagsOrKeywords', e.target.value)} />

        <button type="submit">Create Listing</button>
      </form>
    </div>
  );
};

export default CreateListing;
