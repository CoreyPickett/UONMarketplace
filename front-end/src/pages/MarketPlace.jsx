//Main marketplace page, displays current listings
import { useEffect, useState } from "react";
import axios from "axios";
import useListings from "../useListings";
import MarketPlaceList from "../MarketPlaceList";

export default function MarketPlace() {
  const { listings, loading } = useListings();

  return (
    <>
      <h1>Current Listings</h1>
      {loading ? <p>Loading...</p> : <MarketPlaceList listings={listings} />}
    </>
  );
}
