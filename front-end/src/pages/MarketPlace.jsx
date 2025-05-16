import MarketPlaceList from "../MarketPlaceList";
import listings from "../listing-content";


export default function MarketPlace() {
  return (
    <>
    <h1>Current Listings</h1>
    <MarketPlaceList listings={listings} />
    </>
  );
}