import { Link } from "react-router-dom"

export default function MarketPlaceList({ listings }) {
  return (
    <>
    {listings.map(a => (
      <Link key={a.name} to={'/marketplace/' + a.name}>
        <h3>{a.name}</h3>
        <p>{a.title[0].substring(0, 150)}</p>
      </Link>
    ))}
    </>
  )
}