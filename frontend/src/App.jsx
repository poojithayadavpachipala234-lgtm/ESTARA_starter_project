import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  MapPin,
  BedDouble,
  Bath,
  MoveUpRight,
  Sparkles,
  Menu,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000';

const money = (value, type) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Price on request';

  if (type === 'Rent' || type === 'Lease') {
    return `₹${new Intl.NumberFormat('en-IN').format(amount)} / month`;
  }
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} L`;
  }
  return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
};

export default function App() {
  const [mode, setMode] = useState('Buy');
  const [query, setQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [apiState, setApiState] = useState('loading');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');

  // Fetch filtered listings from FastAPI whenever the mode or search changes.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setApiState('loading');
      setErrorMessage('');

      try {
        const params = new URLSearchParams();

        // Discover shows all listings. Sell and Invest are temporarily mapped
        // to Buy because the current demo backend has no separate data for them.
        if (mode === 'Buy' || mode === 'Rent' || mode === 'Lease') {
          params.set('listing_type', mode);
        } else if (mode === 'Sell' || mode === 'Invest') {
          params.set('listing_type', 'Buy');
        }

        if (query.trim()) params.set('q', query.trim());

        const response = await fetch(
          `${API}/api/properties${params.toString() ? `?${params.toString()}` : ''}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`API request failed (${response.status})`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('The properties endpoint did not return a list.');
        }

        setProperties(data);
        setApiState('online');
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('ESTARA API error:', error);
        setProperties([]);
        setErrorMessage(error.message || 'Could not connect to the ESTARA API.');
        setApiState('offline');
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mode, query]);

  // The API already filters the results, so do not filter them a second time.
  const visible = properties;

  const submitSearch = (event) => {
    event.preventDefault();
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
  };

  const chooseMode = (nextMode) => {
    setMode(nextMode);
    setMobileOpen(false);
  };

  const openProperty = async (property) => {
    setSelectedProperty(property);
    setDetailLoading(true);
    setDetailError('');
    setEnquirySent(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const response = await fetch(`${API}/api/properties/${encodeURIComponent(property.id)}`);
      if (!response.ok) throw new Error(response.status === 404 ? 'This property could not be found.' : `Could not load property details (${response.status}).`);
      const data = await response.json();
      setSelectedProperty(data);
    } catch (error) {
      console.error('ESTARA property details error:', error);
      // Keep the listing data visible as a fallback if the detail request fails.
      setDetailError(error.message || 'Could not load the latest property details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const backToListings = () => {
    setSelectedProperty(null);
    setDetailError('');
    setEnquirySent(false);
    window.setTimeout(() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  if (selectedProperty) {
    const property = selectedProperty;
    const title = property.title || 'Untitled property';
    const location = [property.locality, property.city].filter(Boolean).join(', ');
    const area = Number(property.area_sqft || 0);
    const isRental = property.listing_type === 'Rent' || property.listing_type === 'Lease';
    const facts = [
      { label: 'Bedrooms', value: property.bedrooms ?? '—' },
      { label: 'Bathrooms', value: property.bathrooms ?? '—' },
      { label: 'Built-up area', value: area ? `${area.toLocaleString('en-IN')} sq.ft.` : 'Not specified' },
      { label: 'Listing type', value: property.listing_type || 'Property' },
    ];
    return (
      <div className="site-shell" style={{ minHeight: '100vh', background: '#F5F0E6', color: '#183A2B' }}>
        <header className="nav-wrap" style={{ position: 'relative' }}>
          <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setSelectedProperty(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Estara home">
            <span className="brand-mark">E</span><span>ESTARA<small>PROPERTY INTELLIGENCE</small></span>
          </a>
          <button type="button" className="nav-item" onClick={backToListings} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>← Back to properties</button>
        </header>
        <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 22px 80px' }}>
          <button type="button" onClick={backToListings} style={{ border: 0, background: 'transparent', color: '#183A2B', cursor: 'pointer', padding: '10px 0', fontWeight: 600 }}>← Back to collection</button>
          {detailLoading && <p style={{ color: '#748C78' }}>Refreshing property details…</p>}
          {detailError && <p role="status" style={{ background: '#fff7e8', padding: 12, borderRadius: 8, color: '#6b4a12' }}>{detailError} Showing the listing information we already have.</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 32, alignItems: 'start', marginTop: 16 }}>
            <div>
              <div role="img" aria-label={title} style={{ minHeight: 320, aspectRatio: '4 / 3', borderRadius: 18, backgroundColor: '#dce5d8', backgroundImage: property.image_url ? `url("${property.image_url}")` : 'linear-gradient(135deg, #dce5d8, #a8c99b)', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', left: 16, top: 16, background: '#F5F0E6', borderRadius: 20, padding: '8px 12px', fontSize: 11, letterSpacing: 1.2, fontWeight: 700 }}>{property.is_demo ? 'DEMO LISTING' : 'ESTARA SELECT'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 14 }}>
                {facts.map((fact) => <div key={fact.label} style={{ padding: 16, background: '#fffdf8', borderRadius: 12 }}><div style={{ color: '#748C78', fontSize: 12, marginBottom: 7 }}>{fact.label}</div><strong>{fact.value}</strong></div>)}
              </div>
            </div>
            <section>
              <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, color: '#748C78', marginBottom: 12 }}>{[property.property_type, location].filter(Boolean).join(' · ').toUpperCase()}</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.08, margin: '0 0 16px' }}>{title}</h1>
              <p style={{ margin: '0 0 8px', color: '#52675a' }}>⌖ {location || 'Location not specified'}</p>
              <div style={{ fontSize: 28, fontWeight: 700, margin: '18px 0 8px' }}>{money(property.price_inr, property.listing_type)}</div>
              <div style={{ fontSize: 12, letterSpacing: 1.4, fontWeight: 700, marginBottom: 24, color: '#748C78' }}>{isRental ? `FOR ${property.listing_type.toUpperCase()}` : 'FOR SALE'}</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 25, fontWeight: 500 }}>About this property</h2>
              <p style={{ lineHeight: 1.8, color: '#52675a', whiteSpace: 'pre-line' }}>{property.description || 'A considered property in the ESTARA collection. Contact us to confirm the latest details, availability, and costs.'}</p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 25, fontWeight: 500, marginTop: 28 }}>Enquire about this property</h2>
              {enquirySent ? (
                <div role="status" style={{ padding: 18, borderRadius: 12, background: '#e4eedf', lineHeight: 1.6 }}><strong>Thank you for your interest.</strong><br />Your enquiry has been saved successfully. The ESTARA team can follow up using the contact details you provided.</div>
              ) : (
                <form onSubmit={async (event) => {
                  event.preventDefault();
                  setEnquiryError('');
                  setEnquirySubmitting(true);
                  const form = event.currentTarget;
                  const formData = new FormData(form);
                  const payload = {
                    property_id: property.id,
                    name: String(formData.get('name') || '').trim(),
                    contact: String(formData.get('contact') || '').trim(),
                    message: String(formData.get('message') || '').trim(),
                  };
                  try {
                    const response = await fetch(`${API}/api/enquiries`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    const result = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(result.detail || 'Could not save your enquiry. Please try again.');
                    setEnquirySent(true);
                  } catch (error) {
                    setEnquiryError(error.message || 'Could not connect to ESTARA. Please check that the backend is running.');
                  } finally {
                    setEnquirySubmitting(false);
                  }
                }} style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                  <input name="name" aria-label="Your name" autoComplete="name" required maxLength={100} placeholder="Your name" style={{ width: '100%', boxSizing: 'border-box', padding: '14px 15px', border: '1px solid #d8dfd3', borderRadius: 9, background: '#fffdf8', color: '#183A2B', font: 'inherit' }} />
                  <input name="contact" aria-label="Phone or email" autoComplete="email" required maxLength={200} placeholder="Phone number or email" style={{ width: '100%', boxSizing: 'border-box', padding: '14px 15px', border: '1px solid #d8dfd3', borderRadius: 9, background: '#fffdf8', color: '#183A2B', font: 'inherit' }} />
                  <textarea name="message" aria-label="Message" maxLength={2000} placeholder="What would you like to know? (optional)" rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '14px 15px', border: '1px solid #d8dfd3', borderRadius: 9, background: '#fffdf8', color: '#183A2B', font: 'inherit', resize: 'vertical' }} />
                  {enquiryError && <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 8, background: '#fff0ed', color: '#8b2e22', lineHeight: 1.5 }}>{enquiryError}</p>}
                  <button type="submit" disabled={enquirySubmitting} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 0, borderRadius: 9, padding: '15px 20px', background: enquirySubmitting ? '#748C78' : '#183A2B', color: '#F5F0E6', font: 'inherit', fontWeight: 700, cursor: enquirySubmitting ? 'wait' : 'pointer', opacity: enquirySubmitting ? 0.8 : 1 }}>{enquirySubmitting ? 'Saving enquiry…' : 'Request information'} <ArrowRight size={17} /></button>
                </form>
              )}
              <p style={{ color: '#748C78', fontSize: 12, lineHeight: 1.6, marginTop: 16 }}>Demo listing only. Verify availability, ownership, approvals, and all costs independently before making a decision.</p>
            </section>
          </div>
        </main>
        <footer><a className="brand footer-brand" href="#home" onClick={(event) => { event.preventDefault(); setSelectedProperty(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span className="brand-mark">E</span><span>ESTARA<small>PROPERTY INTELLIGENCE</small></span></a><p>Where Property Meets Intelligence.</p><span>© {new Date().getFullYear()} ESTARA · FOUNDATION BUILD</span></footer>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <div className="announcement">
        <span className="status-dot" />
        A more considered way to find your next property
        <span className="announce-right">PROPERTY, WITH PERSPECTIVE</span>
      </div>

      <header className="nav-wrap">
        <a className="brand" href="#home" aria-label="Estara home">
          <span className="brand-mark">E</span>
          <span>ESTARA<small>PROPERTY INTELLIGENCE</small></span>
        </a>
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
        <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}>
          {['Discover', 'Buy', 'Rent', 'Lease', 'Sell', 'Invest'].map((item) => (
            <button
              key={item}
              className={mode === item ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                chooseMode(item);
                document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <a className="nav-cta" href="#properties">
          Explore properties <ArrowUpRight size={15} />
        </a>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A NEW PERSPECTIVE ON PROPERTY</div>
            <h1>Find a place<br />that feels like <em>you.</em></h1>
            <p className="hero-description">
              Thoughtfully matched homes. Clearer decisions. A more intelligent way to move forward.
            </p>

            <form className="search-panel" onSubmit={submitSearch}>
              <div className="search-label"><Sparkles size={15} /> TELL US WHAT YOU'RE LOOKING FOR</div>
              <div className="search-row">
                <Search size={20} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="A calm 2BHK near Hyderabad's tech hubs..."
                  aria-label="Describe your property needs"
                />
                {query && (
                  <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">
                    ×
                  </button>
                )}
                <button type="submit" aria-label="Search properties"><ArrowRight size={20} /></button>
              </div>
              <div className="search-chips">
                {['Buy a home', 'Find a rental', 'Explore investments'].map((label, index) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => {
                      chooseMode(['Buy', 'Rent', 'Invest'][index]);
                      document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {label} <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
            </form>

            <div className="hero-foot">
              <div className="avatar-stack"><span>H</span><span>A</span><span>M</span></div>
              <p><strong>Property decisions, with more clarity.</strong><br />Your search starts here.</p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image" role="img" aria-label="Contemporary home surrounded by greenery" />
            <div className="image-caption"><span>THE ART OF LIVING WELL</span><span>01 / 04</span></div>
            <div className="floating-note">
              <span className="note-icon"><Sparkles size={17} /></span>
              <div><small>THE ESTARA APPROACH</small><strong>More than a listing.</strong><p>Find the right fit for your life.</p></div>
              <ArrowUpRight size={18} />
            </div>
            <div className="vertical-label">HOMES WITH A POINT OF VIEW — EST. 2026</div>
          </div>
          <div className="hero-stamp"><span>ESTARA</span><small>WHERE PROPERTY<br />MEETS INTELLIGENCE</small><ArrowDownRight size={18} /></div>
        </section>

        <section className="service-strip" aria-label="Property services">
          <span className="strip-label">ONE ADDRESS FOR EVERY MOVE</span>
          {['Buy a home', 'Find a rental', 'Lease a space', 'Sell a property', 'Invest wisely'].map((label, index) => (
            <button key={label} onClick={() => chooseMode(['Buy', 'Rent', 'Lease', 'Sell', 'Invest'][index])}>
              {label}<ArrowUpRight size={14} />
            </button>
          ))}
        </section>

        <section className="properties-section" id="properties">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> THE ESTARA SELECTION</div>
              <h2>Spaces worth<br /><em>coming home to.</em></h2>
            </div>
            <div className="section-side">
              <p>A considered collection of places to live, grow and invest. Begin with a feeling; we'll help with the details.</p>
              <button className="text-link" onClick={() => { setMode('Discover'); setQuery(''); }}>
                Explore the collection <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div className="property-toolbar">
            <div className="mode-tabs">
              {['Buy', 'Rent', 'Lease', 'Invest'].map((item) => (
                <button key={item} onClick={() => chooseMode(item)} className={mode === item ? 'selected' : ''}>
                  {item}
                </button>
              ))}
            </div>
            <div className="result-info">
              <span className={apiState === 'online' ? 'api-dot online' : 'api-dot'} />
              {apiState === 'online'
                ? `${visible.length} demo properties`
                : apiState === 'loading'
                  ? 'Connecting to Estara API…'
                  : 'API offline — start backend'}
              <SlidersHorizontal size={15} />
            </div>
          </div>

          {apiState === 'offline' ? (
            <div className="empty-state">
              <Sparkles size={24} />
              <h3>Connect to Estara</h3>
              <p>Start the Python API to load the demo property collection.</p>
              <code>uvicorn app.main:app --reload</code>
              {errorMessage && <p className="api-error">{errorMessage}</p>}
              <button className="text-link" onClick={() => window.location.reload()}>
                Retry connection <ArrowRight size={15} />
              </button>
            </div>
          ) : visible.length === 0 && apiState === 'online' ? (
            <div className="empty-state">
              <Search size={24} />
              <h3>No exact matches yet</h3>
              <p>Try another search or switch the property category.</p>
              <button className="text-link" onClick={() => { setQuery(''); setMode('Discover'); }}>
                Clear search <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="property-grid">
              {visible.map((property, index) => {
                const title = property.title || 'Untitled property';
                const propertyType = property.property_type || 'Property';
                const locality = property.locality || '';
                const city = property.city || '';
                const area = Number(property.area_sqft || 0);
                return (
                  <article className={`property-card card-${index}`} key={property.id} onClick={() => openProperty(property)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProperty(property); } }} role="button" tabIndex={0} aria-label={`View details for ${title}`} style={{ cursor: 'pointer' }}>
                    <div
                      className="property-photo"
                      style={property.image_url ? { backgroundImage: `url("${property.image_url}")` } : undefined}
                      role="img"
                      aria-label={title}
                    >
                      <span className="photo-tag">{property.is_demo ? 'DEMO LISTING' : 'ESTARA SELECT'}</span>
                      <button
                        className="photo-arrow"
                        aria-label={`View ${title}`}
                        onClick={(event) => { event.stopPropagation(); openProperty(property); }}
                      >
                        <MoveUpRight size={18} />
                      </button>
                    </div>
                    <div className="property-details">
                      <div className="property-topline">
                        <span>{propertyType.toUpperCase()}</span>
                        <span>{[locality, city].filter(Boolean).join(', ').toUpperCase()}</span>
                      </div>
                      <h3>{title}</h3>
                      <div className="property-facts">
                        <span><BedDouble size={15} />{property.bedrooms || '—'} beds</span>
                        <span><Bath size={15} />{property.bathrooms || '—'} baths</span>
                        <span><MapPin size={14} />{area ? area.toLocaleString('en-IN') : '—'} sq.ft.</span>
                      </div>
                      <div className="property-bottom">
                        <strong>{money(property.price_inr, property.listing_type)}</strong>
                        <span>{property.listing_type === 'Rent' ? 'FOR RENT' : property.listing_type === 'Lease' ? 'FOR LEASE' : 'FOR SALE'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <p className="demo-note">Demo listings are illustrative and are not verified offers. Confirm availability, ownership and all costs independently.</p>
        </section>

        <section className="intelligence-section">
          <div className="intelligence-image">
            <div className="intelligence-overlay"><span>THE NEXT CHAPTER</span><h2>A better move<br />begins with a<br /><em>better question.</em></h2></div>
          </div>
          <div className="intelligence-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> INTRODUCING ESTARA INTELLIGENCE</div>
            <h2>Less scrolling.<br /><em>More understanding.</em></h2>
            <p>Property is personal. Estara is being built to help you weigh the details that matter—from your everyday commute to the long-term cost of a place.</p>
            <div className="intelligence-list">
              <div><span>01</span><p><strong>Understand your needs</strong><small>Search in your own words, not just filters.</small></p><ArrowUpRight size={16} /></div>
              <div><span>02</span><p><strong>Compare with context</strong><small>See trade-offs, costs and practical details.</small></p><ArrowUpRight size={16} /></div>
              <div><span>03</span><p><strong>Decide with clarity</strong><small>Useful insights, transparent assumptions.</small></p><ArrowUpRight size={16} /></div>
            </div>
            <span className="coming-soon">AI FEATURES — BEING BUILT IN PHASES</span>
          </div>
        </section>

        <section className="closing-cta">
          <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER STARTS HERE</div><h2>Make room for<br /><em>what's next.</em></h2></div>
          <a href="#properties">Explore properties <ArrowUpRight size={17} /></a>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#home"><span className="brand-mark">E</span><span>ESTARA<small>PROPERTY INTELLIGENCE</small></span></a>
        <p>Where Property Meets Intelligence.</p>
        <span>© {new Date().getFullYear()} ESTARA · FOUNDATION BUILD</span>
      </footer>
    </div>
  );
}
