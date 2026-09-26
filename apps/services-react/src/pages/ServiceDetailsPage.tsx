import { useParams, Link, useNavigate } from 'react-router-dom';
import { useServiceById } from '../hooks/useServices';

export function ServiceDetailsPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { service, loading, error } = useServiceById(id || '');

  if (error) {
    return (
      <div className="service-details">
        <h2>Failed to load service</h2>
        <p>{error.message}</p>
        <Link to="/" className="cta-button">
          Back to Services
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading service details...</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-details">
        <h2>Service not found</h2>
        <p>The service you're looking for doesn't exist.</p>
        <Link to="/" className="cta-button">
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="service-details">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '24px',
          background: 'none',
          border: 'none',
          color: '#b66a3c',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        ← Back
      </button>

      {/* Details Header */}
      <div className="details-header">
        <div className="details-image" style={{ height: '300px', overflow: 'hidden', borderRadius: '12px' }}>
          {service.image?.startsWith('/') ? (
            <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            service.image || '💈'
          )}
        </div>
        <div className="details-info">
          <div className="details-category">{service.category}</div>
          <h1>{service.name}</h1>
          <p className="details-description">{service.description}</p>

          {/* Meta Information */}
          <div className="details-meta">
            <div className="meta-item">
              <span className="meta-label">Price</span>
              <span className="meta-value">
                {service.price} {service.currency}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Duration</span>
              <span className="meta-value">{service.duration} minutes</span>
            </div>
          </div>

          {/* CTA */}
          <a href={`/booking?serviceId=${service.id}`} className="details-cta">
            Book This Service
          </a>
        </div>
      </div>

      {/* Additional Info */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '40px auto',
          padding: '0 24px',
        }}
      >
        <h2 style={{ marginBottom: '16px' }}>About This Service</h2>
        <p style={{ color: '#6f6861', lineHeight: '1.7' }}>
          Our {service.name} service is provided by professional and experienced barbers. We use
          premium tools and products to ensure the best results. Each appointment is personalized
          to meet your specific needs and preferences.
        </p>

        {/* Back to Services Link */}
        <div style={{ marginTop: '40px' }}>
          <Link to="/" style={{ color: '#b66a3c', textDecoration: 'none' }}>
            ← View all services
          </Link>
        </div>
      </div>
    </div>
  );
}
