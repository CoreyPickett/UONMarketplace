// controllers/marketplaceController.js
import { getDb } from '../config/db.js'; // optional if you expose db this way

// GET request for Whole Marketplace
export async function getAllListings(req, res) {
  try {
    const db = await getDb();

    const listings = await db.collection('items')
      .find({ sold: { $ne: true } }) // exclude sold items
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
}

// GET request for Advanced Search Function
export async function searchListings(req, res) {
  try {
    const {
      query: rawQuery,
      category,
      minPrice,
      maxPrice,
      sort = "recent",
    } = req.query;

    const query = rawQuery?.trim() || "";
    const filters = {};

    // Text search across multiple fields
    if (query) {
      const regex = new RegExp(query, "i");
      filters.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { location: regex },
        { seller: regex },
      ];
    }

    // Category filter
    if (category) filters.category = category;

    // Price range filter
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min)) filters.price = { ...filters.price, $gte: min };
    if (!Number.isNaN(max)) filters.price = { ...filters.price, $lte: max };

    // Sorting logic
    let sortOption = { createdAt: -1 };
    if (sort === "priceAsc") sortOption = { price: 1 };
    if (sort === "priceDesc") sortOption = { price: -1 };
    if (sort === "titleAsc") sortOption = { title: 1 };

    const db = await getDb();
    const listings = await db.collection("items")
      .find(filters)
      .sort(sortOption)
      .toArray();

    res.status(200).json(listings);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
}

// GET request for purchased listings by buyer
export async function getPurchasedListings(req, res) {
  try {
    const db = await getDb();
    const uid = req.query.uid;

    if (!uid) {
      return res.status(400).json({ error: "Missing UID" });
    }

    const listings = await db.collection('items')
      .find({ buyerUid: uid })
      .sort({ soldAt: -1 }) // optional: sort by purchase date
      .toArray();

    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching purchased listings:", error);
    res.status(500).json({ error: "Failed to fetch purchased listings" });
  }
}

// GET request for sold listings by owner
export async function getSoldListings(req, res) {
  try {
    const db = await getDb();
    const uid = req.query.uid;

    if (!uid) {
      return res.status(400).json({ error: "Missing UID" });
    }

    const listings = await db.collection('items')
      .find({ ownerUid: uid, sold: true })
      .sort({ soldAt: -1 }) // sort by sale date
      .toArray();

    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching sold listings:", error);
    res.status(500).json({ error: "Failed to fetch sold listings" });
  }
}