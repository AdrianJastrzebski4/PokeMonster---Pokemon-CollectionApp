import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card">
      <h2>404</h2>
      <p className="small">
        Strona, której szukasz, nie istnieje.
      </p>

      <Link to="/karty">
        ← Wróć do strony głównej
      </Link>
    </div>
  );
}