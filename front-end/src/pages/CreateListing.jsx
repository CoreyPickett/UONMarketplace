import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateListing.css"; 

export default function CreateListing() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [location, setLocation] = useState("");

 async function handleSubmit(e) {
  e.preventDefault();

  const listing = {
    name: title,               
    des: description,         
    AUD: price,                
    cat: category,             
    quantity: 1,            
    condition: "Unkown",    //default value    
    location: location,        
    delivery: "Pickup",     //default value   
    image: ""                  
  };

  try {
    const response = await fetch("/api/marketplace/create-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(listing),
    });

    if (response.ok) {
      alert("Listing created successfully!");
      navigate("/marketplace");
    } else {
      alert("Failed to create listing");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong");
  }
}

  return (
    <div className="create-listing-wrapper">
      <h1>Create New Listing</h1>
      <form className="create-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Price"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="General">General</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Services">Services</option>
          <option value="Clothing">Clothing</option>
        </select>
        <button type="submit">Post Listing</button>
      </form>
    </div>
  );
}
