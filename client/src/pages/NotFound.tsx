import { Link } from 'react-router-dom';
import { PageBanner } from '../components/Blocks';
import { Seo } from '../components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found | G|K Ventures" description="The page you requested could not be found." noindex />
      <PageBanner title="Page Not Found" crumbs={[{ label: '404' }]} />
      <section className="section">
        <div className="container narrow center">
          <p>Sorry, we couldn&apos;t find that page.</p>
          <Link to="/" className="btn btn--gold">
            Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}
