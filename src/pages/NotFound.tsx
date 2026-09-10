import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="reading-page empty-state">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>Let’s find your place.</h1>
      <p>This lesson or page does not exist. Your progress is still here.</p>
      <Link to="/learn" className="button primary">
        Open the learning path
      </Link>
    </div>
  );
}
