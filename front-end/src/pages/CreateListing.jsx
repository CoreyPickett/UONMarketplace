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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value.split(',').map(v => v.trim()) }));
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

    const data = response.data;

    if (response.status === 201 && data.success) {
      alert('Listing created successfully!');
      console.log("Listing created:", data);
    } else {
      throw new Error('Unexpected response');
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("No response received:", error.message);
    }
    alert('Failed to create listing.');
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <input name="title"
       placeholder="Title" 
       value={formData.title} 
       onChange={handleChange} 
       required />

      <textarea name="description" 
       placeholder="Description" 
       value={formData.description} 
       onChange={handleChange} 
       required />

      <input name="category" 
       placeholder="Category" 
       value={formData.category} 
       onChange={handleChange} 
       required />

      <input name="price" 
       type="number" 
       placeholder="Price (AUD)" 
       value={formData.price} 
       onChange={handleChange} 
       required />

      <input name="quantity" 
       type="number" 
       placeholder="Quantity" 
       value={formData.quantity} 
       onChange={handleChange} 
       required />

      <select name="condition" 
       placeholder="Condition" 
       value={formData.condition} 
       onChange={handleChange} 
       required>
        <option value="">Select Condition</option>
        <option value="New">New</option>
        <option value="Used - Like New">Used - Like New</option>
        <option value="Used - Good">Used - Good</option>
        <option value="Used - Fair">Used - Fair</option>
      </select>

      <input name="location" 
       placeholder="Location" 
       value={formData.location} 
       onChange={handleChange} 
       required />

      <select name="delivery_options" 
       placeholder="Delivery Options" 
       onChange={(e) => handleArrayChange('delivery_options', e.target.value)}
       required>
        <option value="">Select Delivery Option</option>
        <option value="Pickup">Pickup</option>
        <option value="Local Delivery">Local Delivery</option>
        <option value="Shipping">Shipping</option>
      </select>


      <input name="image" 
       placeholder="Image URL" 
       value={formData.image} 
       onChange={handleChange} />

      <input name="seller" 
       placeholder="Seller Name" 
       value={formData.seller} 
       onChange={handleChange}
       required />

      <button type="submit">Create Listing</button>

    </form>
  );
};

export default CreateListing;

