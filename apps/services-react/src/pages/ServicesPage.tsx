import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ServiceCategory } from '@shared-types/core';
import { useServices } from '../hooks/useServices';

export function ServicesPage(): JSX.Element {
  const { services, loading, error } = useServices();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory = !selectedCategory || service.category === selectedCategory;
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchTerm]);

  const categories: { value: ServiceCategory; label: string }[] = [
    { value: 'haircut' as ServiceCategory, label: 'Haircut' },
    { value: 'beard-trim' as ServiceCategory, label: 'Beard Trim' },
    { value: 'hair-beard' as ServiceCategory, label: 'Hair + Beard' },
    { value: 'hot-towel-shave' as ServiceCategory, label: 'Hot Towel Shave' },
    { value: 'kids-haircut' as ServiceCategory, label: 'Kids Haircut' },
    { value: 'styling' as ServiceCategory, label: 'Styling' },
  ];

  if (error) {
    return (
      <div className="services-container">
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <h2>Failed to load services</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-container">
      {/* Header */}
      <div className="services-header">
        <h1>Our Services</h1>
        <p>Professional barber services for all your grooming needs</p>
      </div>

      {/* Filters */}
      <div className="services-filters">
        <div className="filter-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ServiceCategory | '')}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading services...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-state">
          <h3>No services found</h3>
          <p>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="services-grid">
          {filteredServices.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-image" style={{ height: '200px', overflow: 'hidden' }}>
                {service.image?.startsWith('/') ? (
                  <img src={service.image} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  service.image || '💈'
                )}
              </div>
              <div className="service-content">
                {service.isPopular && <div className="service-badge popular">Popular</div>}
                {service.status !== 'active' && (
                  <div className="service-badge">Unavailable</div>
                )}
                <div className="service-category">{service.category}</div>
                <h3 className="service-name">{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-meta">
                  <div>
                    <div className="service-price">
                      {service.price}
                      <span className="service-currency"> {service.currency}</span>
                    </div>
                  </div>
                  <div className="service-duration">{service.duration} min</div>
                </div>
                <Link to={`/${service.id}`} className="cta-button">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
