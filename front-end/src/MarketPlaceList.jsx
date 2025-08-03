//File for the display of listings on the marketplace

import { Link } from "react-router-dom"

export default function MarketPlaceList({ listings }) {
  return (
    <>
    {listings.map(a => ( //Mapping each listing, Linked by name, with Name of listing and Title displayed to user
      <Link key={a.name} to={'/marketplace/' + a.name}>
        <h3>{a.name}</h3>
        <p>{a.title}</p>
      </Link>
    ))}
    </>
  )
}